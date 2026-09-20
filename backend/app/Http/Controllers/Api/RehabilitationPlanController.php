<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalDiagnosticRecord;
use App\Models\GlobalExercise;
use App\Models\HomeworkAssignment;
use App\Models\Patient;
use App\Models\TreatmentPlan;
use App\Services\AiGatewayService;
use App\Services\AiRehabilitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RehabilitationPlanController extends Controller
{
    protected AiRehabilitationService $rehabService;

    public function __construct(AiRehabilitationService $rehabService)
    {
        $this->rehabService = $rehabService;
    }

    /**
     * Get active and historical treatment plans (PEP/IEP) for a patient.
     */
    public function getPatientPlans(int $patientId): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);
        $plans = TreatmentPlan::where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $activePlan = $plans->where('status', 'active')->first() ?: $plans->first();

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'name' => "{$patient->first_name} {$patient->last_name}",
                'age' => $patient->birth_date ? \Carbon\Carbon::parse($patient->birth_date)->age : null,
            ],
            'active_plan' => $activePlan,
            'plans' => $plans,
        ]);
    }

    /**
     * AI-generate dynamic PEP plan from patient assessment findings.
     */
    public function aiGeneratePep(int $patientId, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);
        $specialty = $request->input('specialty', 'orthophonie');
        $language = $request->input('language', 'ar');
        $bilanFindings = $request->input('bilan_findings', null);

        $generated = $this->rehabService->generatePepPlan($patient, $bilanFindings, $specialty, $language);

        return response()->json([
            'success' => true,
            'data' => $generated,
        ]);
    }

    /**
     * AI-generate Smart PEI with automated exercises and A4 worksheets linking.
     * POST /api/rehab/smart-pei/generate/{patientId}
     */
    public function generateSmartPei(int $patientId, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);
        $specialty = $request->input('specialty', 'orthophonie');
        $language = $request->input('language', 'ar');
        $bilanFindings = $request->input('bilan_findings', null);
        $diagnosticRecordId = $request->input('diagnostic_record_id', null);

        // Fetch diagnosis context if provided
        $diagContext = null;
        if ($diagnosticRecordId) {
            $diagRecord = ClinicalDiagnosticRecord::where('patient_id', $patient->id)->find($diagnosticRecordId);
            if ($diagRecord) {
                $diagContext = "التشخيص المعتمد: {$diagRecord->primary_diagnosis_title} ({$diagRecord->primary_diagnosis_code})";
            }
        }

        $basePlan = $this->rehabService->generatePepPlan($patient, $bilanFindings, $specialty, $language);

        // Fetch available Global Exercises for this specialty
        $specialtyKey = in_array($specialty, ['orthophonie', 'speech']) ? 'orthophony' : ($specialty === 'psychomotricite' ? 'psychomotricite' : 'psychology');
        $availableExercises = GlobalExercise::where('is_globally_enabled', true)
            ->where(function ($q) use ($specialtyKey) {
                $q->where('specialty', $specialtyKey)
                  ->orWhere('specialty', 'orthophony')
                  ->orWhereNull('specialty');
            })
            ->get();

        $shortTermGoals = $basePlan['short_term_goals'] ?? [];
        $mediumTermGoals = $basePlan['medium_term_goals'] ?? [];
        $allLinkedExerciseIds = [];

        // Enrich short term goals with SMART attributes and matching exercises
        foreach ($shortTermGoals as $index => &$goal) {
            $goal['smart_type'] = 'short_term';
            $goal['mastery_threshold'] = $goal['mastery_threshold'] ?? '80% نجاح في 3 جلسات متتالية';
            $goal['baseline_level'] = $goal['baseline_level'] ?? 'مستوى البداية: أقل من 25%';
            $goal['measurement_tool'] = $goal['measurement_tool'] ?? 'ملاحظة مباشرة وسجل الجلسة SOAP';
            $goal['target_sessions'] = $goal['target_sessions'] ?? 10;
            $goal['completed_sessions'] = 0;
            $goal['progress_pct'] = 0;

            // Match exercises by category or domain
            $matched = $availableExercises->filter(function ($ex) use ($goal, $index) {
                $domain = mb_strtolower($goal['domain'] ?? '');
                $title = mb_strtolower($goal['title'] ?? '');
                $cat = mb_strtolower($ex->category ?? '');
                $exTitle = mb_strtolower($ex->title_ar . ' ' . ($ex->title_fr ?? ''));

                if (str_contains($domain, 'phonolog') || str_contains($domain, 'نطق') || str_contains($title, 'نطق')) {
                    return str_contains($cat, 'artic') || str_contains($exTitle, 'نطق') || str_contains($exTitle, 'صوت');
                }
                if (str_contains($domain, 'attent') || str_contains($domain, 'تركيز') || str_contains($title, 'انتباه')) {
                    return str_contains($cat, 'cognit') || str_contains($exTitle, 'انتباه') || str_contains($exTitle, 'تركيز');
                }
                return true;
            })->slice($index * 2, 2)->values();

            if ($matched->isEmpty() && !$availableExercises->isEmpty()) {
                $matched = $availableExercises->slice($index % max(1, $availableExercises->count()), 1)->values();
            }

            $linked = [];
            foreach ($matched as $m) {
                $linked[] = [
                    'id' => $m->id,
                    'exercise_code' => $m->exercise_code,
                    'title' => $m->title_ar,
                    'category' => $m->category_label ?: $m->category,
                    'difficulty' => $m->difficulty,
                    'estimated_duration' => $m->estimated_duration,
                    'summary' => $m->summary,
                    'instructions' => $m->instructions,
                    'has_worksheet' => !empty($m->worksheet_content),
                ];
                $allLinkedExerciseIds[] = $m->id;
            }

            $goal['linked_exercises'] = $linked;
        }

        // Enrich medium term goals
        foreach ($mediumTermGoals as $index => &$mGoal) {
            $mGoal['smart_type'] = 'medium_term';
            $mGoal['generalization_context'] = 'التعميم في البيئة الأسرية والمدرسية';
            $mGoal['mastery_threshold'] = 'إتقان بنسبة 75% في بيئات غير علاجية';
            $mGoal['progress_pct'] = 0;
            $mGoal['linked_exercises'] = [];
        }

        $allLinkedExerciseIds = array_values(array_unique($allLinkedExerciseIds));

        return response()->json([
            'success' => true,
            'plan' => [
                'title' => $basePlan['title'] ?? 'المشروع العلاجي الفردي والتأهيلي (PEI/IEP)',
                'specialty' => $specialty,
                'diagnostic_summary' => $diagContext,
                'diagnostic_record_id' => $diagnosticRecordId,
                'short_term_goals' => $shortTermGoals,
                'medium_term_goals' => $mediumTermGoals,
                'long_term_vision' => $basePlan['long_term_vision'] ?? 'تحقيق الاستقلالية التواصلية والوظيفية الشاملة.',
                'linked_exercise_ids' => $allLinkedExerciseIds,
                'review_date' => now()->addMonths(3)->toDateString(),
            ],
            'exercises_bank_count' => $availableExercises->count(),
        ]);
    }

    /**
     * Get exercises catalog for manual goal linking.
     * GET /api/rehab/exercises-catalog
     */
    public function getExercisesCatalog(Request $request): JsonResponse
    {
        $specialty = $request->input('specialty');
        $query = GlobalExercise::where('is_globally_enabled', true);

        if ($specialty) {
            $query->where('specialty', $specialty);
        }

        $exercises = $query->orderBy('category')->get();

        return response()->json([
            'success' => true,
            'exercises' => $exercises,
        ]);
    }

    /**
     * Save finalized PEP / IEP plan.
     */
    public function savePepPlan(int $patientId, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($patientId);

        $validated = $request->validate([
            'id' => 'nullable|integer',
            'title' => 'required|string|max:255',
            'specialty' => 'nullable|string|max:50',
            'short_term_goals' => 'nullable|array',
            'medium_term_goals' => 'nullable|array',
            'long_term_vision' => 'nullable|string',
            'linked_exercise_ids' => 'nullable|array',
            'smart_goals_matrix' => 'nullable|array',
            'diagnostic_record_id' => 'nullable|integer',
            'status' => 'nullable|string|in:draft,active,achieved,revised',
            'review_date' => 'nullable|date',
        ]);

        if (!empty($validated['id'])) {
            $plan = TreatmentPlan::where('patient_id', $patient->id)->findOrFail($validated['id']);
            $plan->update($validated);
        } else {
            // Deactivate previous active plans if this one is active
            if (($validated['status'] ?? 'active') === 'active') {
                TreatmentPlan::where('patient_id', $patient->id)->update(['status' => 'revised']);
            }

            $plan = TreatmentPlan::create(array_merge($validated, [
                'clinic_id' => $user->tenant_id,
                'patient_id' => $patient->id,
                'status' => $validated['status'] ?? 'active',
            ]));
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتثبيت المشروع العلاجي الفردي (PEI) وربطه ببنك التمارين بنجاح.',
            'plan' => $plan,
        ]);
    }

    /**
     * Update individual goal progress / achievement status.
     */
    public function updateGoalStatus(int $planId, Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $plan = TreatmentPlan::where('clinic_id', $user->tenant_id)->findOrFail($planId);
        $goalId = $request->input('goal_id');
        $newStatus = $request->input('status', 'achieved'); // in_progress, achieved, pending

        $shortTerm = $plan->short_term_goals ?: [];
        foreach ($shortTerm as &$g) {
            if (($g['id'] ?? null) == $goalId) {
                $g['status'] = $newStatus;
                if ($newStatus === 'achieved') {
                    $g['achieved_at'] = now()->toDateString();
                }
            }
        }

        $plan->short_term_goals = $shortTerm;
        $plan->save();

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة إنجاز الهدف السريري بنجاح.',
            'plan' => $plan,
        ]);
    }

    /**
     * AI-generate Algerian-context rehabilitation materials.
     */
    public function aiGenerateContent(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'nullable|integer',
            'content_type' => 'required|string|in:social_story,articulation_cards,home_worksheet',
            'context' => 'nullable|string|max:100',
            'target_goal' => 'nullable|array',
            'language' => 'nullable|string|in:ar,fr',
        ]);

        $patient = !empty($validated['patient_id']) 
            ? Patient::where('tenant_id', $user->tenant_id)->find($validated['patient_id']) 
            : null;

        $targetGoal = $validated['target_goal'] ?? [
            'title' => 'التواصل والتعبير اللفظي في البيئة اليومية',
            'domain' => 'langage',
        ];

        $content = $this->rehabService->generateAlgerianExercise(
            $targetGoal,
            $validated['content_type'],
            $validated['context'] ?? 'school',
            $patient,
            $validated['language'] ?? 'ar'
        );

        return response()->json([
            'success' => true,
            'data' => $content,
        ]);
    }

    /**
     * Dispatch generated exercise directly to the Parent & Patient Portal.
     */
    public function dispatchToPortal(Request $request): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $validated = $request->validate([
            'patient_id' => 'required|integer',
            'exercise_title' => 'required|string|max:255',
            'instructions' => 'required|string|max:5000',
            'category' => 'nullable|string|max:100',
            'due_date' => 'nullable|date',
        ]);

        $patient = Patient::where('tenant_id', $user->tenant_id)->findOrFail($validated['patient_id']);

        $assignment = HomeworkAssignment::create([
            'clinic_id' => $user->tenant_id,
            'patient_id' => $patient->id,
            'specialist_id' => $user->id,
            'exercise_title' => $validated['exercise_title'],
            'instructions' => $validated['instructions'],
            'category' => $validated['category'] ?? 'rehabilitation',
            'due_date' => $validated['due_date'] ?? now()->addDays(7)->toDateString(),
            'is_completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إرسال التمرين العلاجي بنجاح إلى بوابة الولي والمريض الرقمية.',
            'assignment' => $assignment,
        ]);
    }
}
