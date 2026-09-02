<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomeworkAssignment;
use App\Models\Patient;
use App\Models\TreatmentPlan;
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
            'message' => 'تم حفظ وتثبيت المشروع العلاجي الفردي (PEP) بنجاح.',
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
