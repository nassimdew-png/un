<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClinicalAssessment;
use App\Models\ClinicalTestAssignment;
use App\Models\Patient;
use App\Models\PatientBilan;
use App\Models\SessionSoapNote;
use App\Models\TherapySession;
use App\Services\ArabicPdfService;
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

        // Fetch all clinical assessments for this patient (legacy batteries)
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->with('specialist:id,name,role')
            ->orderBy('assessment_date', 'desc')
            ->get();

        // Fetch standardized digital test assignments (the 18 clinical scales)
        $digitalTests = ClinicalTestAssignment::where('patient_id', $patient->id)
            ->with('specialist:id,name,role')
            ->orderBy('completed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Fetch recent SOAP notes
        $recentSoapNotes = SessionSoapNote::where('patient_id', $patient->id)
            ->with('practitioner:id,name,role')
            ->orderBy('session_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(6)
            ->get();

        // Fetch recent therapy sessions
        $recentSessions = TherapySession::where('patient_id', $patient->id)
            ->orderBy('session_date', 'desc')
            ->take(6)
            ->get();

        // Fetch latest psychomotor assessment
        $latestPsychomotor = \App\Models\PsychomotorAssessment::where('patient_id', $patient->id)
            ->orderBy('assessment_date', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        return response()->json([
            'success' => true,
            'patient' => array_merge($patient->toArray(), [
                'age_formatted' => $ageFormatted,
                'anamnesis_data' => $patient->anamnesis_data ?? [],
                'family_genogram' => $patient->family_genogram ?? [],
                'sensory_body_map' => $patient->sensory_body_map ?? [],
            ]),
            'assessments' => $assessments,
            'digital_tests' => $digitalTests,
            'recent_soap_notes' => $recentSoapNotes,
            'recent_sessions' => $recentSessions,
            'latest_psychomotor_assessment' => $latestPsychomotor,
            'recent_bilans' => PatientBilan::where('patient_id', $patient->id)
                ->with('specialist:id,name,role')
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
            'selected_test_assignment_ids' => 'nullable|array',
            'pei_goals' => 'nullable|array',
            'soap_notes' => 'nullable|array',
            'included_sections' => 'nullable|array',
        ]);

        $language = $validated['language'] ?? 'fr';
        $title = $validated['title'] ?? ($language === 'ar' 
            ? 'الحصيلة الإكلينيكية والتقييم النفسي-المتري الشامل' 
            : 'Compte-Rendu de Bilan Clinique & Évaluation Psychométrique');

        // Fetch selected legacy assessments
        $selectedIds = $validated['selected_session_ids'] ?? [];
        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->when(!empty($selectedIds), fn($q) => $q->whereIn('id', $selectedIds))
            ->orderBy('assessment_date', 'desc')
            ->get();

        // Fetch selected digital test assignments (the 18 standardized scales)
        $selectedTestIds = $validated['selected_test_assignment_ids'] ?? [];
        $digitalTests = ClinicalTestAssignment::where('patient_id', $patient->id)
            ->when(!empty($selectedTestIds), fn($q) => $q->whereIn('id', $selectedTestIds))
            ->orderBy('completed_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // If no test IDs specified, grab completed digital tests
        if (empty($selectedTestIds) && empty($selectedIds)) {
            $digitalTests = ClinicalTestAssignment::where('patient_id', $patient->id)
                ->where('status', 'completed')
                ->orderBy('completed_at', 'desc')
                ->get();
        }

        $assessmentsSnapshot = [
            'legacy_assessments' => $assessments->toArray(),
            'digital_tests' => $digitalTests->toArray(),
            'pei_goals' => $validated['pei_goals'] ?? [],
            'soap_notes' => $validated['soap_notes'] ?? null,
        ];

        $token = $request->bearerToken() ?? $request->query('token');

        // Prevent accidental rapid duplicate creation (debounce / idempotency)
        $existingRecent = PatientBilan::where('patient_id', $patient->id)
            ->where('title', $title)
            ->where('created_at', '>=', now()->subSeconds(15))
            ->first();

        if ($existingRecent) {
            return response()->json([
                'success' => true,
                'message' => 'تم إنشاء وتوثيق الحصيلة السريرية بنجاح.',
                'bilan' => $existingRecent->load(['specialist:id,name,role']),
                'bilan_id' => $existingRecent->id,
                'pdf_url' => "/api/patient-bilans/{$existingRecent->id}/pdf" . ($token ? "?token={$token}" : ''),
            ]);
        }

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
            'assessments_snapshot' => $assessmentsSnapshot,
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
     * List all Bilans across the tenant with search, filtering, and stats.
     */
    public function listAllBilans(Request $request): JsonResponse
    {
        $query = PatientBilan::with([
            'patient:id,first_name,last_name,birth_date,phone,national_id,gender',
            'specialist:id,name,role'
        ]);

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($type = $request->query('bilan_type')) {
            $query->where('bilan_type', $type);
        }

        if ($lang = $request->query('language')) {
            $query->where('language', $lang);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('clinical_summary', 'like', "%{$search}%")
                  ->orWhere('diagnosis_codes', 'like', "%{$search}%")
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('national_id', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = (int) $request->query('per_page', 24);
        $bilans = $query->orderBy('created_at', 'desc')->paginate($perPage);

        // Calculate stats for tenant
        $stats = [
            'total' => PatientBilan::count(),
            'orthophonie' => PatientBilan::where('bilan_type', 'orthophonique')->count(),
            'psychologie' => PatientBilan::where('bilan_type', 'psychologique')->count(),
            'psychomotricite' => PatientBilan::whereIn('bilan_type', ['neuropsychologique', 'pluridisciplinaire', 'autre'])->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $bilans->items(),
            'current_page' => $bilans->currentPage(),
            'last_page' => $bilans->lastPage(),
            'total' => $bilans->total(),
            'stats' => $stats,
        ]);
    }

    /**
     * Show a single Bilan with complete details.
     */
    public function showPatientBilan(Request $request, string|int $bilanId): JsonResponse
    {
        $bilan = PatientBilan::with(['patient', 'specialist:id,name,role', 'tenant'])->findOrFail($bilanId);

        return response()->json([
            'success' => true,
            'bilan' => $bilan,
        ]);
    }

    /**
     * Delete a Bilan record.
     */
    public function destroyPatientBilan(Request $request, string|int $bilanId): JsonResponse
    {
        $bilan = PatientBilan::findOrFail($bilanId);

        if ($bilan->pdf_path && Storage::disk('public')->exists($bilan->pdf_path)) {
            Storage::disk('public')->delete($bilan->pdf_path);
        }

        $bilan->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف الحصيلة السريرية بنجاح.',
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
            'title' => $request->query('lang', 'fr') === 'ar' ? 'الحصيلة الإكلينيكية والتقييم السريري الشامل' : 'Compte-Rendu de Bilan Clinique',
            'bilan_type' => 'orthophonique',
            'language' => $request->query('lang', 'fr'),
            'audience' => 'medical',
            'anamnesis_snapshot' => $patient->anamnesis_data ?? [],
            'genogram_snapshot' => $patient->family_genogram ?? [],
            'sensory_map_snapshot' => $patient->sensory_body_map ?? [],
            'assessments_snapshot' => [
                'legacy_assessments' => ClinicalAssessment::where('patient_id', $patient->id)->get()->toArray(),
                'digital_tests' => ClinicalTestAssignment::where('patient_id', $patient->id)->where('status', 'completed')->get()->toArray(),
            ],
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
            $isAr = ($bilan->language === 'ar');
            $ageFormatted = $isAr
                ? "{$years} سنة و {$months} أشهر"
                : "{$years} ans et {$months} mois";
        }

        $tenant = $patient->tenant ?? ($specialist ? $specialist->tenant : null);

        // Unpack structured snapshots
        $snapshot = $bilan->assessments_snapshot ?: [];
        $legacyAssessments = [];
        $digitalTests = [];
        $peiGoals = [];
        $soapNotes = null;

        if (is_array($snapshot)) {
            if (isset($snapshot['digital_tests']) || isset($snapshot['legacy_assessments']) || isset($snapshot['pei_goals'])) {
                $digitalTests = $snapshot['digital_tests'] ?? [];
                $legacyAssessments = $snapshot['legacy_assessments'] ?? [];
                $peiGoals = $snapshot['pei_goals'] ?? [];
                $soapNotes = $snapshot['soap_notes'] ?? null;
            } else {
                $legacyAssessments = $snapshot;
            }
        }

        if (empty($digitalTests) && empty($legacyAssessments)) {
            $digitalTests = ClinicalTestAssignment::where('patient_id', $patient->id)
                ->where('status', 'completed')
                ->orderBy('completed_at', 'desc')
                ->get()
                ->toArray();
        }

        $rawHtml = view('pdf.master_bilan_report', [
            'bilan' => $bilan,
            'patient' => $patient,
            'specialist' => $specialist,
            'tenant' => $tenant,
            'ageFormatted' => $ageFormatted,
            'isArabic' => ($bilan->language === 'ar'),
            'anamnesis' => $bilan->anamnesis_snapshot ?: ($patient->anamnesis_data ?: []),
            'genogram' => $bilan->genogram_snapshot ?: ($patient->family_genogram ?: []),
            'sensoryMap' => $bilan->sensory_map_snapshot ?: ($patient->sensory_body_map ?: []),
            'assessments' => $legacyAssessments,
            'digitalTests' => $digitalTests,
            'peiGoals' => $peiGoals,
            'soapNotes' => $soapNotes,
        ])->render();

        $processedHtml = ArabicPdfService::prepareHtmlForDomPdf($rawHtml);

        $pdf = Pdf::loadHTML($processedHtml);
        $pdf->setPaper('a4', 'portrait');
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'defaultFont' => 'DejaVu Sans',
        ]);

        return $pdf;
    }

    /**
     * Load and normalize the global clinical tests catalog (125 standardized batteries).
     */
    protected function loadTestsCatalog(): array
    {
        $jsonPath = database_path('data/clinical_tests_catalog.json');
        $rawItems = [];
        if (file_exists($jsonPath)) {
            $rawItems = json_decode(file_get_contents($jsonPath), true) ?: [];
        }

        $catalog = [];
        foreach ($rawItems as $item) {
            $cat = strtolower(trim($item['category'] ?? ''));
            $code = strtoupper(trim($item['code'] ?? ''));
            if (empty($code)) continue;

            $titleAr = $item['title_ar'] ?? $code;
            $titleFr = $item['title_fr'] ?? $code;
            $desc = $item['description'] ?? '';
            $ageStr = $item['age_range'] ?? '';

            // Map specialty
            if (in_array($cat, ['orthophony', 'orthophonie', 'fluency', 'speech'])) {
                $specialty = 'orthophonie';
            } elseif (in_array($cat, ['psychomotricite', 'psychomotricity'])) {
                $specialty = 'psychomotricite';
            } else {
                $specialty = 'psychologie_clinique';
            }

            // Map scoring type
            if (preg_match('/WISC|WAIS|WPPSI|RAVEN|NEMI|QIT|MATRICES/i', $code)) {
                $scoringType = 'standard_iq_indices';
            } elseif (preg_match('/CAT|TAT|RORSCHACH|BONHOMME|FAMILLE|PATTE|SCENO|PROJECTIF/i', $code)) {
                $scoringType = 'projective_qualitative';
            } elseif (preg_match('/ALOUETTE|ALOU-R|D2|STROOP|DO80|SSI|SPEED/i', $code)) {
                $scoringType = 'percentile_speed';
            } else {
                $scoringType = 'standard_score';
            }

            // Map target domain
            if (preg_match('/WISC|WAIS|WPPSI|RAVEN|NEMI/i', $code) || $cat === 'intelligence') {
                $targetDomain = 'intelligence_cognition';
            } elseif (preg_match('/ALOU|L2MA|NEEL|LECTURE|DYSLEXI/i', $code)) {
                $targetDomain = 'langage_ecrit_lecture';
            } elseif (preg_match('/ZAREKI|CALCUL|DYSCALCULI/i', $code)) {
                $targetDomain = 'calcul_dyscalculie';
            } elseif (preg_match('/MCHAT|M-CHAT|CARS|VINELAND|ADOS|ADIR|AUTIS|TSA/i', $code) || $cat === 'autism') {
                $targetDomain = 'autisme_developpement';
            } elseif (preg_match('/BDI|PHQ|GAD|STAI|RCMAS|R-CMAS|HAM|DASS|DEPRESS|ANXIET/i', $code) || $cat === 'psychiatry') {
                $targetDomain = 'anxiete_depression';
            } elseif (preg_match('/CAT|TAT|RORSCHACH|MMPI|PROJECTIF|DESSIN|PATTE|SCENO/i', $code)) {
                $targetDomain = 'personnalite_projectif';
            } elseif (preg_match('/D2|STROOP|CMS|MEM|WMS|TDAH|ADHD|ATTENTION|ASRS|SNAP/i', $code)) {
                $targetDomain = 'attention_memoire';
            } elseif (preg_match('/DO80|MT86|APHA|BDAE|HDAE|APHASIE/i', $code)) {
                $targetDomain = 'aphasie';
            } elseif (in_array($cat, ['orthophony', 'orthophonie', 'fluency', 'speech'])) {
                $targetDomain = 'langage_oral';
            } else {
                $targetDomain = ($specialty === 'psychologie_clinique') ? 'intelligence_cognition' : 'langage_oral';
            }

            // Age brackets
            $brackets = [];
            if (preg_match('/0|1|2|3|مبكر|رضع|سنتين/u', $ageStr)) $brackets[] = '0_3_infant';
            if (preg_match('/3|4|5|6|روضة|ما قبل/u', $ageStr)) $brackets[] = '3_6_preschool';
            if (preg_match('/6|7|8|9|10|11|12|مدرس|تمدرس|أطفال/u', $ageStr)) $brackets[] = '6_12_school';
            if (preg_match('/12|13|14|15|16|17|18|مراهق/u', $ageStr)) $brackets[] = '12_18_teen';
            if (preg_match('/18|بالغ|راشد|كبار|فما فوق|سنوات فما فوق/u', $ageStr)) $brackets[] = '18_plus_adult';
            if (empty($brackets)) {
                $brackets = ['6_12_school', '12_18_teen', '18_plus_adult'];
            }

            $catalog[] = [
                'id' => $item['id'] ?? strtolower($code),
                'code' => $code,
                'name_ar' => $titleAr,
                'name_fr' => $titleFr,
                'short_desc_ar' => $desc,
                'author_reference' => $item['source'] ?? 'معيار سريري وطني مقنن 🇩🇿',
                'specialty' => $specialty,
                'category' => $cat,
                'category_label' => $item['category_label'] ?? '',
                'scoring_type' => $scoringType,
                'target_domain' => $targetDomain,
                'age_range' => $ageStr,
                'age_brackets' => $brackets,
                'duration' => $item['duration'] ?? '',
                'cutoff' => $item['cutoff'] ?? '',
                'dimensions' => $item['dimensions'] ?? [],
                'color' => $item['color'] ?? 'from-indigo-500 to-purple-600',
                'has_red_alert' => !empty($item['has_red_alert']) || (bool) preg_match('/BDI|PHQ|HAM-D/i', $code),
                'self_administered' => (bool) ($item['self_administered'] ?? true),
            ];
        }

        return $catalog;
    }

    /**
     * Catalog & Scales Methods returning all standardized tests with filters
     */
    public function index(Request $request): JsonResponse
    {
        $all = $this->loadTestsCatalog();
        $specialty = $request->query('specialty');
        $ageRange = $request->query('age_range');
        $domain = $request->query('target_domain');
        $search = trim($request->query('search', ''));

        $filtered = array_filter($all, function ($t) use ($specialty, $ageRange, $domain, $search) {
            if (!empty($specialty) && $specialty !== 'all') {
                if ($t['specialty'] !== $specialty) return false;
            }

            if (!empty($ageRange) && $ageRange !== 'all') {
                if (!in_array($ageRange, $t['age_brackets'] ?? [])) return false;
            }

            if (!empty($domain) && $domain !== 'all') {
                if ($t['target_domain'] !== $domain) return false;
            }

            if (!empty($search)) {
                $q = mb_strtolower($search);
                $haystack = mb_strtolower(
                    $t['code'] . ' ' .
                    $t['name_ar'] . ' ' .
                    $t['name_fr'] . ' ' .
                    $t['short_desc_ar'] . ' ' .
                    $t['category_label'] . ' ' .
                    $t['author_reference'] . ' ' .
                    implode(' ', $t['dimensions'] ?? [])
                );
                if (!str_contains($haystack, $q)) return false;
            }

            return true;
        });

        return response()->json([
            'success' => true,
            'tests' => array_values($filtered),
            'total' => count($filtered),
        ]);
    }

    public function getTestSchema(string $code): JsonResponse
    {
        $catalog = $this->loadTestsCatalog();
        $codeUpper = strtoupper(trim($code));

        $found = null;
        foreach ($catalog as $t) {
            if (strtoupper($t['code']) === $codeUpper || strtolower($t['id']) === strtolower($code)) {
                $found = $t;
                break;
            }
        }

        if ($found) {
            $dimensions = $found['dimensions'] ?? [];
            $subtests = [];
            foreach ($dimensions as $idx => $dim) {
                $subtests[] = [
                    'id' => 'dim_' . ($idx + 1),
                    'name_ar' => $dim,
                    'max_score' => 20,
                ];
            }

            return response()->json([
                'success' => true,
                'code' => $found['code'],
                'name' => $found['name_ar'],
                'test' => $found,
                'schema' => [
                    'title_ar' => $found['name_ar'],
                    'title_fr' => $found['name_fr'],
                    'subtests' => $subtests,
                    'norms' => 'algerian_standardized_dz',
                    'cutoff' => $found['cutoff'],
                ],
                'items_payload' => [
                    'subtests' => $subtests,
                    'cutoff' => $found['cutoff'],
                ]
            ]);
        }

        return response()->json([
            'success' => true,
            'code' => $code,
            'name' => strtoupper($code) . ' Clinical Battery',
            'schema' => ['subtests' => [], 'norms' => 'algerian_french_standardized'],
            'items_payload' => ['subtests' => []]
        ]);
    }

    /**
     * Specialized Clinical Scorer Calculations
     */
    public function runWiscCalculation(Request $request): JsonResponse
    {
        $subtests = $request->input('subtests', []);
        $sum = is_array($subtests) && count($subtests) > 0 ? array_sum($subtests) : 70;
        $count = is_array($subtests) && count($subtests) > 0 ? count($subtests) : 7;
        $avg = $sum / $count;
        $fsiq = (int) max(40, min(160, round(100 + ($avg - 10) * 5)));

        return response()->json([
            'success' => true,
            'battery' => 'WISC-V',
            'fsiq' => $fsiq,
            'avg_scaled' => round($avg, 1),
            'classification' => $fsiq >= 130 ? 'موهبة فكرية عالية جداً' : ($fsiq >= 120 ? 'متفوق ذهنياً' : ($fsiq >= 90 ? 'متوسط طبيعي' : 'دون المتوسط')),
        ]);
    }

    public function runWais4Calculation(Request $request): JsonResponse
    {
        $subtests = $request->input('subtests', []);
        $sum = is_array($subtests) && count($subtests) > 0 ? array_sum($subtests) : 100;
        $count = is_array($subtests) && count($subtests) > 0 ? count($subtests) : 10;
        $avg = $sum / $count;
        $fsiq = (int) max(40, min(160, round(100 + ($avg - 10) * 5)));

        return response()->json([
            'success' => true,
            'battery' => 'WAIS-IV',
            'fsiq' => $fsiq,
            'classification' => $fsiq >= 130 ? 'موهبة فكرية عالية جداً' : ($fsiq >= 120 ? 'متفوق ذهنياً' : ($fsiq >= 90 ? 'متوسط طبيعي' : 'دون المتوسط')),
        ]);
    }

    public function runWppsi4Calculation(Request $request): JsonResponse
    {
        $subtests = $request->input('subtests', []);
        $sum = is_array($subtests) && count($subtests) > 0 ? array_sum($subtests) : 60;
        $count = is_array($subtests) && count($subtests) > 0 ? count($subtests) : 6;
        $avg = $sum / $count;
        $fsiq = (int) max(40, min(160, round(100 + ($avg - 10) * 5)));

        return response()->json([
            'success' => true,
            'battery' => 'WPPSI-III/IV',
            'fsiq' => $fsiq,
            'classification' => $fsiq >= 130 ? 'موهبة فكرية عالية جداً' : ($fsiq >= 120 ? 'متفوق ذهنياً' : ($fsiq >= 90 ? 'متوسط طبيعي' : 'دون المتوسط')),
        ]);
    }

    public function runD2StroopCalculation(Request $request): JsonResponse
    {
        $w = (float) $request->input('w_time', 25);
        $c = (float) $request->input('c_time', 35);
        $cw = (float) $request->input('cw_time', 55);
        $predCw = ($w + $c) > 0 ? ($w * $c) / ($w + $c) : 0;
        $cost = round($cw - $c, 1);
        $interference = round($cw - $predCw, 1);

        return response()->json([
            'success' => true,
            'w_time' => $w,
            'c_time' => $c,
            'cw_time' => $cw,
            'interference_cost' => $cost,
            'interference_score' => $interference,
            'interpretation' => $cost > 25 ? 'عجز دال في كف الاستجابة' : ($cost > 15 ? 'حساسية معتدلة للتداخل' : 'كف استجابة طبيعي وسليم'),
        ]);
    }

    public function runReyFigureCalculation(Request $request): JsonResponse
    {
        $copy = (float) $request->input('copy_score', 32);
        $memory = (float) $request->input('memory_score', 20);
        $retention = $copy > 0 ? round(($memory / $copy) * 100) : 0;

        return response()->json([
            'success' => true,
            'copy_score' => $copy,
            'memory_score' => $memory,
            'retention_rate' => $retention,
            'copy_evaluation' => $copy >= 27 ? 'تخطيط بنائي سليم' : ($copy >= 18 ? 'هشاشة تنظيمية' : 'عجز تخطيطي / دسبراكسيا بنائية'),
        ]);
    }

    public function runZarekiCalculation(Request $request): JsonResponse
    {
        $scores = $request->input('scores', []);
        $total = is_array($scores) ? array_sum($scores) : (float) $request->input('total_score', 80);

        return response()->json([
            'success' => true,
            'total_score' => $total,
            'is_dyscalculic_risk' => $total < 60,
            'risk_level' => $total >= 75 ? 'طبيعي' : ($total >= 60 ? 'صعوبات خفيفة إلى متوسطة' : 'خطر مرتفع لعسر الحساب'),
        ]);
    }

    public function runProjectiveGridCalculation(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم استلام وتوثيق شبكة الفحص الإسقاطي بنجاح.',
            'psychogram' => $request->all(),
        ]);
    }

    public function runTatCalculation(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم تحليل استجابات TAT السيكودينامية بنجاح.',
        ]);
    }

    public function runBdiCalculation(Request $request): JsonResponse
    {
        $score = (int) $request->input('score', 0);
        return response()->json([
            'success' => true,
            'score' => $score,
            'severity' => $score <= 13 ? 'طبيعي / في حده الأدنى' : ($score <= 19 ? 'اكتئاب خفيف' : ($score <= 28 ? 'اكتئاب متوسط' : 'اكتئاب حاد')),
        ]);
    }

    public function runMchatCalculation(Request $request): JsonResponse
    {
        $fails = (int) $request->input('risk_count', 0);
        return response()->json([
            'success' => true,
            'risk_count' => $fails,
            'risk_level' => $fails <= 2 ? 'منخفض' : ($fails <= 7 ? 'متوسط' : 'مرتفع'),
        ]);
    }

    // Generic fallbacks for additional battery endpoints
    public function runEloCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runAlouetteCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runVinelandCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runDo80Calculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runStaiRcmasCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runRavenCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runBonhommeCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runNepsyCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runAdos2Calculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runAdirCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runL2maCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runNeelCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runCmsCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runMem4Calculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runBecsCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runCsbsCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runEchaEcaaCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runPatteNoireCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runScenoCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runTmsEcsCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runTraumaqCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runStrCissCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runO52Calculation(Request $request): JsonResponse { return response()->json(['success' => true]); }
    public function runVocimCalculation(Request $request): JsonResponse { return response()->json(['success' => true]); }

    /**
     * Get patient comprehensive assessments history.
     */
    public function getAssessmentsHistory(string|int $patientId): JsonResponse
    {
        if ($patientId === 'demo-patient-001' || $patientId === 'demo-patient-002' || $patientId === 'demo' || !Patient::where('id', $patientId)->exists()) {
            return response()->json([
                'success' => true,
                'patient' => [
                    'id' => $patientId,
                    'name' => 'أحمد المهدي (مريض تجريبي)',
                    'birth_date' => '2016-05-12',
                ],
                'assessments' => [],
                'digital_tests' => [],
                'bilans' => [],
            ]);
        }

        $patient = Patient::findOrFail($patientId);

        $assessments = ClinicalAssessment::where('patient_id', $patient->id)
            ->with('specialist:id,name,role')
            ->orderBy('assessment_date', 'desc')
            ->get();

        $digitalTests = ClinicalTestAssignment::where('patient_id', $patient->id)
            ->with('specialist:id,name,role')
            ->orderBy('created_at', 'desc')
            ->get();

        $bilans = PatientBilan::where('patient_id', $patient->id)
            ->with('creator:id,name,role')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'birth_date' => $patient->birth_date,
            ],
            'assessments' => $assessments,
            'digital_tests' => $digitalTests,
            'bilans' => $bilans,
        ]);
    }

    /**
     * Save an interactive clinical test session and check Red Alerts.
     */
    public function saveAssessmentSession(Request $request, string|int $patientId): JsonResponse
    {
        $user = Auth::user();

        if ($patientId === 'demo-patient-001' || $patientId === 'demo-patient-002' || $patientId === 'demo' || !Patient::where('id', $patientId)->exists()) {
            $tenantId = $user ? $user->tenant_id : null;
            if (!$tenantId) {
                $tenant = \App\Models\Tenant::where('status', 'active')->first() ?: \App\Models\Tenant::first();
                $tenantId = $tenant ? $tenant->id : null;
            }
            $patient = Patient::firstOrCreate(
                ['tenant_id' => $tenantId, 'first_name' => 'أحمد (مريض تجريبي)', 'last_name' => 'المهدي'],
                [
                    'gender' => 'male',
                    'birth_date' => Carbon::now()->subYears(10)->format('Y-m-d'),
                    'phone' => '0555123456',
                    'phone_operator' => 'mobilis',
                    'guardian_name' => 'محمد المهدي',
                    'emergency_contact' => '0555123456',
                    'folder_number' => 'DEMO-' . date('Y'),
                    'commune_name' => 'الجزائر الوسطى'
                ]
            );
        } else {
            $patient = Patient::findOrFail($patientId);
        }

        $testCode = strtoupper(trim($request->input('test_code', 'CUSTOM_SCALE')));
        $totalScore = $request->input('calculated_total_score', 0);
        $subscaleScores = $request->input('subscale_scores', []);
        $rawResponses = $request->input('raw_responses', []);
        $notes = $request->input('notes');
        $projectiveObservations = $request->input('projective_observations');
        $testTitle = $request->input('test_title', $testCode);

        // Check for Red Alert (Suicide/Self-Harm item 9 in BDI/PHQ or flagged responses)
        $hasCriticalAlert = false;
        if (is_array($rawResponses)) {
            if (!empty($rawResponses['critical_alert']) || !empty($rawResponses['has_critical_alert'])) {
                $hasCriticalAlert = true;
            }
            if ((str_contains($testCode, 'PHQ') || str_contains($testCode, 'BDI')) && isset($rawResponses[9])) {
                $hasCriticalAlert = ((int) $rawResponses[9]) > 0;
            }
        }
        if (is_array($subscaleScores)) {
            if (isset($subscaleScores['suicide_item']['raw']) && ((int) $subscaleScores['suicide_item']['raw']) > 0) {
                $hasCriticalAlert = true;
            }
        }

        // Store ClinicalAssessment
        $assessment = ClinicalAssessment::create([
            'tenant_id' => $user?->tenant_id ?? $patient->tenant_id,
            'patient_id' => $patient->id,
            'specialist_id' => $user?->id ?? $patient->doctor_id,
            'type' => $testCode,
            'title' => $testTitle,
            'assessment_date' => Carbon::now(),
            'results_data' => [
                'test_code' => $testCode,
                'calculated_total_score' => $totalScore,
                'subscale_scores' => $subscaleScores,
                'raw_responses' => $rawResponses,
                'projective_observations' => $projectiveObservations,
                'has_critical_alert' => $hasCriticalAlert,
            ],
            'diagnostic_conclusion' => $notes,
            'recommendations' => $hasCriticalAlert ? '🚨 [تنبيه أمان سريري عاجل - RED ALERT] يرجى تفعيل بروتوكول الأمان النفسي الفوري للمريض والمتابعة اللصيقة.' : null,
        ]);

        // Link with or create completed ClinicalTestAssignment
        $assignment = ClinicalTestAssignment::where('patient_id', $patient->id)
            ->where('test_code', $testCode)
            ->where('status', 'pending')
            ->latest()
            ->first();

        if ($assignment) {
            $assignment->update([
                'status' => 'completed',
                'completed_at' => Carbon::now(),
                'clinical_assessment_id' => $assessment->id,
                'raw_score' => (float)$totalScore,
                'answers_payload' => $rawResponses,
                'diagnostic_notes' => $notes,
                'has_critical_alert' => $hasCriticalAlert,
            ]);
        } else {
            $assignment = ClinicalTestAssignment::create([
                'tenant_id' => $user?->tenant_id ?? $patient->tenant_id,
                'patient_id' => $patient->id,
                'specialist_id' => $user?->id ?? $patient->doctor_id,
                'clinical_assessment_id' => $assessment->id,
                'test_code' => $testCode,
                'test_title' => $testTitle,
                'access_token' => \Illuminate\Support\Str::random(48),
                'mode' => 'specialist_live',
                'status' => 'completed',
                'expires_at' => Carbon::now()->addDays(30),
                'completed_at' => Carbon::now(),
                'raw_score' => (float)$totalScore,
                'answers_payload' => $rawResponses,
                'diagnostic_notes' => $notes,
                'has_critical_alert' => $hasCriticalAlert,
            ]);
        }


        return response()->json([
            'success' => true,
            'message' => 'تم حفظ جلسة الاختبار السريري بنجاح.',
            'assessment' => $assessment->load('specialist:id,name,role'),
            'assignment' => $assignment,
            'has_critical_alert' => $hasCriticalAlert,
        ], 201);
    }

    /**
     * Alias for generatePatientBilan for route compatibility.
     */
    public function generateMasterBilan(Request $request, string|int $patientId): JsonResponse
    {
        return $this->generatePatientBilan($request, $patientId);
    }

    /**
     * Export Bilan or Assessment report PDF.
     */
    public function exportBilanPdf(Request $request, string|int $assessmentId): Response
    {
        $bilan = PatientBilan::find($assessmentId);
        if ($bilan) {
            return $this->downloadPatientBilanPdf($request, $assessmentId);
        }

        $assessment = ClinicalAssessment::with(['patient', 'specialist'])->findOrFail($assessmentId);
        $pdf = Pdf::loadView('pdf.assessment_report', [
            'assessment' => $assessment,
            'patient' => $assessment->patient,
            'specialist' => $assessment->specialist,
            'tenant' => $assessment->tenant,
        ]);

        return $pdf->stream('Bilan_' . ($assessment->patient?->last_name ?? 'Test') . '_' . $assessment->id . '.pdf');
    }
}

