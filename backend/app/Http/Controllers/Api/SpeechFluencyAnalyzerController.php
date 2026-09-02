<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAiRecord;
use App\Models\SpeechFluencyAssessment;
use App\Models\SystemSetting;
use App\Models\Tenant;
use App\Services\AiGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SpeechFluencyAnalyzerController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    /**
     * Analyze Speech Fluency, Stuttering Percentage (%SS), and Disfluencies.
     * POST /api/ai-therapy/orthophonie/analyze-fluency
     */
    public function analyzeFluency(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => 'required_without:audio_base64|file|max:30720',
            'audio_base64' => 'required_without:audio|string',
            'mime_type' => 'nullable|string',
            'patient_id' => 'nullable|integer|exists:patients,id',
            'language' => 'nullable|string|in:ar-DZ,ar-SA,fr-FR',
            'speech_task' => 'nullable|string|in:picture_naming,reading_passage,spontaneous_dialogue',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;
        $patient = !empty($request->patient_id) ? Patient::find($request->patient_id) : null;
        $language = $request->input('language', 'ar-DZ');
        $speechTask = $request->input('speech_task', 'spontaneous_dialogue');

        $audioMime = 'audio/mp3';
        $audioBase64 = '';
        $publicAudioUrl = null;

        // Ensure storage directory
        $recordsDir = public_path('storage/fluency_records');
        if (!File::exists($recordsDir)) {
            File::makeDirectory($recordsDir, 0775, true);
        }

        if ($request->hasFile('audio')) {
            $file = $request->file('audio');
            $ext = strtolower($file->getClientOriginalExtension()) ?: 'mp3';
            $audioMime = $file->getMimeType() ?: 'audio/mp3';
            if ($audioMime === 'application/octet-stream') {
                $audioMime = match($ext) {
                    'wav' => 'audio/wav',
                    'm4a' => 'audio/m4a',
                    'ogg' => 'audio/ogg',
                    'webm' => 'audio/webm',
                    default => 'audio/mp3'
                };
            }
            $audioBase64 = base64_encode(file_get_contents($file->getRealPath()));

            $savedName = 'fluency_' . Str::random(16) . '.' . $ext;
            $file->move($recordsDir, $savedName);
            $publicAudioUrl = url('/storage/fluency_records/' . $savedName);
        } elseif ($request->filled('audio_base64')) {
            $raw = $request->input('audio_base64');
            if (preg_match('/^data:(audio\/[a-zA-Z0-9.-]+);base64,(.+)$/', $raw, $matches)) {
                $audioMime = $matches[1];
                $audioBase64 = $matches[2];
            } else {
                $audioBase64 = $raw;
                $audioMime = $request->input('mime_type', 'audio/mp3');
            }

            $savedName = 'fluency_' . Str::random(16) . '.mp3';
            File::put($recordsDir . '/' . $savedName, base64_decode($audioBase64));
            $publicAudioUrl = url('/storage/fluency_records/' . $savedName);
        }

        // Call Gemini Multimodal Audio Phonetic Analysis
        $apiKey = SystemSetting::get('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'مفتاح Google Gemini API غير متوفر في الإعدادات.',
            ], 500);
        }

        $systemInstruction = <<<SYS
أنت أخصائي أرطوفونيا وعلم الصوتيات العيادي المتخصص في تشخيص التأتأة وعثرات طلاقة الكلام (Speech-Language Pathologist & Phonetician).
المهمة: تحليل المقطع الصوتي للمريض وحساب القياسات الكمية والنوعية لطلاقة الكلام بدقة متناهية:
1. التفريغ الصوتي الحرفي الكامل (Transcript).
2. حساب الحجم اللفظي (الكلمات والمقاطع الصوتية التقريبية).
3. تحديد وتصنيف كل عثرة كلامية بدقة:
   - تكرار (Repetition): تكرار صوت، مقطع، أو كلمة كاملة.
   - إطالة (Prolongation): مد الأصوات الصامتة أو الصائتة لأكثر من 0.5 ثانية.
   - حبسة (Block): توقف صامت أو انسداد هوائي قبل انطلاق الصوت (>0.5 ثانية).
   - حشوات وتداخلات (Interjections).
4. حساب نسبة المقاطع المتأتأة: %SS = (المقاطع المتأتأة / إجمالي المقاطع) * 100.
5. تحديد درجة الشدة (Severity Level):
   - "mild": %SS أقل من 4%
   - "moderate": %SS من 4% إلى 9%
   - "severe": %SS من 9% إلى 15%
   - "very_severe": %SS أكبر من 15%
6. وضع خطة علاجية أرطوفونية عملية وتقنيات مستهدفة (مثل Easy Onset، تمديد الكلام، التنفس الحجابي) وإرشادات للأسرة.

أرجع النتيجة بصيغة JSON حصراً بهذا الهيكل:
{
  "transcript": "النص الكامل للمقطع مع الكلمات...",
  "duration_seconds": 15.0,
  "total_words": 32,
  "total_syllables": 52,
  "stuttered_syllables_percentage": 7.7,
  "repetition_count": 2,
  "prolongation_count": 1,
  "block_count": 1,
  "avg_block_duration_sec": 1.2,
  "speech_rate_wpm": 128.0,
  "severity_level": "moderate",
  "disfluency_events": [
    {
      "type": "block",
      "word": "المدرسة",
      "syllable": "الـ",
      "timestamp_sec": 2.5,
      "duration_sec": 1.2,
      "secondary_behaviors": "توتر في عضلات الشفاه والحنجرة"
    },
    {
      "type": "repetition",
      "word": "أ... أنا",
      "syllable": "أ",
      "timestamp_sec": 5.1,
      "duration_sec": 0.6,
      "secondary_behaviors": "تكرار صوتي سريع"
    }
  ],
  "phonetic_analysis_summary": "تقرير سريري تحليلي حول طبيعة العثرات والأنماط الغالبة وطلاقة الكلام.",
  "targeted_therapy_techniques": [
    { "name": "تقنية البدء السلس (Easy Onset)", "description": "تمرين المريض على إطلاق الحروف الانفجارية بضغط هوائي تدريجي ولين." },
    { "name": "التحكم في التنفس الحجابي المتناغم", "description": "مزامنة زفير الهواء الهادئ مع بداية المقطع اللفظي لمنع الحبسة." }
  ],
  "home_guidelines_for_parents": [
    "الاستماع للطفل باهتمام وتجنب قول (تكلم ببطء) أو (خذ نفساً).",
    "توفير بيئة تواصل هادئة وغير متوترة في المنزل."
  ]
}
SYS;

        $taskNames = [
            'picture_naming' => 'تسمية صور وتعبير موجه',
            'reading_passage' => 'قراءة نص معياري',
            'spontaneous_dialogue' => 'حوار عفوي وتعبير حر'
        ];

        $userPrompt = "المهمة السريرية: " . ($taskNames[$speechTask] ?? 'حوار حر') . "\nاللغة: {$language}";
        if ($patient) {
            $userPrompt .= "\nبيانات المريض: الاسم: {$patient->first_name} {$patient->last_name}، العمر: {$patient->age} سنوات.";
        }

        $models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
        $assessmentData = null;
        $errorMsg = '';

        foreach ($models as $model) {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . $apiKey;

            $payload = [
                'contents' => [
                    [
                        'role' => 'user',
                        'parts' => [
                            [
                                'inline_data' => [
                                    'mime_type' => $audioMime,
                                    'data' => $audioBase64
                                ]
                            ],
                            [
                                'text' => "قم بفحص وتحليل طلاقة النطق والعثرات وحساب نسبة التأتأة والشدة بصيغة JSON."
                            ]
                        ]
                    ]
                ],
                'system_instruction' => [
                    'parts' => [
                        ['text' => $systemInstruction]
                    ]
                ],
                'generationConfig' => [
                    'temperature' => 0.1,
                    'maxOutputTokens' => 4000,
                    'responseMimeType' => 'application/json',
                ]
            ];

            try {
                $response = Http::timeout(60)->post($url, $payload);
                if ($response->successful()) {
                    $json = $response->json();
                    $rawText = $json['candidates'][0]['content']['parts'][0]['text'] ?? '';
                    $decoded = json_decode(trim($rawText), true);
                    if ($decoded && isset($decoded['stuttered_syllables_percentage'])) {
                        $assessmentData = $decoded;
                        break;
                    }
                } else {
                    $errorMsg = $response->body();
                }
            } catch (\Throwable $e) {
                $errorMsg = $e->getMessage();
            }
        }

        if (!$assessmentData) {
            Log::error("Fluency Analysis Failed: " . $errorMsg);
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحليل طلاقة النطق. يرجى التأكد من نقاء الصوت وإعادة المحاولة.',
                'error_detail' => $errorMsg,
            ], 500);
        }

        // Save assessment to database
        $assessmentRecord = SpeechFluencyAssessment::create([
            'clinic_id' => $tenantId,
            'tenant_id' => $tenantId,
            'patient_id' => $patient ? $patient->id : null,
            'user_id' => $user->id,
            'audio_path' => $publicAudioUrl,
            'duration_seconds' => floatval($assessmentData['duration_seconds'] ?? 0),
            'total_words' => intval($assessmentData['total_words'] ?? 0),
            'total_syllables' => intval($assessmentData['total_syllables'] ?? 0),
            'stuttered_syllables_percentage' => floatval($assessmentData['stuttered_syllables_percentage'] ?? 0),
            'repetition_count' => intval($assessmentData['repetition_count'] ?? 0),
            'prolongation_count' => intval($assessmentData['prolongation_count'] ?? 0),
            'block_count' => intval($assessmentData['block_count'] ?? 0),
            'avg_block_duration_sec' => floatval($assessmentData['avg_block_duration_sec'] ?? 0),
            'speech_rate_wpm' => floatval($assessmentData['speech_rate_wpm'] ?? 0),
            'severity_level' => $assessmentData['severity_level'] ?? 'moderate',
            'speech_task' => $speechTask,
            'language' => $language,
            'detailed_disfluencies_json' => $assessmentData,
            'clinical_recommendations' => $assessmentData['phonetic_analysis_summary'] ?? '',
        ]);

        // Attach to Patient AI Records if patient selected
        $savedRecordId = null;
        if ($patient) {
            try {
                $sevAr = match($assessmentData['severity_level'] ?? 'moderate') {
                    'mild' => 'خفيفة',
                    'severe' => 'شديدة',
                    'very_severe' => 'شديدة جداً',
                    default => 'متوسطة',
                };

                $record = PatientAiRecord::create([
                    'clinic_id' => $tenantId,
                    'tenant_id' => $tenantId,
                    'patient_id' => $patient->id,
                    'user_id' => $user->id,
                    'tool_type' => 'bilan',
                    'title' => "فحص طلاقة النطق والتأتأة (%SS: {$assessmentRecord->stuttered_syllables_percentage}%)",
                    'summary' => "تأتأة بدرجة {$sevAr} بنسبة عثرات {$assessmentRecord->stuttered_syllables_percentage}% وسرعة نطق {$assessmentRecord->speech_rate_wpm} WPM.",
                    'payload' => [
                        'assessment_id' => $assessmentRecord->id,
                        'audio_url' => $publicAudioUrl,
                        'metrics' => [
                            'stuttered_syllables_percentage' => $assessmentRecord->stuttered_syllables_percentage,
                            'severity_level' => $assessmentRecord->severity_level,
                            'speech_rate_wpm' => $assessmentRecord->speech_rate_wpm,
                            'repetition_count' => $assessmentRecord->repetition_count,
                            'prolongation_count' => $assessmentRecord->prolongation_count,
                            'block_count' => $assessmentRecord->block_count,
                        ],
                        'assessment' => $assessmentData,
                    ],
                    'is_shared_with_portal' => true,
                ]);
                $savedRecordId = $record->id;
            } catch (\Throwable $e) {
                Log::warning('Failed to save fluency assessment to patient AI records: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم فحص وتحليل طلاقة النطق والتأتأة بنجاح!',
            'data' => [
                'id' => $assessmentRecord->id,
                'audio_url' => $publicAudioUrl,
                'assessment' => $assessmentData,
                'record_id' => $savedRecordId,
                'patient_id' => $patient ? $patient->id : null,
                'created_at' => $assessmentRecord->created_at->toIso8601String(),
            ]
        ]);
    }

    /**
     * Get Fluency Assessments History.
     * GET /api/ai-therapy/orthophonie/assessments
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;
        $patientId = $request->query('patient_id');

        $query = SpeechFluencyAssessment::where(function($q) use ($tenantId) {
            $q->where('tenant_id', $tenantId)->orWhereNull('tenant_id');
        });

        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        $assessments = $query->orderBy('created_at', 'desc')->limit(30)->get();

        return response()->json([
            'success' => true,
            'assessments' => $assessments,
        ]);
    }
}
