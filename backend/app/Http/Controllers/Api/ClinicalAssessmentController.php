<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalAssessment;
use App\Models\Patient;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class ClinicalAssessmentController extends Controller
{
    /**
     * Display a listing of assessments (tenant-scoped).
     */
    public function index(Request $request): JsonResponse
    {
        $query = ClinicalAssessment::with(['patient', 'specialist']);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('diagnostic_conclusion', 'like', "%{$search}%");
            });
        }

        $assessments = $query->latest('assessment_date')->paginate((int) $request->query('per_page', 20));

        return response()->json($assessments);
    }

    /**
     * Store a newly created assessment (tenant-scoped).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'type' => 'required|in:orthophony_bilan,psychometric_eval,initial_anamnesis',
            'title' => 'required|string|max:255',
            'assessment_date' => 'required|date',
            'results_data' => 'nullable|array',
            'diagnostic_conclusion' => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        $validated['specialist_id'] = Auth::id();

        $assessment = ClinicalAssessment::create($validated);

        return response()->json([
            'message' => 'Bilan clinique enregistré avec succès.',
            'assessment' => $assessment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Display the specified assessment.
     */
    public function show(string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::with(['patient', 'specialist', 'tenant'])->findOrFail($id);

        return response()->json([
            'assessment' => $assessment,
        ]);
    }

    /**
     * Update the specified assessment.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'assessment_date' => 'sometimes|required|date',
            'results_data' => 'nullable|array',
            'diagnostic_conclusion' => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        $assessment->update($validated);

        return response()->json([
            'message' => 'Bilan clinique mis à jour.',
            'assessment' => $assessment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Remove the specified assessment.
     */
    public function destroy(string $id): JsonResponse
    {
        $assessment = ClinicalAssessment::findOrFail($id);
        $assessment->delete();

        return response()->json([
            'message' => 'Bilan clinique supprimé avec succès.',
        ]);
    }

    /**
     * Generate and stream/download clinical PDF report.
     */
    public function generatePdf(string $id): Response
    {
        $assessment = ClinicalAssessment::with(['patient', 'specialist', 'tenant'])->findOrFail($id);

        $pdf = Pdf::loadView('pdf.assessment_report', [
            'assessment' => $assessment,
            'patient' => $assessment->patient,
            'specialist' => $assessment->specialist,
            'tenant' => $assessment->tenant,
        ]);

        $fileName = 'Bilan_' . $assessment->patient->last_name . '_' . $assessment->id . '.pdf';

        return $pdf->stream($fileName);
    }
}
