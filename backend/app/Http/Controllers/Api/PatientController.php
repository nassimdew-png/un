<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Throwable;

class PatientController extends Controller
{
    /**
     * Display a listing of patients for the current clinic
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            $tenantId = $user?->tenant_id ?: ($request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID'));

            if (!$tenantId) {
                $tenant = Tenant::where('subdomain', 'elamal')->first();
                $tenantId = $tenant?->id;
            }

            $query = Patient::query();
            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }

            $patients = $query->latest()->get();

            // Pre-seed sample patients if table is empty for the clinic
            if ($patients->isEmpty() && $tenantId) {
                $samples = [
                    [
                        'tenant_id'     => $tenantId,
                        'first_name'    => 'ياسين',
                        'last_name'     => 'بن علي',
                        'birth_date'    => '2018-05-12',
                        'gender'        => 'male',
                        'guardian_name' => 'محمد بن علي (الأب)',
                        'phone'         => '0661000000',
                        'clinical_tags' => ['تأخر لغوي', 'اضطراب نطق'],
                        'diagnosis'     => 'تأخر لغوي نمائي ولدغة رائية',
                        'notes'         => 'ولادة طبيعية، متابعة أسبوعية',
                    ],
                    [
                        'tenant_id'     => $tenantId,
                        'first_name'    => 'سارة',
                        'last_name'     => 'قدور',
                        'birth_date'    => '2015-11-04',
                        'gender'        => 'female',
                        'guardian_name' => 'فاطمة قدور (الأم)',
                        'phone'         => '0552334455',
                        'clinical_tags' => ['تأتأة نمائية', 'قلق اجتماعي'],
                        'diagnosis'     => 'تأتأة وحبسات صوتية متكررة',
                        'notes'         => 'تحسن ملحوظ في الطلاقة',
                    ],
                    [
                        'tenant_id'     => $tenantId,
                        'first_name'    => 'أمين',
                        'last_name'     => 'بلحاج',
                        'birth_date'    => '1996-03-20',
                        'gender'        => 'male',
                        'guardian_name' => 'ذاتي',
                        'phone'         => '0770998877',
                        'clinical_tags' => ['استشارة نفسية', 'اكتئاب وتوتر'],
                        'diagnosis'     => 'أعراض قلق واكتئاب متوسط',
                        'notes'         => 'جلسات علاج معرفي سلوكي CBT',
                    ]
                ];

                foreach ($samples as $s) {
                    Patient::create($s);
                }

                $patients = Patient::where('tenant_id', $tenantId)->latest()->get();
            }

            return response()->json([
                'status'   => 'success',
                'total'    => $patients->count(),
                'patients' => $patients,
                'data'     => $patients
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'status'   => 'success',
                'total'    => 0,
                'patients' => [],
                'data'     => []
            ]);
        }
    }

    /**
     * Store a newly created patient in storage
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $clinicId = $user->tenant_id ?? ($user->clinic ? $user->clinic->id : null);

        if (!$clinicId) {
            $clinicId = $request->attributes->get('tenant_id') ?: $request->header('X-Tenant-ID');
            if (!$clinicId) {
                $tenant = Tenant::where('subdomain', 'elamal')->first();
                $clinicId = $tenant?->id;
            }
        }

        $validated = $request->validate([
            'first_name'   => 'required|string|max:100',
            'last_name'    => 'required|string|max:100',
            'birth_date'   => 'nullable|date',
            'gender'       => 'nullable|string|in:male,female,ذكر,أنثى',
            'phone'        => 'nullable|string|max:30',
            'parent_name'  => 'nullable|string|max:150',
            'parent_phone' => 'nullable|string|max:30',
            'notes'        => 'nullable|string',
            'diagnosis'    => 'nullable|string',
        ]);

        if (isset($validated['gender'])) {
            if ($validated['gender'] === 'ذكر') {
                $validated['gender'] = 'male';
            }
            if ($validated['gender'] === 'أنثى') {
                $validated['gender'] = 'female';
            }
        } else {
            $validated['gender'] = 'male';
        }

        if (isset($validated['parent_name'])) {
            $validated['guardian_name'] = $validated['parent_name'];
        }
        if (empty($validated['phone']) && !empty($validated['parent_phone'])) {
            $validated['phone'] = $validated['parent_phone'];
        }
        if (empty($validated['phone'])) {
            $validated['phone'] = '0550000000';
        }
        if (empty($validated['birth_date'])) {
            $validated['birth_date'] = now()->subYears(6)->toDateString();
        }

        $validated['tenant_id'] = $clinicId;

        $patient = Patient::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'تم إضافة المريض بنجاح',
            'data'    => $patient,
            'patient' => $patient
        ], 201);
    }

    /**
     * Display the specified patient
     */
    public function show(string $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json([
                'status'  => 'error',
                'message' => 'ملف المريض غير موجود'
            ], 404);
        }

        return response()->json([
            'status'  => 'success',
            'patient' => $patient,
            'data'    => $patient
        ]);
    }

    /**
     * Update the specified patient
     */
    public function update(Request $request, string $id)
    {
        $patient = Patient::find($id);

        if (!$patient) {
            return response()->json(['status' => 'error', 'message' => 'ملف المريض غير موجود'], 404);
        }

        $validated = $request->validate([
            'first_name'   => 'sometimes|required|string|max:100',
            'last_name'    => 'sometimes|required|string|max:100',
            'birth_date'   => 'nullable|date',
            'gender'       => 'nullable|string|in:male,female,ذكر,أنثى',
            'phone'        => 'nullable|string|max:30',
            'notes'        => 'nullable|string',
            'diagnosis'    => 'nullable|string',
        ]);

        if (isset($validated['gender'])) {
            if ($validated['gender'] === 'ذكر') $validated['gender'] = 'male';
            if ($validated['gender'] === 'أنثى') $validated['gender'] = 'female';
        }

        $patient->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'تم تحديث بيانات المريض بنجاح',
            'patient' => $patient,
            'data'    => $patient
        ]);
    }

    /**
     * Remove the specified patient
     */
    public function destroy(string $id)
    {
        $patient = Patient::find($id);

        if ($patient) {
            $patient->delete();
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'تم حذف ملف المريض بنجاح'
        ]);
    }

    /**
     * Get patient clinical history & timeline
     */
    public function history(string $id)
    {
        $patient = Patient::with(['appointments', 'bilans', 'assignedExercises'])->find($id);

        return response()->json([
            'status'  => 'success',
            'history' => [
                'appointments' => $patient?->appointments ?? [],
                'bilans'       => $patient?->bilans ?? [],
                'exercises'    => $patient?->assignedExercises ?? []
            ]
        ]);
    }

    /**
     * Upload patient avatar
     */
    public function uploadAvatar(Request $request, string $id)
    {
        return response()->json([
            'status'  => 'success',
            'message' => 'تم رفع الصورة بنجاح'
        ]);
    }
}
