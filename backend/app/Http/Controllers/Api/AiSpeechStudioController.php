<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAiRecord;
use App\Models\SystemSetting;
use App\Models\Tenant;
use App\Services\AiGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AiSpeechStudioController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    /**
     * Transcribe Uploaded Audio File using Gemini 3.6 Multimodal Audio.
     * POST /api/ai-therapy/speech/transcribe-file
     */
    public function transcribeFile(Request $request): JsonResponse
    {
        $request->validate([
            'audio' => 'required_without:audio_base64|file|max:30720', // 30MB max
            'audio_base64' => 'required_without:audio|string',
            'mime_type' => 'nullable|string',
            'patient_id' => 'nullable|integer|exists:patients,id',
        ]);

        $audioMime = 'audio/mp3';
        $audioBase64 = '';

        if ($request->hasFile('audio')) {
            $file = $request->file('audio');
            $audioMime = $file->getMimeType() ?: 'audio/mp3';
            if ($audioMime === 'application/octet-stream') {
                $ext = strtolower($file->getClientOriginalExtension());
                $audioMime = match($ext) {
                    'wav' => 'audio/wav',
                    'm4a' => 'audio/m4a',
                    'ogg' => 'audio/ogg',
                    'webm' => 'audio/webm',
                    default => 'audio/mp3'
                };
            }
            $audioBase64 = base64_encode(file_get_contents($file->getRealPath()));
        } elseif ($request->filled('audio_base64')) {
            $raw = $request->input('audio_base64');
            if (preg_match('/^data:(audio\/[a-zA-Z0-9.-]+);base64,(.+)$/', $raw, $matches)) {
                $audioMime = $matches[1];
                $audioBase64 = $matches[2];
            } else {
                $audioBase64 = $raw;
                $audioMime = $request->input('mime_type', 'audio/mp3');
            }
        }

        if (empty($audioBase64)) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم استلام أي بيانات صوتية صالحة.',
            ], 422);
        }

        // Call Gemini Multimodal Audio
        $apiKey = SystemSetting::get('gemini_api_key') ?: config('services.gemini.api_key') ?: env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json([
                'success' => false,
                'message' => 'مفتاح Google Gemini API غير متوفر في الإعدادات.',
            ], 500);
        }

        $systemInstruction = <<<SYS
أنت مساعد تفريغ سريري متخصص في علم النفس، الأرطوفونيا، والطب النفسي للأطفال والبالغين (Clinical Speech & Dictation Transcriber).
المهمة: تفريغ المقطع الصوتي المرفق بدقة عالية مع ضبط المصطلحات الطبية والأرطوفونية والدارجة الجزائرية/العربية/الفرنسية.
قسّم المخرجات بصيغة JSON التالية بدقة:
{
  "transcript": "النص الكامل والمفصل للتسجيل الصوتي مع علامات الترقيم...",
  "speakers": [
    { "speaker": "المعالج/الطبيب", "text": "..." },
    { "speaker": "المريض/الولي", "text": "..." }
  ],
  "summary": "ملخص عيادي مكثف للنقاط الأساسية المذكورة في التسجيل",
  "key_clinical_findings": [
    "عرض أو ملاحظة سريرية 1",
    "عرض أو ملاحظة سريرية 2"
  ],
  "detected_language": "ar-DZ | fr | ar-SA"
}
SYS;

        $models = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'];
        $transcriptionData = null;
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
                                'text' => "قم بتفريغ وتحليل هذا التسجيل السريري بالكامل واستخراج التفريغ الدقيق والملاحظات بصيغة JSON."
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
                    if ($decoded && !empty($decoded['transcript'])) {
                        $transcriptionData = $decoded;
                        break;
                    }
                } else {
                    $errorMsg = $response->body();
                }
            } catch (\Throwable $e) {
                $errorMsg = $e->getMessage();
            }
        }

        if (!$transcriptionData) {
            Log::error("Speech Transcription Failed: " . $errorMsg);
            return response()->json([
                'success' => false,
                'message' => 'تعذر تفريغ التسجيل الصوتي. يرجى التأكد من وضوح الصوت وإعادة المحاولة.',
                'error_detail' => $errorMsg,
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تفريغ التسجيل الصوتي بنجاح!',
            'data' => $transcriptionData,
        ]);
    }

    /**
     * Convert Clinical Transcript or Dictation to Structured SOAP Note.
     * POST /api/ai-therapy/speech/convert-to-soap
     */
    public function convertToSoap(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'transcript' => 'required|string|min:5|max:15000',
            'patient_id' => 'nullable|integer|exists:patients,id',
            'specialty' => 'nullable|string|max:100',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id ?: 1;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;
        $specialty = $validated['specialty'] ?? 'أرطوفونيا وعلم النفس العيادي';

        $systemPrompt = <<<SYS
أنت أخصائي توثيق سريري طبي متقدم (Clinical SOAP Note Specialist).
المهمة: تحويل تفريغ الجلسة أو الإملاء الصوتي المرفق إلى تقرير SOAP طبي احترافي عالي الدقة.
قم بهيكلة المخرجات بصيغة JSON حصراً:
{
  "clinical_title": "عنوان الجلسة (مثلاً: جلسة تقييم التأتأة النمائية وتدريب التنفس الحجابي)",
  "subjective": "البيانات الذاتية (S): شكاوى المريض أو أقوال الولي، التاريخ المرضي الحديث، وتطور الأعراض المعبر عنها.",
  "objective": "الملاحظات الموضوعية (O): استجابات الفحص، القياسات والأداء السريري الملاحظ خلال الجلسة، السلوك واللغة غير اللفظية.",
  "assessment": "التقييم السريري (A): الاستنتاج التشخيصي، مدى التقدم نحو الأهداف السابقة، درجة الاستجابة للتدخل.",
  "plan": "الخطة العلاجية والتوجيهات (P): التدخلات المقررة للجلسة القادمة، التمارين المنزلية الموصى بها للولي، وموعد المتابعة."
}
SYS;

        $userPrompt = "تفريغ الجلسة السريرية المباشرة:\n" . $validated['transcript'];
        if ($patient) {
            $userPrompt .= "\nبيانات المريض: الاسم: {$patient->first_name} {$patient->last_name}، العمر: {$patient->age} سنوات.";
        }

        $result = $this->aiGateway->generate('clinical_speech_soap', $userPrompt, $systemPrompt, null, null, [
            'temperature' => 0.2,
            'max_tokens' => 3000,
            'format_json' => true,
        ]);

        $content = trim($result['content'] ?? '');
        if (str_starts_with($content, '```json')) $content = substr($content, 7);
        if (str_ends_with($content, '```')) $content = substr($content, 0, -3);
        $soapData = json_decode(trim($content), true);

        if (!$soapData || empty($soapData['subjective'])) {
            return response()->json([
                'success' => false,
                'message' => 'تعذر تحويل النص إلى تقرير SOAP مهيكل. يرجى المحاولة ثانية.',
            ], 500);
        }

        // Save to Patient AI Records if patient selected
        $savedRecordId = null;
        if ($patient) {
            try {
                $record = PatientAiRecord::create([
                    'clinic_id' => $tenantId,
                    'tenant_id' => $tenantId,
                    'patient_id' => $patient->id,
                    'user_id' => $user->id,
                    'tool_type' => 'soap',
                    'title' => 'تقرير SOAP: ' . ($soapData['clinical_title'] ?? 'جلسة علاجية'),
                    'summary' => Str::limit($soapData['assessment'] ?? '', 120),
                    'payload' => [
                        'soap' => $soapData,
                        'raw_transcript' => $validated['transcript'],
                        'specialty' => $specialty,
                    ],
                    'is_shared_with_portal' => true,
                ]);
                $savedRecordId = $record->id;
            } catch (\Throwable $e) {
                Log::warning('Failed to save speech SOAP to patient AI records: ' . $e->getMessage());
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم تحويل التفريغ الصوتي إلى تقرير SOAP سريري بنجاح!',
            'data' => [
                'soap' => $soapData,
                'patient_id' => $patient ? $patient->id : null,
                'record_id' => $savedRecordId,
            ]
        ]);
    }
}
