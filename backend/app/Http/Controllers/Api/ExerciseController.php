<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\GlobalExercise;
use App\Models\HomeworkAssignment;
use App\Models\Patient;
use Illuminate\Support\Facades\Auth;

class ExerciseController extends Controller
{
    /**
     * Get list of clinical exercises from the global catalog.
     */
    public function index(Request $request): JsonResponse
    {
        $superAdmin = new SuperAdminController();
        return $superAdmin->getGlobalExercises($request);
    }

    /**
     * List homework assignments for a specific patient.
     */
    public function listHomeworks(Request $request, $patientId): JsonResponse
    {
        $homeworks = HomeworkAssignment::where('patient_id', $patientId)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $homeworks,
            'homeworks' => $homeworks,
        ]);
    }

    /**
     * Store a new homework assignment for a patient.
     */
    public function storeHomework(Request $request, $patientId): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'specialty' => 'nullable|string|max:50',
            'target_skill' => 'nullable|string|max:100',
            'instructions' => 'nullable|array',
            'worksheet_content' => 'nullable|array',
            'days_per_week' => 'nullable|integer|min:1|max:7',
            'duration_minutes' => 'nullable|integer|min:1',
            'due_date' => 'nullable|date',
            'tips' => 'nullable|string',
        ]);

        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;

        $assignment = HomeworkAssignment::create([
            'patient_id' => $patientId,
            'tenant_id' => $tenantId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'specialty' => $validated['specialty'] ?? 'general',
            'target_skill' => $validated['target_skill'] ?? null,
            'instructions' => $validated['instructions'] ?? [],
            'worksheet_content' => $validated['worksheet_content'] ?? null,
            'days_per_week' => $validated['days_per_week'] ?? 5,
            'duration_minutes' => $validated['duration_minutes'] ?? 10,
            'due_date' => $validated['due_date'] ?? now()->addDays(7),
            'tips' => $validated['tips'] ?? null,
            'status' => 'assigned',
            'is_completed' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إسناد التمرين المنزلي للمريض بنجاح.',
            'data' => $assignment,
        ], 201);
    }

    /**
     * Delete a homework assignment.
     */
    public function deleteHomework(Request $request, $patientId, $homeworkId): JsonResponse
    {
        $assignment = HomeworkAssignment::where('patient_id', $patientId)
            ->where('id', $homeworkId)
            ->firstOrFail();

        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التمرين المنزلي بنجاح.',
        ]);
    }

    /**
     * Download or export PDF for homework.
     */
    public function downloadPdf($id)
    {
        $homework = HomeworkAssignment::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $homework,
            'message' => 'Homework PDF generator placeholder.',
        ]);
    }

    public function exportHomeworkPdf(Request $request, $patientId, $homeworkId)
    {
        return $this->downloadPdf($homeworkId);
    }
}

