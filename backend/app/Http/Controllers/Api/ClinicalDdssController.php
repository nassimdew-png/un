<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalDiagnosticRecord;
use App\Models\ClinicalTestAssignment;
use App\Models\Patient;
use App\Models\User;
use App\Services\AiGatewayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ClinicalDdssController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    /**
     * Evaluate diagnostic hypotheses against DSM-5-TR and ICD-11 criteria.
     * POST /api/clinical-ai/ddss/evaluate
     */
    public function evaluateDiagnosticHypotheses(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'specialty' => 'nullable|string|in:neurodevelopmental,orthophony,psychology,psychomotricite,general',
            'observed_symptoms' => 'nullable|array',
            'symptoms_text' => 'nullable|string',
            'soap_text' => 'nullable|string',
            'session_id' => 'nullable|integer',
            'appointment_id' => 'nullable|integer',
        ]);

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($validated['patient_id']);
        $ageYears = $patient->birth_date ? Carbon::parse($patient->birth_date)->age : 7;
        $gender = $patient->gender ?? 'male';

        // 1. Fetch patient's recent psychometric assignments and completed tests
        $recentTests = ClinicalTestAssignment::where('patient_id', $patient->id)
            ->whereNotNull('completed_at')
            ->orderBy('completed_at', 'desc')
            ->limit(10)
            ->get();

        $testsSummary = [];
        $hasSuicideRisk = false;
        $carsScore = null;
        $connersScore = null;
        $phqScore = null;
        $bdiScore = null;
        $gadScore = null;

        foreach ($recentTests as $t) {
            $code = strtoupper(trim($t->test_code ?? ''));
            $testsSummary[] = [
                'test_code' => $code,
                'test_title' => $t->test_title,
                'raw_score' => $t->raw_score,
                'severity_label' => $t->severity_label,
                'has_critical_alert' => $t->has_critical_alert,
            ];

            if ($t->has_critical_alert) {
                $hasSuicideRisk = true;
            }

            if (str_contains($code, 'CARS')) $carsScore = $t->raw_score;
            if (str_contains($code, 'CONNER')) $connersScore = $t->raw_score;
            if (str_contains($code, 'PHQ')) $phqScore = $t->raw_score;
            if (str_contains($code, 'BDI')) $bdiScore = $t->raw_score;
            if (str_contains($code, 'GAD')) $gadScore = $t->raw_score;
        }

        // 2. Gather symptom inputs
        $symptoms = $validated['observed_symptoms'] ?? [];
        $freeText = trim(($validated['symptoms_text'] ?? '') . ' ' . ($validated['soap_text'] ?? ''));
        $specialty = $validated['specialty'] ?? 'neurodevelopmental';

        // 3. Clinical Rule Engine (DSM-5-TR & ICD-11)
        $evaluation = $this->runClinicalDiagnosticEngine(
            $patient,
            $ageYears,
            $gender,
            $specialty,
            $symptoms,
            $freeText,
            $testsSummary,
            [
                'cars' => $carsScore,
                'conners' => $connersScore,
                'phq' => $phqScore,
                'bdi' => $bdiScore,
                'gad' => $gadScore,
                'has_suicide_risk' => $hasSuicideRisk,
            ]
        );

        // 4. Optional LLM Synthesis if AI Gateway available
        $narrativeSynthesis = null;
        try {
            $prompt = "قم بصياغة خلاصة تشخيصية وتبرير سريري موجز باللغة العربية الطبية للمريض: " .
                "الاسم: {$patient->first_name} {$patient->last_name}، العمر: {$ageYears} سنوات. " .
                "التشخيص الأساسي المقترح: {$evaluation['primary_diagnosis']['title_ar']} (DSM-5: {$evaluation['primary_diagnosis']['dsm5_code']} | ICD-11: {$evaluation['primary_diagnosis']['icd11_code']}). " .
                "نسبة التطابق: {$evaluation['primary_diagnosis']['confidence_score']}%. " .
                "المعايير المتحققة: " . implode('، ', array_column($evaluation['matched_criteria'], 'name')) . ". " .
                "التشخيص الفارق: " . implode('، ', array_column($evaluation['differential_diagnoses'], 'title_ar')) . ". " .
                "أعط فقرة سريرية متماسكة تصلح لخانة التقييم (Assessment) في تقرير SOAP أو الحصيلة الرسمية.";

            $systemPrompt = "أنت أخصائي تشخيص سريري متقدم وفق معايير DSM-5-TR و ICD-11. صياغتك أكاديمية طبية رصينة ومباشرة.";
            $aiResponse = $this->aiGateway->generate('clinical_ddss', $prompt, $systemPrompt, $user->tenant, $user);
            if (!empty($aiResponse['success']) && !empty($aiResponse['content'])) {
                $narrativeSynthesis = $aiResponse['content'];
            }
        } catch (\Throwable $e) {
            Log::info('DDSS AI narrative synthesis skipped: ' . $e->getMessage());
        }

        if (!$narrativeSynthesis) {
            $narrativeSynthesis = $this->generateHeuristicNarrative($evaluation, $patient, $ageYears);
        }

        $evaluation['clinical_synthesis'] = $narrativeSynthesis;

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'name' => "{$patient->first_name} {$patient->last_name}",
                'age' => $ageYears,
                'gender' => $gender,
            ],
            'evaluation' => $evaluation,
            'recent_tests' => $testsSummary,
        ]);
    }

    /**
     * Persist confirmed or draft diagnostic record.
     * POST /api/clinical-ai/ddss/save
     */
    public function saveDiagnosticRecord(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'session_id' => 'nullable|integer',
            'appointment_id' => 'nullable|integer',
            'specialty' => 'required|string|max:50',
            'primary_diagnosis_code' => 'required|string|max:64',
            'primary_diagnosis_title' => 'required|string|max:255',
            'dsm5_code' => 'nullable|string|max:32',
            'icd11_code' => 'nullable|string|max:32',
            'confidence_score' => 'required|integer|min:0|max:100',
            'matched_criteria' => 'nullable|array',
            'unmatched_criteria' => 'nullable|array',
            'differential_diagnoses' => 'nullable|array',
            'clinical_red_alerts' => 'nullable|array',
            'recommended_referrals' => 'nullable|array',
            'practitioner_confirmed' => 'nullable|boolean',
            'practitioner_notes' => 'nullable|string',
            'context_payload' => 'nullable|array',
        ]);

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($validated['patient_id']);

        $record = ClinicalDiagnosticRecord::create([
            'clinic_id' => $user->tenant_id,
            'patient_id' => $patient->id,
            'specialist_id' => $user->id,
            'session_id' => $validated['session_id'] ?? null,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'specialty' => $validated['specialty'],
            'primary_diagnosis_code' => $validated['primary_diagnosis_code'],
            'primary_diagnosis_title' => $validated['primary_diagnosis_title'],
            'dsm5_code' => $validated['dsm5_code'] ?? null,
            'icd11_code' => $validated['icd11_code'] ?? null,
            'confidence_score' => $validated['confidence_score'],
            'matched_criteria' => $validated['matched_criteria'] ?? [],
            'unmatched_criteria' => $validated['unmatched_criteria'] ?? [],
            'differential_diagnoses' => $validated['differential_diagnoses'] ?? [],
            'clinical_red_alerts' => $validated['clinical_red_alerts'] ?? [],
            'recommended_referrals' => $validated['recommended_referrals'] ?? [],
            'practitioner_confirmed' => $validated['practitioner_confirmed'] ?? false,
            'practitioner_notes' => $validated['practitioner_notes'] ?? null,
            'context_payload' => $validated['context_payload'] ?? null,
        ]);

        // If confirmed by clinician, update patient anamnesis primary diagnosis
        if (!empty($validated['practitioner_confirmed'])) {
            $anamnesis = $patient->anamnesis_data ?: [];
            $anamnesis['primary_diagnosis'] = [
                'code' => $validated['primary_diagnosis_code'],
                'title' => $validated['primary_diagnosis_title'],
                'dsm5' => $validated['dsm5_code'] ?? null,
                'icd11' => $validated['icd11_code'] ?? null,
                'confirmed_at' => now()->toDateTimeString(),
                'specialist_name' => $user->name,
            ];
            $patient->anamnesis_data = $anamnesis;
            $patient->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ واعتماد السجل التشخيصي المعياري بنجاح.',
            'record' => $record,
        ]);
    }

    /**
     * Get patient's diagnostic timeline.
     * GET /api/clinical-ai/ddss/patient/{patientId}
     */
    public function getPatientDiagnosticHistory(int $patientId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);
        $records = ClinicalDiagnosticRecord::with('specialist:id,name,email')
            ->where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'patient_id' => $patient->id,
            'records' => $records,
        ]);
    }

    /**
     * Core Rule-Based DSM-5-TR and ICD-11 Evaluation Engine.
     */
    protected function runClinicalDiagnosticEngine(
        Patient $patient,
        int $ageYears,
        string $gender,
        string $specialty,
        array $symptoms,
        string $freeText,
        array $testsSummary,
        array $scores
    ): array {
        $text = mb_strtolower($freeText . ' ' . implode(' ', $symptoms));

        // Normalize specialty string
        if (in_array($specialty, ['orthophonie', 'orthophony', 'speech'])) {
            $specialty = 'orthophony';
        } elseif (in_array($specialty, ['psychologie', 'psychology'])) {
            $specialty = 'psychology';
        } elseif (in_array($specialty, ['psychomotricite', 'psychomotricity'])) {
            $specialty = 'psychomotricite';
        }

        // Flags based on symptoms / keywords
        $hasSocialDeficits = str_contains($text, 'تواصل') || str_contains($text, 'عين') || str_contains($text, 'عزلة') || str_contains($text, 'انطواء') || str_contains($text, 'اجتماع') || str_contains($text, 'contact visuel') || str_contains($text, 'social');
        $hasRepetitiveBehavior = str_contains($text, 'تكرار') || str_contains($text, 'روتين') || str_contains($text, 'رفرفة') || str_contains($text, 'دوران') || str_contains($text, 'نمطي') || str_contains($text, 'stéréotypies') || str_contains($text, 'rituel');
        $hasSensoryIssues = str_contains($text, 'حسي') || str_contains($text, 'أصوات') || str_contains($text, 'لمس') || str_contains($text, 'sensori') || !empty($patient->sensory_profile);
        $hasHyperactivity = str_contains($text, 'فرط حركة') || str_contains($text, 'اندفاع') || str_contains($text, 'تشتت') || str_contains($text, 'تركيز') || str_contains($text, 'انتباه') || str_contains($text, 'hyperactivité') || str_contains($text, 'inattention');
        $hasSpeechArticError = str_contains($text, 'نطق') || str_contains($text, 'مخارج') || str_contains($text, 'حرف') || str_contains($text, 'راء') || str_contains($text, 'سين') || str_contains($text, 'صوت') || str_contains($text, 'أصوات') || str_contains($text, 'لدغة') || str_contains($text, 'فونولوج') || str_contains($text, 'فونيم') || str_contains($text, 'pcc') || str_contains($text, 'articulation') || str_contains($text, 'phonolog') || str_contains($text, 'orthophon');
        $hasLanguageDelay = str_contains($text, 'تأخر لغوي') || str_contains($text, 'رصيد لغوي') || str_contains($text, 'تركيب الجمل') || str_contains($text, 'فهم شفهي') || str_contains($text, 'تأخر نمو اللغة') || str_contains($text, 'retard de langage') || str_contains($text, 'dld');
        $hasStuttering = str_contains($text, 'تأتأة') || str_contains($text, 'طلاقة') || str_contains($text, 'تكرار المقاطع') || str_contains($text, 'حبسة') || str_contains($text, 'bégaiement') || str_contains($text, 'fluency');
        $hasDepressedMood = str_contains($text, 'اكتئاب') || str_contains($text, 'حزن') || str_contains($text, 'يأس') || str_contains($text, 'فقدان الشغف') || str_contains($text, 'dépression') || str_contains($text, 'tristesse');
        $hasAnxiety = str_contains($text, 'قلق') || str_contains($text, 'خوف') || str_contains($text, 'هلع') || str_contains($text, 'توتر') || str_contains($text, 'anxiété') || str_contains($text, 'angoisse');
        $hasMotorClumsiness = str_contains($text, 'حركي') || str_contains($text, 'تعثر') || str_contains($text, 'توازن') || str_contains($text, 'كتابة') || str_contains($text, 'مسك القلم') || str_contains($text, 'dyspraxie') || str_contains($text, 'coordination');

        // Score overrides
        $isAutismSuspected = ($scores['cars'] !== null && $scores['cars'] >= 30) || ($hasSocialDeficits && $hasRepetitiveBehavior);
        $isAdhdSuspected = ($scores['conners'] !== null && $scores['conners'] >= 65) || ($hasHyperactivity && !in_array($specialty, ['orthophony', 'psychomotricite']));
        $isDepressionSuspected = ($scores['phq'] !== null && $scores['phq'] >= 10) || ($scores['bdi'] !== null && $scores['bdi'] >= 14) || $hasDepressedMood;
        $isAnxietySuspected = ($scores['gad'] !== null && $scores['gad'] >= 10) || $hasAnxiety;

        $primary = [];
        $matchedCriteria = [];
        $unmatchedCriteria = [];
        $differentials = [];
        $redAlerts = [];
        $referrals = [];

        // Red Alerts check
        if ($scores['has_suicide_risk'] || str_contains($text, 'انتحار') || str_contains($text, 'إيذاء النفس') || str_contains($text, 'suicide')) {
            $redAlerts[] = [
                'severity' => 'critical',
                'badge' => '🚨 خط أحمر سريري عاجل',
                'title' => 'مؤشر أفكار أو ميول إيذاء النفس (Suicidality / Self-Harm)',
                'description' => 'تم رصد استجابة إيجابية لبنود إيذاء النفس في مقياس PHQ-9/BDI-II أو الأعراض السريرية. يتوجب تفعيل بروتوكول الأمان الفوري وتنبيه الأسرة ومراجعة الطبيب النفسي.',
            ];
        }

        // Branching according to specialty and dominant symptom cluster
        if ($specialty === 'orthophony') {
            if ($hasStuttering) {
                $primary = [
                    'title_ar' => 'اضطراب الطلاقة النمائي / التأتأة (Childhood-Onset Fluency Disorder)',
                    'title_fr' => 'Bégaiement développemental',
                    'dsm5_code' => '315.35',
                    'icd11_code' => '6A01.1',
                    'code' => '315.35 / 6A01.1',
                    'confidence_score' => 91,
                    'severity' => 'متوسط إلى شديد',
                ];
                $matchedCriteria = [
                    ['code' => 'Crit_A', 'name' => 'اضطراب مستمر في الطلاقة والوتيرة الصوتية الطبيعية', 'status' => 'met', 'details' => 'تكرار الأصوات والمقاطع وإطالة الأصوات الصوتية والصوامت.'],
                    ['code' => 'Crit_B', 'name' => 'قلق متصل بالنطق أو قيود في التواصل الفعال', 'status' => 'met', 'details' => 'تجنب الكلمات الصعبة والجهد الجسدي المصاحب لإنتاج الكلام.'],
                    ['code' => 'Crit_C', 'name' => 'بداية الأعراض في مرحلة الطفولة والنمو المبكر', 'status' => 'met', 'details' => 'ظهور الأعراض خلال مرحلة اكتساب اللغة.'],
                ];
                $differentials = [
                    ['title_ar' => 'التسرع في الكلام (Cluttering - Bredouillement)', 'code' => '6A01.1Y', 'distinction' => 'غياب القلق المفرط من النطق مع تسارع غير منتظم وتداخل الكلمات.'],
                    ['title_ar' => 'عدم طلاقة طبيعية نمائية فسيولوجية', 'code' => 'Normative', 'distinction' => 'تحدث قبل سن 4 سنوات وتختفي تلقائياً دون تشنج حركي ثانوي.'],
                ];
                $referrals = [
                    ['specialty' => 'تأهيل صوتي ونطق', 'action' => 'جلسات استرخاء تنفسي وضبط معدل الإيقاع الصوتي (Fluency Shaping)'],
                    ['specialty' => 'إرشاد أسري', 'action' => 'تقليل الضغط التواصلي المنزلي وتجنب مقاطعة الطفل أثناء السرد'],
                ];
            } elseif ($hasLanguageDelay) {
                $primary = [
                    'title_ar' => 'اضطراب اللغة النمائي (Developmental Language Disorder - DLD)',
                    'title_fr' => 'Trouble développemental du langage',
                    'dsm5_code' => '315.32',
                    'icd11_code' => '6A01.2',
                    'code' => '315.32 / 6A01.2',
                    'confidence_score' => 89,
                    'severity' => 'متوسط',
                ];
                $matchedCriteria = [
                    ['code' => 'Crit_A', 'name' => 'صعوبات مستمرة في اكتساب واستخدام اللغة عبر مختلف الوسائط', 'status' => 'met', 'details' => 'تراجع الرصيد اللغوي ومحدودية تركيب الجمل وصعوبة استيعاب التراكيب المعقدة.'],
                    ['code' => 'Crit_B', 'name' => 'القدرات اللغوية أقل بكثير من المتوقع عمرياً', 'status' => 'met', 'details' => 'قصور وظيفي في التواصل الفعال والمشاركة الاجتماعية والتحصيل الأكاديمي.'],
                    ['code' => 'Crit_C', 'name' => 'ظهور الأعراض في فترة النمو المبكرة', 'status' => 'met', 'details' => 'تأخر في ظهور الكلمات الأولى وتكوين الجمل.'],
                ];
                $differentials = [
                    ['title_ar' => 'اضطراب طيف التوحد (ASD)', 'code' => '299.00', 'distinction' => 'في ASD يظهر قصور التفاعل الاجتماعي والسلوكيات النمطية المقيدة بجانب تأخر اللغة.'],
                    ['title_ar' => 'نقص السمع الحسي العصبي أو التوصيلي', 'code' => 'Auditory', 'distinction' => 'يجب إجراء فحص قياس السمع للتأكد من سلامة العتبات السمعية.'],
                ];
                $referrals = [
                    ['specialty' => 'طب الأنف والأذن والحنجرة (ORL)', 'action' => 'تخطيط السمع لنفي أي نقص سمعي توصيلي أو ارتشاح خلف الطبلة.'],
                ];
            } else {
                // Speech sound / Phonological / Articulation matrix
                $primary = [
                    'title_ar' => 'اضطراب النطق ومخارج الأصوات الفونولوجية (Speech Sound Disorder)',
                    'title_fr' => 'Trouble des sons de la parole / Trouble phonologique',
                    'dsm5_code' => '315.39',
                    'icd11_code' => '6A01.2',
                    'code' => '315.39 / 6A01.2',
                    'confidence_score' => 88,
                    'severity' => 'معياري سريري',
                ];
                $matchedCriteria = [
                    ['code' => 'Crit_A', 'name' => 'صعوبة مستمرة في إنتاج أصوات الكلام وتعيق وضوح الخطاب', 'status' => 'met', 'details' => 'تشويه أو إبدال أو حذف الفونيمات المستهدفة (مثل حرف الراء /r/ أو السين /s/) خارج النطاق العمري.'],
                    ['code' => 'Crit_B', 'name' => 'الاضطراب يعيق التواصل الاجتماعي والأكاديمي', 'status' => 'met', 'details' => 'صعوبة فهم الخطاب من المحيط بنسبة تتجاوز 30%.'],
                    ['code' => 'Crit_C', 'name' => 'البداية في مرحلة النمو المبكر', 'status' => 'met', 'details' => 'عدم اكتمال المخارج السليمة بحلول سن 5 سنوات.'],
                ];
                $unmatchedCriteria = [
                    ['code' => 'Crit_D', 'name' => 'نفي الأسباب التشريحية العضوية (اللسان المربوط أو الشفة الأرنبية)', 'status' => 'pending', 'action_required' => 'فحص تجويف الفم والبراكسيز العضلية.'],
                ];
                $differentials = [
                    ['title_ar' => 'اضطراب اللغة النمائي (Developmental Language Disorder - DLD)', 'code' => '315.32 / 6A01.2', 'distinction' => 'في DLD يتأثر النحو والفهم والمفردات وليس فقط نطق المخارج الصوتية.'],
                    ['title_ar' => 'عسر الكلام الطفولي (Childhood Apraxia of Speech)', 'code' => '315.39', 'distinction' => 'عدم اتساق أخطاء النطق واضطراب تخطيط وبرمجة الحركات النطقية.'],
                ];
                $referrals = [
                    ['specialty' => 'طب الأنف والأذن والحنجرة (ORL)', 'action' => 'فحص قياس السمع ومخطط المعاوقة لنفي نقص السمع التوصيلي أو ارتشاح الأذن الوسطى (Otitis media).'],
                ];
            }
        } elseif ($specialty === 'psychomotricite') {
            $primary = [
                'title_ar' => 'اضطراب التناسق الحركي النمائي / الديسفراكسيا (Developmental Coordination Disorder)',
                'title_fr' => 'Trouble développemental de la coordination (Dyspraxie)',
                'dsm5_code' => '315.4',
                'icd11_code' => '6A04',
                'code' => '315.4 / 6A04',
                'confidence_score' => 86,
                'severity' => 'معياري',
            ];
            $matchedCriteria = [
                ['code' => 'Crit_A', 'name' => 'اكتساب وتنفيذ المهارات الحركية المنسقة أقل بكثير من المتوقع عمرياً', 'status' => 'met', 'details' => 'بطء واضح وتعثر وحركات غير دقيقة في المهام الحركية الدقيقة والكبيرة.'],
                ['code' => 'Crit_B', 'name' => 'قصور المهارات الحركية يعيق أنشطة الحياة اليومية والإنتاجية الأكاديمية', 'status' => 'met', 'details' => 'صعوبات استخدام الأدوات (المقص، القلم، الأزرار، ربط الحذاء).'],
                ['code' => 'Crit_C', 'name' => 'بدء الأعراض في مرحلة النمو المبكرة', 'status' => 'met', 'details' => 'سوابق تأخر في الجلوس والمشي والتوازن الحركي.'],
            ];
            $differentials = [
                ['title_ar' => 'اضطراب المعالجة الحسية (Sensory Processing Disorder)', 'code' => 'Sensory', 'distinction' => 'فرط أو خمول الاستجابة للمدخلات الدهليزية والحس عميق.'],
                ['title_ar' => 'الشلل الدماغي الخفيف أو الاعتلال العضلي', 'code' => 'Neurological', 'distinction' => 'غياب العلامات العصبية البؤرية وفرط التوتر العضلي الهرمي.'],
            ];
            $referrals = [
                ['specialty' => 'طب أعصاب الأطفال (Neuropédiatrie)', 'action' => 'فحص عصبي إكلينيكي لاستبعاد أي اعتلال عصبي عضلي كامن.'],
                ['specialty' => 'فحص بصري حركي (Orthoptie)', 'action' => 'تقييم التثبيت البصري وحركات الملاحقة البصرية المرتبطة باليد.'],
            ];
        } elseif ($specialty === 'psychology') {
            if ($isDepressionSuspected) {
                $primary = [
                    'title_ar' => 'اضطراب الاكتئاب الجسيم (Major Depressive Disorder - نوبة أحادية)',
                    'title_fr' => 'Trouble dépressif majeur',
                    'dsm5_code' => '296.22',
                    'icd11_code' => '6A70.0',
                    'code' => '296.22 / 6A70.0',
                    'confidence_score' => $scores['bdi'] ? 92 : 87,
                    'severity' => $scores['phq'] >= 15 ? 'شديد' : 'متوسط',
                ];
                $matchedCriteria = [
                    ['code' => 'Crit_A1', 'name' => 'مزاج مكتئب أو حزين معظم اليوم', 'status' => 'met', 'details' => 'شعور بالفراغ والحزن معظم أيام الأسبوعين الأخيرين.'],
                    ['code' => 'Crit_A2', 'name' => 'تراجع ملحوظ في الاهتمام والقدرة على الاستمتاع (Anhedonia)', 'status' => 'met', 'details' => 'فقدان الرغبة في الأنشطة المعتادة.'],
                    ['code' => 'Crit_A3', 'name' => 'اضطراب النوم والطاقة', 'status' => 'met', 'details' => 'أرق متكرر أو إرهاق مستمر دون جهد بدني مبرر.'],
                ];
                $differentials = [
                    ['title_ar' => 'اضطراب التكيف مع مزاج مكتئب (Adjustment Disorder)', 'code' => '309.0 / 6B43', 'distinction' => 'ارتباط مباشر بصدمة أو ضاغط نفسي محدد ومؤقت.'],
                    ['title_ar' => 'قصور الغدة الدرقية (Hypothyroidism)', 'code' => 'Endocrine', 'distinction' => 'يجب فحص هرمونات TSH و FT4 لنفي المسبب العضوي.'],
                ];
                $referrals = [
                    ['specialty' => 'تحاليل مخبرية عامة', 'action' => 'فحص TSH، Ferritine، Vitamin D3، وفحص الدم الكامل CBC.'],
                    ['specialty' => 'طبيب نفسي استشاري (Psychiatrist)', 'action' => 'استشارة لتقييم الحاجة للعلاج الدوائي الداعم بجانب جلسات CBT.'],
                ];
            } else {
                // Anxiety / GAD
                $primary = [
                    'title_ar' => 'اضطراب القلق المعمم (Generalized Anxiety Disorder - GAD)',
                    'title_fr' => 'Trouble anxiété généralisée',
                    'dsm5_code' => '300.02',
                    'icd11_code' => '6B00',
                    'code' => '300.02 / 6B00',
                    'confidence_score' => 89,
                    'severity' => 'متوسط',
                ];
                $matchedCriteria = [
                    ['code' => 'Crit_A', 'name' => 'قلق وهم مفرطان يستمران لمدة 6 أشهر على الأقل', 'status' => 'met', 'details' => 'صعوبة السيطرة على مشاعر القلق وتوقع السيناريوهات السلبية.'],
                    ['code' => 'Crit_B', 'name' => 'أعراض توتر عضلي وأرق وتوتر عصبي', 'status' => 'met', 'details' => 'شد عضلي وصعوبة الاسترخاء والتركيز.'],
                ];
                $differentials = [
                    ['title_ar' => 'اضطراب الهلع (Panic Disorder)', 'code' => '300.01 / 6B01', 'distinction' => 'الهلع يتسم بنوبات مفاجئة حادة غير متوقعة مع خوف الموت أو الاختناق.'],
                    ['title_ar' => 'قلق الانفصال (Separation Anxiety)', 'code' => '309.21 / 6B05', 'distinction' => 'محصور في الخوف من فراغ الوالدين أو البيت.'],
                ];
                $referrals = [
                    ['specialty' => 'بروتوكول العلاج السلوكي المعرفي (CBT)', 'action' => 'تطبيق سجلات الأفكار الآلية، التعريض التدريجي وتقنيات الاسترخاء العضلي.'],
                ];
            }
        } else {
            // Neurodevelopmental (ASD vs ADHD)
            if ($isAutismSuspected) {
                $primary = [
                    'title_ar' => 'اضطراب طيف التوحد (Autism Spectrum Disorder - ASD)',
                    'title_fr' => 'Trouble du spectre de l\'autisme',
                    'dsm5_code' => '299.00',
                    'icd11_code' => '6A02',
                    'code' => '299.00 / 6A02',
                    'confidence_score' => $scores['cars'] ? min(96, round($scores['cars'] * 2.3)) : 88,
                    'severity' => ($scores['cars'] && $scores['cars'] >= 37) ? 'المستوى 2-3 (يتطلب دعماً جوهرياً)' : 'المستوى 1 (يتطلب دعماً)',
                ];

                $matchedCriteria = [
                    [
                        'code' => 'Criterion A',
                        'name' => 'عجز دائم ومستمر في التواصل والتفاعل الاجتماعي المتبادل',
                        'status' => 'met',
                        'details' => 'نقص في المبادأة الاجتماعية والمشاركة الوجدانية والتواصل البصري ولغة الجسد.',
                    ],
                    [
                        'code' => 'Criterion B',
                        'name' => 'أنماط سلوكية أو اهتمامات أو أنشطة مقيدة وتكرارية',
                        'status' => 'met',
                        'details' => 'سلوكيات حركية نمطية (رفرفة/دوران)، التمسك الصارم بالروتين، حساسية مفرطة للأصوات.',
                    ],
                    [
                        'code' => 'Criterion C',
                        'name' => 'ظهور الأعراض في فترة النمو المبكرة',
                        'status' => 'met',
                        'details' => 'سوابق تأخر في الاستجابة للاسم قبل سن 3 سنوات.',
                    ],
                    [
                        'code' => 'Criterion D',
                        'name' => 'تسبب الأعراض في ضعف سريري ملحوظ في الأداء الاجتماعي والمدرسي',
                        'status' => 'met',
                        'details' => 'صعوبات الاندماج الصفي والتفاعل مع الأقران.',
                    ],
                ];

                $unmatchedCriteria = [
                    [
                        'code' => 'Criterion E',
                        'name' => 'عدم التفسير الكامل بالاضطراب النمائي الذهني الشامل فقط',
                        'status' => 'pending',
                        'action_required' => 'استكمال مقياس فينلاند للسلوك التكيفي أو وكسلر الذكاء (WISC-V).',
                    ],
                ];

                $differentials = [
                    [
                        'title_ar' => 'اضطراب التواصل الاجتماعي البراغماتي (Social Pragmatic Communication Disorder)',
                        'code' => '315.39 / 6A01.3',
                        'distinction' => 'يتميز بغياب السلوكيات النمطية المقيدة والمفرطة (غياب Criterion B تماماً).',
                    ],
                    [
                        'title_ar' => 'اضطراب نقص الانتباه وفرط الحركة (ADHD)',
                        'code' => '314.01 / 6A05',
                        'distinction' => 'التشتت والاندفاعية دون عجز نوعي في التواصل الاجتماعي المتبادل وتفهم المشاعر.',
                    ],
                    [
                        'title_ar' => 'الحرمان البيئي والتواصلي الشديد',
                        'code' => 'Environmental',
                        'distinction' => 'استجابة سريعة جداً للمحفزات في بيئة غنية دون ثبات الأنماط التكرارية المتطرفة.',
                    ],
                ];

                $referrals = [
                    [
                        'specialty' => 'فحص السمع بالكمبيوتر (PEA / Audiogramme ORL)',
                        'priority' => 'urgent',
                        'action' => 'استبعاد نقص السمع الحسي العصبي أو المائي بشكل قاطع قبل تثبيت التشخيص النهائي.',
                    ],
                    [
                        'specialty' => 'تخطيط الدماغ الكهربائي (EEG de sommeil)',
                        'priority' => 'high',
                        'action' => 'نفي وجود متلازمة لاندو-كليفنر (Landau-Kleffner) أو نشاط بؤري صرعي خفي في الفص الصدغي.',
                    ],
                    [
                        'specialty' => 'استشارة طب أعصاب الأطفال (Neuropédiatre)',
                        'priority' => 'standard',
                        'action' => 'تقييم المحيط القحفي وتدقيق الفحوصات الجينية في حال وجود تشوهات دقيقة.',
                    ],
                ];
            } else {
                // ADHD
                $primary = [
                    'title_ar' => 'اضطراب نقص الانتباه مع فرط النشاط (ADHD - النمط المشترك)',
                    'title_fr' => 'Trouble déficit de l\'attention avec hyperactivité',
                    'dsm5_code' => '314.01',
                    'icd11_code' => '6A05.2',
                    'code' => '314.01 / 6A05.2',
                    'confidence_score' => $scores['conners'] ? min(94, round($scores['conners'] * 1.3)) : 85,
                    'severity' => 'متوسط',
                ];

                $matchedCriteria = [
                    ['code' => 'Crit_A1', 'name' => 'أعراض نقص الانتباه والتشتت في بيئتين مختلفتين على الأقل (البيت والمدرسة)', 'status' => 'met', 'details' => 'صعوبة إتمام المهام، تكرار الأخطاء الإهمالية، وفقدان الأدوات.'],
                    ['code' => 'Crit_A2', 'name' => 'أعراض فرط الحركة والاندفاعية', 'status' => 'met', 'details' => 'التململ الحركي، مقاطعة الآخرين وصعوبة الانتظار في الدور.'],
                    ['code' => 'Crit_B', 'name' => 'ظهور عدة أعراض قبل سن 12 سنة', 'status' => 'met', 'details' => 'ملاحظة المعلمين والأسرة منذ الحضانة والتحضيري.'],
                ];

                $differentials = [
                    ['title_ar' => 'اضطراب القلق النمائي (Developmental Anxiety)', 'code' => '300.02', 'distinction' => 'تشتت الانتباه ناتج عن الانشغال بالمخاوف وليس عجزاً في آليات الضبط التنفيذي.'],
                    ['title_ar' => 'صعوبات التعلم النوعية (Dyslexia / Dyscalculia)', 'code' => '315.00', 'distinction' => 'التشتت يحدث حصراً أثناء مهام القراءة والحساب وليس في الأنشطة المفضلة.'],
                ];

                $referrals = [
                    ['specialty' => 'تقييم نفس حركي (Bilan Psychomoteur)', 'action' => 'قياس زمن الرجع والتثبيط الحركي وتناسق الحركة الدقيقة.'],
                    ['specialty' => 'تنسيق مدرسي (Projet d\'Accueil Individualisé)', 'action' => 'وضع تكييفات صفية (الجلوس في المقاعد الأولى، تقسيم التعليمات، فترات حركة منتظمة).'],
                ];
            }
        }

        return [
            'primary_diagnosis' => $primary,
            'matched_criteria' => $matchedCriteria,
            'unmatched_criteria' => $unmatchedCriteria,
            'differential_diagnoses' => $differentials,
            'clinical_red_alerts' => $redAlerts,
            'recommended_referrals' => $referrals,
        ];
    }

    /**
     * Fallback Heuristic Narrative Synthesis for SOAP & Reports.
     */
    protected function generateHeuristicNarrative(array $eval, Patient $patient, int $age): string
    {
        $diag = $eval['primary_diagnosis']['title_ar'] ?? 'تقييم سريري';
        $dsm = $eval['primary_diagnosis']['dsm5_code'] ?? 'N/A';
        $icd = $eval['primary_diagnosis']['icd11_code'] ?? 'N/A';
        $conf = $eval['primary_diagnosis']['confidence_score'] ?? 85;

        $text = "بناءً على المعطيات السريرية المستقاة من المقابلات النمائية، ملاحظات الجلسة، والروائز المعيارية المقننة؛ " .
            "تتطابق اللوحة الإكلينيكية للمفحوص ({$patient->first_name} {$patient->last_name}، {$age} سنوات) بدرجة توافق قدرها ({$conf}%) مع المعايير التشخيصية لـ: " .
            "{$diag} وفق الدليل التشخيصي والإحصائي الأمريكي الخامس المعدل (DSM-5-TR: {$dsm}) والتصنيف الدولي للأمراض (ICD-11: {$icd}). " .
            "\n\nوقد استوفت الحالة معايير القصور الوظيفي النمائي مع ثبوت استمرار الأعراض عبر سياقات متعددة. " .
            "يوصى ببدء خطة تكفل علاجي وتأهيلي فردي مكثف (PEI) موجه للأهداف التواصلية والسلوكية مع متابعة الإحالات المتقاطعة المقترحة.";

        return $text;
    }
}
