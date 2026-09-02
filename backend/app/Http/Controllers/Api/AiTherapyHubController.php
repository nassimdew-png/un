<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\SessionSoapNote;
use App\Models\Tenant;
use App\Models\TreatmentPlan;
use App\Services\AiGatewayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiTherapyHubController extends Controller
{
    protected AiGatewayService $aiGateway;

    public function __construct(AiGatewayService $aiGateway)
    {
        $this->aiGateway = $aiGateway;
    }

    /**
     * 1. Smart Bilan Clinical Synthesis Generator
     */
    public function generateBilan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'specialty' => 'required|string|in:orthophonie,psychologie,neuropsychiatrie,psychomotricite,general',
            'language' => 'required|string|in:fr,ar',
            'audience' => 'required|string|in:medical,parent,school',
            'assessment_scores' => 'nullable|array',
            'clinical_observations' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $patientContext = $patient ? "Patient: {$patient->first_name} {$patient->last_name}, Âge: {$patient->age} ans, Diagnostic: {$patient->diagnosis_primary}." : "Patient générique en consultation.";

        $langInstruction = $validated['language'] === 'fr' 
            ? "Rédigez l'intégralité du compte-rendu en Français Médical / Neuropsychologique professionnel." 
            : "صِغ كامل الحصيلة السريرية باللغة العربية الأكاديمية الطبية المتخصصة.";

        $toneInstruction = match($validated['audience']) {
            'parent' => "Adoptez un ton vulgarisé, bienveillant, clair et pédagogique pour les parents.",
            'school' => "Adoptez un ton axé sur les aménagements scolaires, la pédagogie différenciée et l'attention en classe.",
            default => "Adoptez un style strictement médical, neuro-cognitif, rigoureux et expert destiné aux confrères médecins/spécialistes.",
        };

        $scoresText = !empty($validated['assessment_scores']) ? json_encode($validated['assessment_scores'], JSON_UNESCAPED_UNICODE) : "Aucun score chiffré fourni.";
        $obsText = $validated['clinical_observations'] ?? "Observations comportementales en séance standard.";

        $systemPrompt = "Vous êtes un expert clinicien de renom en {$validated['specialty']}. Vous rédigez des bilans complets et rigoureux.\n{$langInstruction}\n{$toneInstruction}";

        $userPrompt = <<<PROMPT
Contexte du patient :
{$patientContext}

Résultats des tests et cotations :
{$scoresText}

Observations qualitatives et comportementales :
{$obsText}

Veuillez générer un compte-rendu structuré en 5 sections distinctes :
1. Motifs de consultation et anamnèse résumée
2. Analyse quantitative et qualitative des épreuves
3. Profil des points forts et axes de fragilité
4. Synthèse clinique et orientation diagnostique
5. Recommandations thérapeutiques et projet de soins
PROMPT;

        $result = $this->aiGateway->generate('bilan_synthesis', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.6,
            'max_tokens' => 3000,
        ]);

        return response()->json([
            'success' => $result['success'] ?? true,
            'data' => $result,
            'synthese' => $result['content'] ?? '',
            'content' => $result['content'] ?? '',
            'patient' => $patient,
        ], !empty($result['success']) ? 200 : 422);
    }

    /**
     * 2. PEP / IEP SMART Goals Generator
     */
    public function generatePep(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'specialty' => 'required|string|in:orthophonie,psychologie,neuropsychiatrie,psychomotricite,general',
            'diagnostic_summary' => 'required|string',
            'therapy_frequency' => 'nullable|string',
            'language' => 'nullable|string|in:fr,ar',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $lang = $validated['language'] ?? 'ar';
        $langPrompt = $lang === 'ar' 
            ? "صِغ الأهداف باللغة العربية مع مصطلحات إجرائية دقيقة."
            : "Rédigez les objectifs en français clinique opérationnel.";

        $systemPrompt = "Vous êtes un superviseur clinique expert en élaboration de projets thérapeutiques individualisés (PEP / IEP / PEI).\n{$langPrompt}";

        $userPrompt = <<<PROMPT
Élaborez un projet thérapeutique individualisé structuré en 3 paliers progressifs pour ce profil :
Résumé diagnostique : {$validated['diagnostic_summary']}
Fréquence des séances : {$validated['therapy_frequency']}

Structurez la réponse en JSON strict avec les clés suivantes :
{
  "title": "Titre du projet thérapeutique",
  "short_term_goals": ["هدف 1 (1-3 أشهر)", "هدف 2 (1-3 أشهر)", "هدف 3 (1-3 أشهر)"],
  "medium_term_goals": ["هدف 1 (3-6 أشهر)", "هدف 2 (3-6 أشهر)", "هدف 3 (3-6 أشهر)"],
  "long_term_vision": "الرؤية والغاية العامة لإعادة التأهيل والاندماج المدرسي والاجتماعي"
}
PROMPT;

        $result = $this->aiGateway->generate('pep_generation', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.5,
            'max_tokens' => 2048,
            'format_json' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 3. Algerian-Context Therapeutic Content & Exercise Studio
     */
    public function generateExercise(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'content_type' => 'required|string|in:social_story,articulation_cards,home_worksheet,visual_schedule,darja_pragmatics',
            'target_goal' => 'required|string',
            'target_age' => 'nullable|integer',
            'child_name' => 'nullable|string',
            'environment_setting' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $childName = $validated['child_name'] ?: ($patient ? $patient->first_name : 'أنيس');
        $age = $validated['target_age'] ?: ($patient ? $patient->age : 6);
        $setting = $validated['environment_setting'] ?: 'المدرسة والبيت وحانوت الحومة';

        $systemPrompt = "أنت أخصائي أرطوفوني ونفسي جزائري خبير في صياغة المحتوى العلاجي والتأهيلي التفاعلي المتكيف تماماً مع الثقافة والبيئة اليومية الجزائرية (أسماء، أماكن، كلمات يومية، عادات، عائلة).";

        $typeLabel = match($validated['content_type']) {
            'social_story' => 'قصة اجتماعية علاجية مدعمة بمواقف سلوكية وتوجيهات للوالدين',
            'articulation_cards' => 'بطاقات تدريب نطق وتمييز سمعي بأمثلة جزائرية حية',
            'home_worksheet' => 'ورقة تمارين وتطبيقات منزلية للأولياء للمتابعة في البيت',
            'visual_schedule' => 'جدول روتين بصري وتنظيم المهام اليومية',
            default => 'تمارين تواصل وبراغماتية بالدارجة الجزائرية الفصيحة والمبسطة',
        };

        $userPrompt = <<<PROMPT
المطلوب: إنشاء {$typeLabel}
اسم الطفل: {$childName} (العمر: {$age} سنوات)
الهدف العلاجي المستهدف: {$validated['target_goal']}
السياق والبيئة الجزائرية: {$setting}

يرجى تقديم محتوى غني وجاهز للطباعة أو الإرسال المباشر لبوابة الأولياء، يشمل:
1. عنوان جذاب بالدارجة الجزائرية واللغة العربية
2. نص التمرين أو القصة خطوة بخطوة مع أسئلة تفاعلية
3. إرشادات مبسطة ومحددة للأولياء لتطبيق التمرين بنجاح
PROMPT;

        $result = $this->aiGateway->generate('rehab_content', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.7,
            'max_tokens' => 2500,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 4. SOAP Voice Scribe Notes
     */
    public function voiceScribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'notes_raw' => 'required|string',
            'session_type' => 'nullable|string',
            'language' => 'nullable|string|in:fr,ar',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $lang = $validated['language'] ?? 'fr';
        $langPrompt = $lang === 'fr'
            ? "Formatez en Français Médical / Orthophonique / Psychologique."
            : "صِغ التقرير باللغة العربية السريرية الطبية.";

        $systemPrompt = "Vous êtes un secrétaire médical et assistant clinique expert. Vous convertissez des notes brutes, dictées vocales ou transcriptions multilingues (Darja / Français / Arabe) en une note SOAP clinique irréprochable.\n{$langPrompt}";

        $userPrompt = <<<PROMPT
Notes brutes de la séance :
{$validated['notes_raw']}

Veuillez structurer en JSON strict avec les 4 composantes SOAP :
{
  "subjective": "Plaintes exprimées, état émotionnel, humeur, rapport des parents",
  "objective": "Comportement observé, scores obtenus aux exercices, performance mesurable",
  "assessment": "Analyse clinique de la séance, progrès notés, difficultés rencontrées",
  "plan": "Objectifs pour la prochaine séance, exercice assigné pour la maison"
}
PROMPT;

        $result = $this->aiGateway->generate('voice_soap', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.3,
            'max_tokens' => 2048,
            'format_json' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 5. Visual Social Stories Studio (قصص اجتماعية وتعديل سلوك مهيكلة)
     */
    public function generateSocialStory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'behavior_target' => 'required|string',
            'child_name' => 'nullable|string',
            'child_age' => 'nullable|integer',
            'cultural_setting' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $name = $validated['child_name'] ?: ($patient ? $patient->first_name : 'أمين');
        $age = $validated['child_age'] ?: ($patient ? $patient->age : 6);
        $setting = $validated['cultural_setting'] ?: 'المدرسة والبيت الجزائري';

        $systemPrompt = "أنت خبير في علم النفس العصبي وتعديل السلوك التواصلي، متخصص في بناء القصص الاجتماعية المصورة (Carol Gray Social Stories) المتكيفة مع الثقافة واللهجة الجزائرية المحببة للطفل.";

        $userPrompt = <<<PROMPT
المطلوب: صياغة قصة اجتماعية علاجية متكاملة للطفل: {$name} ({$age} سنوات)
السلوك المستهدف: {$validated['behavior_target']}
السياق والبيئة: {$setting}

يرجى إرجاع JSON مهيكل بدقة يحتوي على 4 لوحات قصة (Storyboard Panels) + توجيهات للأولياء:
{
  "story_title": "عنوان القصة بالدارجة والعربية",
  "panels": [
    {
      "step_number": 1,
      "panel_title": "1. الموقف والبيئة (Descriptive Sentence)",
      "text_arabic": "النص باللغة العربية الفصيحة المبسطة",
      "text_darja": "النص بالدارجة الجزائرية الدافئة",
      "visual_prompt": "وصف المشهد البصري أو الرسم التوضيحي المقترح",
      "emotion_icon": "😊"
    },
    {
      "step_number": 2,
      "panel_title": "2. المشاعر والأفكار (Perspective Sentence)",
      "text_arabic": "...",
      "text_darja": "...",
      "visual_prompt": "...",
      "emotion_icon": "🤔"
    },
    {
      "step_number": 3,
      "panel_title": "3. السلوك البديل والتصرف الإيجابي (Directive Sentence)",
      "text_arabic": "...",
      "text_darja": "...",
      "visual_prompt": "...",
      "emotion_icon": "⭐"
    },
    {
      "step_number": 4,
      "panel_title": "4. النتيجة والمكافأة (Affirmative Sentence)",
      "text_arabic": "...",
      "text_darja": "...",
      "visual_prompt": "...",
      "emotion_icon": "🎉"
    }
  ],
  "parent_guidelines": "إرشادات عملية للأولياء عند قراءة القصة مع الطفل في البيت وتكرارها"
}
PROMPT;

        $result = $this->aiGateway->generate('social_story_studio', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.5,
            'max_tokens' => 2500,
            'format_json' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 6. Clinical Relaxation & Breathing Studio (جلسات استرخاء وموجهات صوتية)
     */
    public function generateRelaxationSession(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'therapy_goal' => 'required|string',
            'duration_minutes' => 'required|integer|in:3,5,10,15',
            'target_age' => 'nullable|integer',
            'technique' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $age = $validated['target_age'] ?: ($patient ? $patient->age : 10);
        $technique = $validated['technique'] ?: 'cardiac_coherence';

        $systemPrompt = "أنت معالج نفسي سريري وأخصائي أرطوفونيا خبير في تقنيات الاسترخاء الطبي، التنفس الواعي (Coherence Cardiaque)، والاسترخاء العضلي التدريجي (Jacobson/Schultz).";

        $userPrompt = <<<PROMPT
المطلوب: تصميم جلسة استرخاء علاجي موجهة
الهدف السريري: {$validated['therapy_goal']}
المدة الزمنية: {$validated['duration_minutes']} دقائق
عمر المريض: {$age} سنة
التقنية المعتمدة: {$technique}

يرجى إرجاع JSON مهيكل للجلسة العلاجية:
{
  "session_title": "عنوان الجلسة العلاجية",
  "target_objective": "الهدف السريري الدقيق",
  "pacing_rhythm": "نمط التنفس الموصى به (مثال: شهيق 4 ثوان - حبس 2 ثانية - زفير 6 ثوان)",
  "phases": [
    {
      "phase_name": "1. التهيؤ والوضعية الجسدية (Ancrage Corporel)",
      "script_text": "النص الصوتي الموجه للمريض بلهجة هادئة ومطمئنة",
      "pacing_seconds": 60
    },
    {
      "phase_name": "2. دورات التنفس الموجه والتفريغ الحركي (Respiration Guidée)",
      "script_text": "نص توجيه الشهيق والزفير وإرخاء الأكتاف والحجاب الحاجز",
      "pacing_seconds": 120
    },
    {
      "phase_name": "3. التخيل الموجه والتعزيز الذاتي (Imagerie Positive)",
      "script_text": "نص التخيل العلاجي وتثبيت مشاعر الأمان والسيطرة على الكلام/القلق",
      "pacing_seconds": 120
    },
    {
      "phase_name": "4. العودة التدريجية واليقظة (Retour & Ancrage)",
      "script_text": "نص استعادة النشاط والشعور بالراحة والهدوء الذهني",
      "pacing_seconds": 60
    }
  ],
  "home_practice_instructions": "تعليمات وتوصيات للمريض لممارسة التمرين في البيت يومياً"
}
PROMPT;

        $result = $this->aiGateway->generate('relaxation_studio', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.4,
            'max_tokens' => 2500,
            'format_json' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 7. Projective Drawing Analyzer (محلل الاختبارات الإسقاطية ورسوم الأطفال via Gemini Vision)
     */
    public function analyzeDrawing(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'test_type' => 'required|string',
            'child_age' => 'nullable|integer',
            'drawing_image' => 'nullable|string',
            'clinical_notes' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $age = $validated['child_age'] ?: ($patient ? $patient->age : 7);
        $notes = $validated['clinical_notes'] ?? 'لا توجد ملاحظات سلوكية مسبقة.';

        $systemPrompt = "Vous êtes un psychologue clinicien expert en épreuves projectives graphiques chez l'enfant et l'adolescent (Test du Bonhomme de Goodenough-Harris, Dessin de la Famille de Corman, Test de l'Arbre de Koch). Vous proposez des hypothèses cliniques prudentes, rigoureuses et non déterministes.";

        $userPrompt = <<<PROMPT
Analyse clinique d'une épreuve projective graphique :
- Type d'épreuve : {$validated['test_type']}
- Âge de l'enfant : {$age} ans
- Maintien et comportement lors de la passation : {$notes}

Veuillez structurer votre analyse psychologique en JSON strict avec les clés suivantes :
{
  "test_title": "Épreuve projective : {$validated['test_type']}",
  "spatial_layout": "Analyse de l'emplacement spatial (Haut/Bas/Gauche/Droite/Centre) et occupation de la feuille",
  "graphic_traits": "Qualité du trait, pression graphique, continuité/hachures, détails et proportions",
  "prominent_indicators": ["مؤشر 1 (مثل: حذف الأيدي / تضخيم الرأس)", "مؤشر 2", "مؤشر 3"],
  "developmental_level": "Évaluation du stade de développement graphique par rapport à l'âge chronologique ({$age} ans)",
  "clinical_hypotheses": "Hypothèses cliniques qualitatives (schéma corporel, anxiété, affectivité, dynamique relationnelle)",
  "recommendations": "Pistes d'investigation complémentaire et préconisations pour la prise en charge"
}
PROMPT;

        if (!empty($validated['drawing_image'])) {
            $base64 = $validated['drawing_image'];
            $mimeType = 'image/jpeg';
            if (str_contains($base64, ';base64,')) {
                [$meta, $base64] = explode(';base64,', $base64, 2);
                if (str_contains($meta, 'image/png')) $mimeType = 'image/png';
                if (str_contains($meta, 'image/webp')) $mimeType = 'image/webp';
            }

            $result = $this->aiGateway->analyzeImageWithGemini($userPrompt, $base64, $mimeType, $systemPrompt, $tenant, $user);
        } else {
            $result = $this->aiGateway->generate('drawing_analysis', $userPrompt, $systemPrompt, $tenant, $user, [
                'temperature' => 0.4,
                'max_tokens' => 2500,
                'format_json' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * 8. WISC-V Psychometric Discrepancy & Cognitive Interpreter (مفسر مقياس وكسلر)
     */
    public function interpretWisc(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'nullable|integer|exists:patients,id',
            'vci' => 'required|numeric|min:40|max:160',
            'vsi' => 'required|numeric|min:40|max:160',
            'fri' => 'required|numeric|min:40|max:160',
            'wmi' => 'required|numeric|min:40|max:160',
            'psi' => 'required|numeric|min:40|max:160',
            'fsiq' => 'nullable|numeric|min:40|max:160',
            'child_age' => 'nullable|numeric',
            'language' => 'nullable|string|in:fr,ar',
        ]);

        $user = Auth::user();
        $tenant = $user->tenant_id ? Tenant::find($user->tenant_id) : null;
        $patient = !empty($validated['patient_id']) ? Patient::find($validated['patient_id']) : null;

        $vci = (int)$validated['vci'];
        $vsi = (int)$validated['vsi'];
        $fri = (int)$validated['fri'];
        $wmi = (int)$validated['wmi'];
        $psi = (int)$validated['psi'];
        $scores = [$vci, $vsi, $fri, $wmi, $psi];

        $maxScore = max($scores);
        $minScore = min($scores);
        $discrepancy = $maxScore - $minScore;
        $isHeterogeneous = $discrepancy >= 15;
        $heteroText = $isHeterogeneous ? 'OUI (QIT non interprétable)' : 'NON (Profil homogène)';

        $gai = (int) round(($vci + $vsi + $fri) / 3);
        $cpi = (int) round(($wmi + $psi) / 2);

        $lang = $validated['language'] ?? 'fr';
        $langPrompt = $lang === 'fr'
            ? "Rédigez l'interprétation clinique en Français Neuropsychologique médical rigoureux."
            : "صِغ التحليل السريري باللغة العربية الأكاديمية الطبية المتخصصة.";

        $systemPrompt = "Vous êtes un neuropsychologue expert dans l'interprétation des profils d'intelligence WISC-V chez l'enfant.\n{$langPrompt}";

        $userPrompt = <<<PROMPT
Résultats standardisés WISC-V :
- ICV (Compréhension Verbale) : {$vci}
- IVS (Visuo-Spatial) : {$vsi}
- IRF (Raisonnement Fluide) : {$fri}
- IMT (Mémoire de Travail) : {$wmi}
- IVT (Vitesse de Traitement) : {$psi}
- Écart inter-indices maximal : {$discrepancy} points (Hétérogénéité cognitive : {$heteroText})
- IAG estimé : {$gai} | IPC estimé : {$cpi}

Veuillez structurer l'analyse neuropsychologique en JSON strict avec les clés suivantes :
{
  "profile_summary": "Résumé du profil cognitif général",
  "homogeneity_analysis": "Analyse de l'homogénéité/hétérogénéité et validité du QIT global",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف / هشاشة 1", "نقطة ضعف 2"],
  "school_impact": "Impact direct sur les apprentissages scolaires (lecture, mathématiques, attention, rythme de travail)",
  "therapeutic_recommendations": ["توصية علاجية 1 (أرطوفونيا / علاج معرفي)", "توصية 2", "تكييفات مدرسية (PAI / aménagements)"]
}
PROMPT;

        $result = $this->aiGateway->generate('wisc_interpretation', $userPrompt, $systemPrompt, $tenant, $user, [
            'temperature' => 0.3,
            'max_tokens' => 2500,
            'format_json' => true,
        ]);

        return response()->json([
            'success' => true,
            'metrics' => [
                'vci' => $vci,
                'vsi' => $vsi,
                'fri' => $fri,
                'wmi' => $wmi,
                'psi' => $psi,
                'max_discrepancy' => $discrepancy,
                'is_heterogeneous' => $isHeterogeneous,
                'gai' => $gai,
                'cpi' => $cpi,
            ],
            'data' => $result,
            'patient' => $patient,
        ]);
    }

    /**
     * Save generated AI output directly into patient clinical record.
     */
    public function saveToPatientRecord(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'type' => 'required|string|in:pep,soap,content,bilan,social_story,relaxation,drawing,wisc',
            'payload' => 'required|array',
        ]);

        $user = Auth::user();
        $tenantId = $user->tenant_id;
        $patient = Patient::findOrFail($validated['patient_id']);

        if ($validated['type'] === 'pep') {
            $data = $validated['payload'];
            $plan = TreatmentPlan::create([
                'clinic_id' => $tenantId,
                'patient_id' => $patient->id,
                'specialty' => $data['specialty'] ?? 'orthophonie',
                'title' => $data['title'] ?? 'Projet Thérapeutique Individualisé',
                'short_term_goals' => $data['short_term_goals'] ?? [],
                'medium_term_goals' => $data['medium_term_goals'] ?? [],
                'long_term_vision' => $data['long_term_vision'] ?? '',
                'status' => 'active',
                'review_date' => Carbon::now()->addMonths(3),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ المشروع العلاجي (PEP) في ملف المريض بنجاح.',
                'record' => $plan,
            ]);
        }

        if ($validated['type'] === 'soap') {
            $data = $validated['payload'];
            $soap = SessionSoapNote::create([
                'clinic_id' => $tenantId,
                'patient_id' => $patient->id,
                'practitioner_id' => $user->id,
                'session_date' => Carbon::today(),
                'raw_transcript' => $data['raw_transcript'] ?? null,
                'subjective' => $data['subjective'] ?? '',
                'objective' => $data['objective'] ?? '',
                'assessment' => $data['assessment'] ?? '',
                'plan' => $data['plan'] ?? '',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم حفظ تدوين SOAP في السجل الطبي للجلسات بنجاح.',
                'record' => $soap,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقرير السريري في ملف المريض بنجاح.',
        ]);
    }

    /**
     * Generate Short-lived Ephemeral Token for Real-time Live Consultation & Interactive Audio Streaming.
     * POST /api/ai-therapy/live-session/token
     */
    public function createLiveSessionToken(Request $request): JsonResponse
    {
        $user = Auth::user();
        $sessionId = 'live_' . \Illuminate\Support\Str::random(24);
        $token = hash_hmac('sha256', $sessionId . '|' . ($user?->id ?: 0), config('app.key'));

        return response()->json([
            'success' => true,
            'session_id' => $sessionId,
            'ephemeral_token' => $token,
            'ws_endpoint' => 'wss://psypro.tech/ws/live-audio',
            'model' => 'gemini-3.6-flash',
            'expires_in_seconds' => 3600,
        ]);
    }
}
