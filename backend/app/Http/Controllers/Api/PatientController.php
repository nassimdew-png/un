<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\PatientAiRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PatientController extends Controller
{
    /**
     * Display a listing of patients.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = Patient::query();

        if ($user && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('commune_name', 'like', "%{$search}%")
                  ->orWhere('national_id', 'like', "%{$search}%");
            });
        }

        $patients = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $patients,
            'patients' => $patients,
            'count' => $patients->count(),
        ]);
    }

    /**
     * Store a newly created patient with Genogram and Sensory Profile.
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'gender' => 'required|in:male,female',
            'birth_date' => 'required|date',
            'phone' => 'nullable|string|max:50',
            'phone_operator' => 'nullable|in:mobilis,djezzy,ooredoo,fixe,other',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'wilaya_code' => 'nullable|string|max:10',
            'wilaya_name' => 'nullable|string|max:255',
            'commune_name' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'social_security_number' => 'nullable|string|max:50',
            'parent_name' => 'nullable|string|max:255',
            'parent_relation' => 'nullable|string|max:100',
            'parent_phone' => 'nullable|string|max:50',
            'emergency_contact' => 'nullable|string|max:255',
            'blood_group' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'notes' => 'nullable|string',
            'diagnosis_primary' => 'nullable|string|max:255',
            'diagnosis_secondary' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'referral_source' => 'nullable|string|max:255',
            'school_name' => 'nullable|string|max:255',
            'school_grade' => 'nullable|string|max:100',
            'genogram_data' => 'nullable|array',
            'sensory_profile_data' => 'nullable|array',
        ]);

        $validated['tenant_id'] = $tenantId;
        $validated['created_by'] = $user ? $user->id : null;

        $patient = Patient::create($validated);

        return response()->json([
            'message' => 'تم إنشاء ملف المريض بنجاح.',
            'patient' => $patient,
        ], 201);
    }

    /**
     * Display the specified patient.
     */
    public function show(string $id): JsonResponse
    {
        $user = Auth::user();
        $query = Patient::where('id', $id);

        if ($user && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $patient = $query->firstOrFail();

        return response()->json([
            'patient' => $patient,
        ]);
    }

    /**
     * Update the specified patient in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();
        $query = Patient::where('id', $id);

        if ($user && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $patient = $query->firstOrFail();

        $validated = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'gender' => 'sometimes|required|in:male,female',
            'birth_date' => 'sometimes|required|date',
            'phone' => 'nullable|string|max:50',
            'phone_operator' => 'nullable|in:mobilis,djezzy,ooredoo,fixe,other',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'wilaya_code' => 'nullable|string|max:10',
            'wilaya_name' => 'nullable|string|max:255',
            'commune_name' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'national_id' => 'nullable|string|max:50',
            'social_security_number' => 'nullable|string|max:50',
            'parent_name' => 'nullable|string|max:255',
            'parent_relation' => 'nullable|string|max:100',
            'parent_phone' => 'nullable|string|max:50',
            'emergency_contact' => 'nullable|string|max:255',
            'blood_group' => 'nullable|string|max:10',
            'allergies' => 'nullable|string',
            'medical_history' => 'nullable|string',
            'notes' => 'nullable|string',
            'diagnosis_primary' => 'nullable|string|max:255',
            'diagnosis_secondary' => 'nullable|string|max:255',
            'is_active' => 'boolean',
            'referral_source' => 'nullable|string|max:255',
            'school_name' => 'nullable|string|max:255',
            'school_grade' => 'nullable|string|max:100',
            'genogram_data' => 'nullable|array',
            'sensory_profile_data' => 'nullable|array',
        ]);

        $patient->update($validated);

        return response()->json([
            'message' => 'تم تحديث بيانات المريض بنجاح.',
            'patient' => $patient,
        ]);
    }

    /**
     * Remove the specified patient from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = Auth::user();
        $query = Patient::where('id', $id);

        if ($user && $user->tenant_id) {
            $query->where('tenant_id', $user->tenant_id);
        }

        $patient = $query->firstOrFail();
        $patient->delete();

        return response()->json([
            'message' => 'تم حذف ملف المريض بنجاح.',
        ]);
    }

    /**
     * Store and attach AI Therapy Studio Record directly to Patient Timeline.
     */
    public function storeAiRecord(string $id, Request $request): JsonResponse
    {
        $user = Auth::user();
        $patient = Patient::findOrFail($id);

        $validated = $request->validate([
            'tool_type' => 'required|string|in:social_story,wisc_report,relaxation_plan,drawing_analysis,bilan_synthesis,pep_plan,soap_note',
            'title' => 'required|string|max:255',
            'summary' => 'nullable|string',
            'payload' => 'required',
            'notes' => 'nullable|string',
            'is_shared_with_portal' => 'nullable|boolean',
        ]);

        $payload = is_array($validated['payload']) ? $validated['payload'] : json_decode($validated['payload'], true);

        $record = PatientAiRecord::create([
            'clinic_id' => $user->tenant_id,
            'tenant_id' => $user->tenant_id,
            'patient_id' => $patient->id,
            'user_id' => $user->id,
            'tool_type' => $validated['tool_type'],
            'title' => $validated['title'],
            'summary' => $validated['summary'] ?? null,
            'payload' => $payload,
            'notes' => $validated['notes'] ?? null,
            'is_shared_with_portal' => (bool) ($validated['is_shared_with_portal'] ?? false),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وإرفاق التقرير في السجل الطبي للمريض بنجاح.',
            'record' => $record,
        ], 201);
    }

    /**
     * Get all AI Therapy Records for a Patient.
     */
    public function getAiRecords(string $id): JsonResponse
    {
        $user = Auth::user();
        $patient = Patient::findOrFail($id);

        $records = PatientAiRecord::where('patient_id', $patient->id)
            ->with('user:id,name')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'patient' => $patient,
            'records' => $records,
            'count' => $records->count(),
        ]);
    }

    /**
     * Delete an AI Therapy Record for a Patient.
     */
    public function deleteAiRecord(string $patientId, string $recordId): JsonResponse
    {
        $user = Auth::user();
        $record = PatientAiRecord::where('patient_id', $patientId)
            ->where('id', $recordId)
            ->firstOrFail();

        $record->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف تقرير الذكاء الاصطناعي من ملف المريض بنجاح.',
        ]);
    }
}
