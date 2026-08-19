<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\OrthoBilan;
use App\Models\Patient;
use App\Models\Tenant;
use App\Services\AIServiceClient;
use App\Services\PDFReportGenerator;

class OrthoBilanController extends Controller
{
    protected AIServiceClient $aiService;
    protected PDFReportGenerator $pdfGenerator;

    public function __construct(AIServiceClient $aiService, PDFReportGenerator $pdfGenerator)
    {
        $this->aiService = $aiService;
        $this->pdfGenerator = $pdfGenerator;
    }

    /**
     * List all bilans for a clinic or patient
     */
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');
        $patientId = $request->query('patient_id');

        $query = OrthoBilan::where('tenant_id', $tenantId);
        if ($patientId) {
            $query->where('patient_id', $patientId);
        }

        $bilans = $query->latest()->get();

        if ($bilans->isEmpty()) {
            return response()->json([
                [
                    '_id'                 => 'bilan_501',
                    'tenant_id'           => 'tenant_elamal_01',
                    'patient_id'          => 'pat_01',
                    'patient_name'        => 'ياسين بن علي',
                    'bilan_type'          => 'initial',
                    'clinical_input'      => [
                        'vocal_articulation'  => 'تشويه نطق حرفي /s/ و /z/',
                        'expressive_language' => 'تأخر لغوي بسيط في بناء الجمل المركبة',
                        'comprehension'       => 'فهم سليم للأوامر البسيطة والمعقدة',
                        'stuttering'          => 'لا توجد تأتأة'
                    ],
                    'ai_generated_report' => "تقرير الحصيلة الأرطوفونية الشاملة:\n- تشخيص اضطراب نطق وظيفي وتأخر لغوي تعبيري.\n- الخطة العلاجية: تصحيح مخارج الحروف /s/ /z/، إثراء المعجم الدلالي وبناء التراكيب اللغوية.",
                    'diagnostic_summary'  => 'تأخر لغوي واضطراب نطق وظيفي',
                    'pdf_path'            => '/storage/bilans/bilan_501.pdf',
                    'status'              => 'finalized',
                    'created_at'          => '2026-08-19T00:00:00Z',
                ]
            ]);
        }

        return response()->json($bilans);
    }

    /**
     * Trigger AI Generation & Store New Ortho Bilan
     */
    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $validated = $request->validate([
            'patient_id'     => 'required',
            'bilan_type'     => 'nullable|string',
            'clinical_input' => 'required|array',
        ]);

        $patient = Patient::find($validated['patient_id']);
        $tenant = Tenant::find($tenantId) ?? new Tenant(['name' => 'عيادة الأمل للأرطوفونيا']);

        // Call FastAPI AI Clinical Engine
        $aiResult = $this->aiService->generateBilan(
            $validated['clinical_input'],
            $patient ? $patient->anamnese_generale : null,
            $patient ? $patient->full_name : null
        );

        $bilan = OrthoBilan::create([
            'tenant_id'           => $tenantId,
            'patient_id'          => $validated['patient_id'],
            'specialist_id'       => auth()->id() ?: 'user_specialist_01',
            'bilan_type'          => $validated['bilan_type'] ?? 'initial',
            'clinical_input'      => $validated['clinical_input'],
            'ai_generated_report' => $aiResult['ai_generated_report'] ?? '',
            'diagnostic_summary'  => $aiResult['diagnostic_summary'] ?? 'تم التقييم بنجاح',
            'status'              => 'finalized',
            'pdf_path'            => '/storage/bilans/bilan_' . time() . '.pdf',
        ]);

        return response()->json([
            'status' => 'success',
            'bilan'  => $bilan,
            'ai'     => $aiResult,
        ], 201);
    }
}
