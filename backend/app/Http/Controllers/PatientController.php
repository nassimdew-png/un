<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;

class PatientController extends Controller
{
    /**
     * List all patients scoped by tenant
     */
    public function index(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $patients = Patient::where('tenant_id', $tenantId)->latest()->get();

        if ($patients->isEmpty()) {
            // Seeded Demo Data matching scaffold.md specifications
            return response()->json([
                [
                    '_id'                   => 'pat_01',
                    'tenant_id'             => 'tenant_elamal_01',
                    'full_name'             => 'ياسين بن علي',
                    'birth_date'            => '2018-05-12',
                    'gender'                => 'male',
                    'guardian_name'         => 'محمد بن علي (الأب)',
                    'phone'                 => '0661000000',
                    'clinical_tags'         => ['تأخر لغوي', 'اضطراب نطق'],
                    'anamnese_generale'     => [
                        'pregnancy_notes'   => 'ولادة طبيعية دون مضاعفات',
                        'motor_development' => 'المشي في عمر 13 شهراً',
                        'school_grade'      => 'السنة الأولى ابتدائي'
                    ],
                    'created_at'            => '2026-08-19T00:00:00Z',
                ],
                [
                    '_id'                   => 'pat_02',
                    'tenant_id'             => 'tenant_elamal_01',
                    'full_name'             => 'سارة قدور',
                    'birth_date'            => '2015-11-04',
                    'gender'                => 'female',
                    'guardian_name'         => 'فاطمة قدور (الأم)',
                    'phone'                 => '0552334455',
                    'clinical_tags'         => ['تأتأة نمائية', 'قلق اجتماعي'],
                    'anamnese_generale'     => [
                        'pregnancy_notes'   => 'ولادة قيصرية',
                        'motor_development' => 'طبيعي',
                        'school_grade'      => 'السنة الرابعة ابتدائي'
                    ],
                    'created_at'            => '2026-08-18T00:00:00Z',
                ],
                [
                    '_id'                   => 'pat_03',
                    'tenant_id'             => 'tenant_elamal_01',
                    'full_name'             => 'أمين بلحاج',
                    'birth_date'            => '1996-03-20',
                    'gender'                => 'male',
                    'guardian_name'         => 'ذاتي',
                    'phone'                 => '0770998877',
                    'clinical_tags'         => ['استشارة نفسية', 'اكتئاب وتوتر'],
                    'anamnese_generale'     => [
                        'medical_history'   => 'لا توجد سوابق عضوية',
                        'occupation'        => 'مهندس برمجيات'
                    ],
                    'created_at'            => '2026-08-17T00:00:00Z',
                ]
            ]);
        }

        return response()->json($patients);
    }

    /**
     * Store a new patient
     */
    public function store(Request $request)
    {
        $tenantId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID', 'tenant_elamal_01');

        $validated = $request->validate([
            'full_name'             => 'required|string|max:255',
            'birth_date'            => 'required|date',
            'gender'                => 'required|in:male,female',
            'guardian_name'         => 'nullable|string',
            'phone'                 => 'nullable|string',
            'anamnese_generale'     => 'nullable|array',
            'clinical_tags'         => 'nullable|array',
        ]);

        $validated['tenant_id'] = $tenantId;
        $patient = Patient::create($validated);

        return response()->json($patient, 201);
    }

    /**
     * Show single patient details
     */
    public function show(string $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                '_id'                   => $id,
                'tenant_id'             => 'tenant_elamal_01',
                'full_name'             => 'ياسين بن علي',
                'birth_date'            => '2018-05-12',
                'gender'                => 'male',
                'guardian_name'         => 'محمد بن علي (الأب)',
                'phone'                 => '0661000000',
                'clinical_tags'         => ['تأخر لغوي', 'اضطراب نطق'],
                'anamnese_generale'     => [
                    'pregnancy_notes'   => 'ولادة طبيعية دون مضاعفات',
                    'motor_development' => 'المشي في عمر 13 شهراً',
                    'school_grade'      => 'السنة الأولى ابتدائي'
                ],
                'created_at'            => '2026-08-19T00:00:00Z',
            ]);
        }

        return response()->json($patient);
    }
}
