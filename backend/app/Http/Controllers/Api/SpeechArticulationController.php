<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SpeechArticulationAssessment;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class SpeechArticulationController extends Controller
{
    /**
     * Get all speech articulation assessments for a patient.
     */
    public function getPatientAssessments(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = SpeechArticulationAssessment::where('patient_id', $patientId)
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
     * Get the latest speech articulation assessment for a patient.
     */
    public function getLatest(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $query = SpeechArticulationAssessment::where('patient_id', $patientId)
            ->with(['specialist:id,name,email', 'appointment:id,appointment_date,status,type'])
            ->orderBy('assessment_date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->user() && $request->user()->tenant_id) {
            $query->where(function ($q) use ($request) {
                $q->where('tenant_id', $request->user()->tenant_id)
                  ->orWhereNull('tenant_id');
            });
        }

        $assessment = $query->first();

        return response()->json([
            'success' => true,
            'data' => $assessment,
        ]);
    }

    /**
     * Store a new speech articulation assessment.
     */
    public function store(Request $request, $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'appointment_id' => 'nullable|integer',
            'assessment_date' => 'nullable|date',
            'bucco_facial_exam' => 'nullable|array',
            'phonetic_inventory' => 'nullable|array',
            'auditory_discrimination' => 'nullable|array',
            'total_consonants_tested' => 'nullable|integer',
            'correct_consonants_count' => 'nullable|integer',
            'pcc_percentage' => 'nullable|numeric',
            'severity_level' => 'nullable|string',
            'distorted_sounds' => 'nullable|array',
            'omitted_sounds' => 'nullable|array',
            'substituted_sounds' => 'nullable|array',
            'clinical_summary' => 'nullable|string',
            'therapeutic_goals' => 'nullable|array',
        ]);

        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : ($patient->tenant_id ?? null);
        $specialistId = $user ? $user->id : null;

        $assessment = SpeechArticulationAssessment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $patient->id,
            'specialist_id' => $specialistId,
            'appointment_id' => $validated['appointment_id'] ?? null,
            'assessment_date' => $validated['assessment_date'] ?? now()->toDateString(),
            'bucco_facial_exam' => $validated['bucco_facial_exam'] ?? [],
            'phonetic_inventory' => $validated['phonetic_inventory'] ?? [],
            'auditory_discrimination' => $validated['auditory_discrimination'] ?? [],
            'total_consonants_tested' => $validated['total_consonants_tested'] ?? 0,
            'correct_consonants_count' => $validated['correct_consonants_count'] ?? 0,
            'pcc_percentage' => $validated['pcc_percentage'] ?? 0.0,
            'severity_level' => $validated['severity_level'] ?? 'mild',
            'distorted_sounds' => $validated['distorted_sounds'] ?? [],
            'omitted_sounds' => $validated['omitted_sounds'] ?? [],
            'substituted_sounds' => $validated['substituted_sounds'] ?? [],
            'clinical_summary' => $validated['clinical_summary'] ?? null,
            'therapeutic_goals' => $validated['therapeutic_goals'] ?? [],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ فحص النطق والأرطوفونيا بنجاح في سجل المريض',
            'data' => $assessment->load(['specialist:id,name', 'appointment:id,appointment_date']),
        ], 201);
    }

    /**
     * Show a single assessment.
     */
    public function show($id): JsonResponse
    {
        $assessment = SpeechArticulationAssessment::with(['patient', 'specialist', 'appointment'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $assessment,
        ]);
    }

    /**
     * Delete an assessment.
     */
    public function destroy($id): JsonResponse
    {
        $assessment = SpeechArticulationAssessment::findOrFail($id);
        $assessment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف سجل فحص النطق بنجاح',
        ]);
    }
}
