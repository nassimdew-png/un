<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalTestAssignment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RemoteAssessmentController extends Controller
{
    protected ClinicalTestAssignmentController $assignmentController;

    public function __construct()
    {
        $this->assignmentController = new ClinicalTestAssignmentController();
    }

    public function index(string|int $patientId): JsonResponse
    {
        return $this->assignmentController->getPatientAssignments($patientId);
    }

    public function createToken(Request $request, string|int $patientId): JsonResponse
    {
        return $this->assignmentController->store($request, $patientId);
    }

    public function destroy(string|int $id): JsonResponse
    {
        return $this->assignmentController->destroy($id);
    }

    public function verifyPin(Request $request, string $token): JsonResponse
    {
        $assignment = ClinicalTestAssignment::withoutGlobalScopes()
            ->where('access_token', $token)
            ->firstOrFail();

        $pin = $request->input('pin');
        if ($assignment->pin_code && $assignment->pin_code !== $pin) {
            return response()->json([
                'success' => false,
                'message' => 'رمز المرور غير صحيح.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم التحقق بنجاح.',
        ]);
    }

    public function saveDraft(Request $request, string $token): JsonResponse
    {
        $assignment = ClinicalTestAssignment::withoutGlobalScopes()
            ->where('access_token', $token)
            ->firstOrFail();

        $assignment->update([
            'answers_payload' => $request->input('answers', []),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ المسودة بنجاح.',
        ]);
    }

    public function submit(Request $request, string $token): JsonResponse
    {
        return $this->assignmentController->submitPublicTest($request, $token);
    }

    public function printSlip(Request $request, string $token): JsonResponse
    {
        $assignment = ClinicalTestAssignment::withoutGlobalScopes()
            ->with(['patient', 'tenant', 'specialist'])
            ->where('access_token', $token)
            ->firstOrFail();

        return response()->json([
            'success' => true,
            'assignment' => $assignment,
        ]);
    }
}
