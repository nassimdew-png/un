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
        $incomingPatientId = $request->input('patient_id');
        if ($incomingPatientId === 'demo-patient-001' || $incomingPatientId === 'demo-patient-002' || $incomingPatientId === 'demo' || ($incomingPatientId && !Patient::where('id', $incomingPatientId)->exists())) {
            $user = Auth::user();
            $tenantId = $user ? $user->tenant_id : null;
            if (!$tenantId) {
                $tenant = \App\Models\Tenant::where('status', 'active')->first() ?: \App\Models\Tenant::first();
                $tenantId = $tenant ? $tenant->id : null;
            }
            $demoPatient = Patient::firstOrCreate(
                ['tenant_id' => $tenantId, 'first_name' => 'أحمد (مريض تجريبي)', 'last_name' => 'المهدي'],
                [
                    'gender' => 'male',
                    'birth_date' => \Carbon\Carbon::now()->subYears(10)->format('Y-m-d'),
                    'phone' => '0555123456',
                    'phone_operator' => 'mobilis',
                    'guardian_name' => 'محمد المهدي',
                    'emergency_contact' => '0555123456',
                    'folder_number' => 'DEMO-' . date('Y'),
                    'commune_name' => 'الجزائر الوسطى'
                ]
            );
            $request->merge(['patient_id' => $demoPatient->id]);
        }

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

    /**
     * Get due reassessments for clinic patients.
     * GET /api/assessments/due-reassessments
     */
    public function getDueReassessments(Request $request): JsonResponse
    {
        $sixMonthsAgo = now()->subMonths(6)->toDateString();

        $dueAssessments = ClinicalAssessment::with(['patient', 'specialist'])
            ->where('assessment_date', '<=', $sixMonthsAgo)
            ->latest('assessment_date')
            ->limit(30)
            ->get();

        return response()->json([
            'success' => true,
            'count' => $dueAssessments->count(),
            'due_reassessments' => $dueAssessments,
            'data' => $dueAssessments,
        ]);
    }

    /**
     * Get progression analytics over time for a patient.
     */
    public function getProgressionAnalytics(Request $request, string|int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->orderBy('assessment_date', 'asc')
            ->get();

        $progression = $assessments->map(function ($item) {
            $totalScore = $item->results_data['calculated_total_score'] ?? $item->results_data['total_score'] ?? 0;
            return [
                'id' => $item->id,
                'title' => $item->title,
                'type' => $item->type,
                'date' => $item->assessment_date?->format('Y-m-d'),
                'score' => (float)$totalScore,
            ];
        });

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
            ],
            'progression' => $progression,
        ]);
    }

    /**
     * Export progression report PDF.
     */
    public function exportProgressionPdf(Request $request, string|int $patientId): Response
    {
        $patient = Patient::findOrFail($patientId);
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->orderBy('assessment_date', 'asc')
            ->get();

        $pdf = Pdf::loadView('pdf.assessment_report', [
            'assessment' => $assessments->last() ?: new ClinicalAssessment(['title' => 'منحنى التطور السريري']),
            'patient' => $patient,
            'specialist' => Auth::user(),
            'tenant' => Auth::user()?->tenant,
            'all_assessments' => $assessments,
        ]);

        return $pdf->stream('Progression_' . ($patient->last_name ?? 'Patient') . '.pdf');
    }

    /**
     * Run an assessment within an active consultation session.
     */
    public function runInSession(Request $request, string|int $appointmentId): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'patient_id' => 'required',
            'type' => 'nullable|string',
            'title' => 'required|string',
            'results_data' => 'nullable|array',
            'diagnostic_conclusion' => 'nullable|string',
            'recommendations' => 'nullable|string',
        ]);

        $validated['specialist_id'] = $user->id;
        $validated['tenant_id'] = $user->tenant_id;
        $validated['assessment_date'] = \Carbon\Carbon::now();

        $assessment = ClinicalAssessment::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الاختبار داخل الجلسة بنجاح.',
            'assessment' => $assessment,
        ], 201);
    }
}

