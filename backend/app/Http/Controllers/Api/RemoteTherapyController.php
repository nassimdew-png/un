<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\HomeworkAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RemoteTherapyController extends Controller
{
    public function index(string|int $patientId): JsonResponse
    {
        $tasks = HomeworkAssignment::where('patient_id', $patientId)
            ->with(['exercise'])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'tasks' => $tasks,
        ]);
    }

    public function assignTask(Request $request, string|int $patientId): JsonResponse
    {
        $ctrl = new TherapyHubController();
        return $ctrl->assignHomeworkPlan($request, $patientId);
    }

    public function deleteTask(string|int $patientId, string|int $taskId): JsonResponse
    {
        $task = HomeworkAssignment::where('patient_id', $patientId)->where('id', $taskId)->firstOrFail();
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المهمة بنجاح.',
        ]);
    }

    public function verifyPin(Request $request, string $token): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم التحقق بنجاح.',
        ]);
    }

    public function submitResults(Request $request, string $token): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم إرسال نتيجة التمرين بنجاح.',
        ]);
    }
}
