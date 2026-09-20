<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PsychomotorAssessment;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class PsychomotorAssessmentController extends Controller
{
    /**
     * Get all psychomotor assessments for a patient.
     */
    public function getPatientAssessments(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = PsychomotorAssessment::where('patient_id', $patientId)
            ->with(['specialist:id,name,email', 'appointment:id,appointment_date,status,type'])
            ->orderBy('assessment_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->user() && $request->user()->tenant_id) {
            $query->where(function ($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id)
                  ->orWhereNull('tenant_id');
            });
        }

        $assessments = $query->get();

        return response()->json([
            'success' => true,
            'data' => $assessments,
        ]);
    }

    /**
     * Get the latest psychomotor assessment for a patient.
     */
    public function getLatest(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = PsychomotorAssessment::where('patient_id', $patientId)
            ->with(['specialist:id,name,email', 'appointment:id,appointment_date,status,type'])
            ->orderBy('assessment_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->user() && $request->user()->tenant_id) {
            $query->where(function ($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id)
                  ->orWhereNull('tenant_id');
            });
        }

        $latest = $query->first();

        return response()->json([
            'success' => true,
            'data' => $latest,
        ]);
    }

    /**
     * Store a new psychomotor assessment.
     */
    public function store(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'appointment_id' => 'nullable|integer',
            'assessment_date' => 'nullable|date',
            'body_map_data' => 'nullable|array',
            'body_map_stats' => 'nullable|array',
            'balance_battery' => 'nullable|array',
            'lateralization' => 'nullable|array',
            'lateral_profile' => 'nullable|array',
            'visuo_motor' => 'nullable|array',
            'spatial_temporal' => 'nullable|array',
            'clinical_summary' => 'nullable|string',
            'therapeutic_goals' => 'nullable|array',
        ]);

        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : ($patient->tenant_id ?? null);
        $specialistId = $user ? $user->id : null;

        $assessment = PsychomotorAssessment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $patient->id,
            'specialist_id' => $specialistId,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'assessment_date' => $validated['assessment_date'] ?? now()->toDateString(),
            'body_map_data' => $validated['body_map_data'] ?? [],
            'body_map_stats' => $validated['body_map_stats'] ?? [],
            'balance_battery' => $validated['balance_battery'] ?? [],
            'lateralization' => $validated['lateralization'] ?? [],
            'lateral_profile' => $validated['lateral_profile'] ?? [],
            'visuo_motor' => $validated['visuo_motor'] ?? [],
            'spatial_temporal' => $validated['spatial_temporal'] ?? [],
            'clinical_summary' => $validated['clinical_summary'] ?? null,
            'therapeutic_goals' => $validated['therapeutic_goals'] ?? [],
        ]);

        // Sync sensory body map and profile to patient record for quick access
        if (!empty($validated['body_map_data'])) {
            $patient->update([
                'sensory_body_map' => $validated['body_map_data'],
                'sensory_profile' => $validated['body_map_stats'] ?? $patient->sensory_profile,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتوثيق فحص خريطة الجسد والتأهيل الحركي بنجاح',
            'data' => $assessment->load(['specialist:id,name,email', 'appointment:id,appointment_date,status,type']),
        ], 201);
    }

    public function index(Request $request, $patientId): JsonResponse
    {
        return $this->getPatientAssessments($request, $patientId);
    }

    public function latest(Request $request, $patientId): JsonResponse
    {
        return $this->getLatest($request, $patientId);
    }

    /**
     * Delete an assessment.
     */
    public function destroy($id): JsonResponse
    {
        $assessment = PsychomotorAssessment::findOrFail($id);
        $assessment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التقييم الحركي بنجاح',
        ]);
    }
}

