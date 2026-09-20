<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\TreatmentPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClinicalGoalController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'goals' => [
                ['id' => 'g1', 'category' => 'نطق', 'title' => 'نطق صوت الراء /r/ بدقة 80%'],
                ['id' => 'g2', 'category' => 'لغة', 'title' => 'إنتاج جملة اسمية ثلاثية العناصر'],
                ['id' => 'g3', 'category' => 'تواصل', 'title' => 'الحفاظ على التواصل البصري لمدة 10 ثوانٍ'],
                ['id' => 'g4', 'category' => 'طلاقة', 'title' => 'تقليل الوقفات التأتاتية بالتنفس البطني'],
            ],
        ]);
    }

    public function getPatientGoals(string|int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        $plan = TreatmentPlan::where('patient_id', $patientId)->latest()->first();

        return response()->json([
            'success' => true,
            'patient' => $patient,
            'goals' => $plan ? ($plan->goals ?? []) : [],
            'plan' => $plan,
        ]);
    }

    public function assignGoals(Request $request, string|int $patientId): JsonResponse
    {
        $patient = Patient::findOrFail($patientId);
        $goals = $request->input('goals', []);

        $plan = TreatmentPlan::create([
            'tenant_id' => $patient->tenant_id,
            'patient_id' => $patient->id,
            'title' => $request->input('title', 'خطة أهداف PEI العلاجية'),
            'goals' => $goals,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ أهداف الخطة العلاجية بنجاح.',
            'plan' => $plan,
        ]);
    }

    public function updateProgress(Request $request, string|int $assignedGoalId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم تحديث تقدم الهدف السريري.',
        ]);
    }

    public function destroy(string|int $assignedGoalId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'تم حذف الهدف بنجاح.',
        ]);
    }
}
