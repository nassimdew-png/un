<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalAssessment;
use App\Models\Patient;
use App\Models\PatientBilan;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ClinicalAssessmentCatalogController extends Controller
{
    /**
     * Get patient comprehensive data for the Master Bilan Builder.
     */
    public function getPatientBilanData(string|int $patientId): JsonResponse
    {
        $user = Auth::user();
        $patient = Patient::findOrFail($patientId);

        // Calculate detailed chronological age
        $ageFormatted = '--';
        if ($patient->birth_date) {
            $birth = Carbon::parse($patient->birth_date);
            $now = Carbon::now();
            $years = (int) $birth->diffInYears($now);
            $months = (int) ($birth->diffInMonths($now) % 12);
            $ageFormatted = "{$years} ans et {$months} mois ({$years} سنة و {$months} أشهر)";
        }

        // Fetch all clinical assessments for this patient
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->with('specialist:id,name,role')
            ->orderBy('assessment_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'patient' => array_merge($patient->toArray(), [
                'age_formatted' => $ageFormatted,
                'anamnesis_data' => $patient->anamnesis_data ?? [],
                'family_genogram' => $patient->family_genogram ?? [],
                'sensory_body_map' => $patient->sensory_body_map ?? [],
            ]),
            'assessments' => $assessments,
            'recent_bilans' => PatientBilan::where('patient_id', $patient->id)
                ->orderBy('created_at', 'desc')
                ->take(5)
                ->get(),
        ]);
    }

    /**
     * Generate and store a new Master Clinical Bilan.
     */
    public function generatePatientBilan(Request $request, string|int $patientId): JsonResponse
    {
        $user = Auth::user();
        $patient = Patient::findOrFail($patientId);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'bilan_type' => 'nullable|string|in:orthophonique,psychologique,neuropsychologique,pluridisciplinaire,psychomoteur',
            'language' => 'nullable|string|in:ar,fr',
            'audience' => 'nullable|string|in:medical,parent,school',
            'clinical_summary' => 'nullable|string',
            'psychometric_analysis' => 'nullable|string',
            'strengths_weaknesses' => 'nullable|string',
            'diagnosis_codes' => 'nullable|string',
            'therapeutic_project' => 'nullable|string',
            'selected_session_ids' => 'nullable|array',
            'included_sections' => 'nullable|array',
        ]);

        $language = $validated['language'] ?? 'fr';
        $title = $validated['title'] ?? ($language === 'ar' 
            ? 'الحصيلة الإكلينيكية والتقييم النفسي-المتري الشامل' 
            : 'Compte-Rendu de Bilan Clinique & Évaluation Psychométrique');

        // Fetch selected assessments
        $selectedIds = $validated['selected_session_ids'] ?? [];
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->when(!empty($selectedIds), fn($q) => $q->whereIn('id', $selectedIds))
            ->orderBy('assessment_date', 'desc')
            ->get();

        // Create the Bilan record with frozen snapshots
        $bilan = PatientBilan::create([
            'tenant_id' => $user ? $user->tenant_id : ($patient->tenant_id ?? null),
            'patient_id' => $patient->id,
            'user_id' => $user ? $user->id : null,
            'specialist_id' => $user ? $user->id : null,
            'title' => $title,
            'bilan_type' => $validated['bilan_type'] ?? 'orthophonique',
            'language' => $language,
            'audience' => $validated['audience'] ?? 'medical',
            'clinical_summary' => $validated['clinical_summary'] ?? null,
            'psychometric_analysis' => $validated['psychometric_analysis'] ?? null,
            'strengths_weaknesses' => $validated['strengths_weaknesses'] ?? null,
            'diagnosis_codes' => $validated['diagnosis_codes'] ?? null,
            'therapeutic_project' => $validated['therapeutic_project'] ?? null,
            'included_sections' => $validated['included_sections'] ?? [
                'genogram' => true,
                'sensory_map' => true,
                'anamnesis' => true,
                'assessments' => true,
                'therapeutic_project' => true,
            ],
            'anamnesis_snapshot' => $patient->anamnesis_data ?? [],
            'genogram_snapshot' => $patient->family_genogram ?? [],
            'sensory_map_snapshot' => $patient->sensory_body_map ?? [],
            'assessments_snapshot' => $assessments->toArray(),
            'status' => 'finalized',
        ]);

        // Generate and store PDF file
        try {
            $pdf = $this->renderBilanPdfInstance($bilan, $patient, $user);
            $fileName = "bilans/bilan_{$bilan->id}_" . time() . ".pdf";
            Storage::disk('public')->put($fileName, $pdf->output());
            $bilan->update(['pdf_path' => $fileName]);
        } catch (\Exception $e) {
            \Log::warning("Could not pre-save PDF file for bilan {$bilan->id}: " . $e->getMessage());
        }

        $token = $request->bearerToken() ?? $request->query('token');

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء وتوثيق الحصيلة السريرية بنجاح.',
            'bilan' => $bilan->load(['specialist:id,name,role']),
            'bilan_id' => $bilan->id,
            'pdf_url' => "/api/patient-bilans/{$bilan->id}/pdf" . ($token ? "?token={$token}" : ''),
        ], 201);
    }

    /**
     * List all Bilans for a patient.
     */
    public function listPatientBilans(string|int $patientId): JsonResponse
    {
        $bilans = PatientBilan::where('patient_id', $patientId)
            ->with('specialist:id,name,role')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'bilans' => $bilans,
            'count' => $bilans->count(),
        ]);
    }

    /**
     * Stream or download the compiled PDF for a specific Bilan.
     */
    public function downloadPatientBilanPdf(Request $request, string|int $bilanId): Response
    {
        $bilan = PatientBilan::with(['patient', 'specialist', 'tenant'])->findOrFail($bilanId);
        $patient = $bilan->patient;
        $specialist = $bilan->specialist;

        $pdf = $this->renderBilanPdfInstance($bilan, $patient, $specialist);
        $cleanLastName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $patient->last_name ?? 'Patient');
        $fileName = "Bilan_{$cleanLastName}_{$bilan->id}.pdf";

        return $pdf->stream($fileName);
    }

    /**
     * Direct Master Bilan PDF export for a patient.
     */
    public function exportMasterBilanPdf(Request $request, string|int $patientId): Response
    {
        $patient = Patient::with('tenant')->findOrFail($patientId);
        $latestBilan = PatientBilan::where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($latestBilan) {
            return $this->downloadPatientBilanPdf($request, $latestBilan->id);
        }

        // Assemble a live on-the-fly master bilan
        $bilan = new PatientBilan([
            'title' => 'Compte-Rendu de Bilan Clinique',
            'bilan_type' => 'orthophonique',
            'language' => $request->query('lang', 'fr'),
            'audience' => 'medical',
            'anamnesis_snapshot' => $patient->anamnesis_data ?? [],
            'genogram_snapshot' => $patient->family_genogram ?? [],
            'sensory_map_snapshot' => $patient->sensory_body_map ?? [],
            'assessments_snapshot' => ClinicalAssessment::where('patient_id', $patient->id)->get()->toArray(),
            'created_at' => now(),
        ]);

        $pdf = $this->renderBilanPdfInstance($bilan, $patient, Auth::user());
        return $pdf->stream("Master_Bilan_{$patient->id}.pdf");
    }

    /**
     * Render the DomPDF instance for the Master Bilan.
     */
    protected function renderBilanPdfInstance(PatientBilan $bilan, Patient $patient, $specialist = null)
    {
        // Calculate age
        $ageFormatted = '--';
        if ($patient->birth_date) {
            $birth = Carbon::parse($patient->birth_date);
            $now = Carbon::parse($bilan->created_at ?? now());
            $years = (int) $birth->diffInYears($now);
            $months = (int) ($birth->diffInMonths($now) % 12);
            $ageFormatted = "{$years} ans et {$months} mois ({$years} سنة و {$months} أشهر)";
        }

        $tenant = $patient->tenant ?? ($specialist ? $specialist->tenant : null);

        $pdf = Pdf::loadView('pdf.master_bilan_report', [
            'bilan' => $bilan,
            'patient' => $patient,
            'specialist' => $specialist,
            'tenant' => $tenant,
            'ageFormatted' => $ageFormatted,
            'isArabic' => ($bilan->language === 'ar'),
            'anamnesis' => $bilan->anamnesis_snapshot ?: ($patient->anamnesis_data ?: []),
            'genogram' => $bilan->genogram_snapshot ?: ($patient->family_genogram ?: []),
            'sensoryMap' => $bilan->sensory_map_snapshot ?: ($patient->sensory_body_map ?: []),
            'assessments' => $bilan->assessments_snapshot ?: [],
        ]);

        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ]);

        return $pdf;
    }

    /**
     * Catalog & Scales Fallback Methods for Route Compatibility
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'tests' => [
                ['code' => 'elo', 'name' => 'Évaluation du Langage Oral (ELO)', 'domain' => 'speech_language'],
                ['code' => 'wisc-v', 'name' => 'Échelle d\'Intelligence de Wechsler (WISC-V)', 'domain' => 'cognitive'],
                ['code' => 'alouette-r', 'name' => 'Test de Lecture Alouette-R', 'domain' => 'reading_dyslexia'],
                ['code' => 'mchat', 'name' => 'M-CHAT-R/F (Dépistage Autisme)', 'domain' => 'autism_screening'],
                ['code' => 'vineland', 'name' => 'Échelle de Comportement Adaptatif Vineland-II', 'domain' => 'adaptive_behavior'],
                ['code' => 'bdi', 'name' => 'Inventaire de Dépression de Beck (BDI-II)', 'domain' => 'mood_psychology'],
                ['code' => 'do80', 'name' => 'Test de Dénomination Orale DO-80', 'domain' => 'naming_lexicon'],
                ['code' => 'd2-stroop', 'name' => 'Test d\'Attention & Inhibition D2 / Stroop', 'domain' => 'executive_functions'],
            ]
        ]);
    }

    public function getTestSchema(string $code): JsonResponse
    {
        return response()->json([
            'success' => true,
            'code' => $code,
            'name' => strtoupper($code) . ' Clinical Battery',
            'schema' => ['subtests' => [], 'norms' => 'algerian_french_standardized']
        ]);
    }
}
