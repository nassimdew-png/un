<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\GlobalExercise;
use App\Models\PatientHomeworkPlan;
use App\Models\HomeworkAssignment;
use Illuminate\Support\Facades\Auth;

class TherapyHubController extends Controller
{
    /**
     * Get exercises catalog for therapy hub.
     */
    public function getExercises(Request $request): JsonResponse
    {
        $superAdmin = new SuperAdminController();
        return $superAdmin->getGlobalExercises($request);
    }

    /**
     * Get single exercise.
     */
    public function getExercise($id): JsonResponse
    {
        $exercise = GlobalExercise::where('id', $id)
            ->orWhere('exercise_code', $id)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'exercise' => $exercise,
        ]);
    }

    /**
     * Get homework plans for a patient.
     */
    public function getPatientHomeworkPlans(Request $request, $patientId): JsonResponse
    {
        $plans = HomeworkAssignment::where('patient_id', $patientId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'plans' => $plans,
        ]);
    }

    /**
     * Assign homework plan.
     */
    public function assignHomeworkPlan(Request $request, $patientId): JsonResponse
    {
        $exerciseCtrl = new ExerciseController();
        return $exerciseCtrl->storeHomework($request, $patientId);
    }

    /**
     * Update homework plan status.
     */
    public function updateHomeworkPlanStatus(Request $request, $planId): JsonResponse
    {
        $assignment = HomeworkAssignment::findOrFail($planId);
        $assignment->update($request->only(['status', 'is_completed', 'notes']));

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث حالة الخطة بنجاح.',
            'plan' => $assignment,
        ]);
    }

    /**
     * Delete homework plan.
     */
    public function deleteHomeworkPlan($planId): JsonResponse
    {
        $assignment = HomeworkAssignment::findOrFail($planId);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الخطة بنجاح.',
        ]);
    }

    /**
     * Generate printable workbook PDF placeholder.
     */
    public function generateWorkbookPdf($planId)
    {
        $plan = HomeworkAssignment::findOrFail($planId);
        return response()->json([
            'success' => true,
            'message' => 'Generating workbook PDF...',
            'data' => $plan,
        ]);
    }
}
