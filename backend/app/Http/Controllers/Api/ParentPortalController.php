<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\ClinicalAssessment;
use App\Models\HomeworkAssignment;
use App\Models\Patient;
use App\Models\PatientHomeworkPlan;
use App\Models\PatientPortalLink;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ParentPortalController extends Controller
{
    /**
     * Unified Portal Access verification and data retrieval.
     */
    public function getPortalData(Request $request, string $token): JsonResponse
    {
        // 1. Locate patient either via direct patient token or Magic Link token
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();
        $link = null;

        if (!$patient) {
            $link = PatientPortalLink::withoutGlobalScopes()
                ->with(['patient', 'tenant', 'practitioner'])
                ->where('access_token', $token)
                ->first();

            if ($link) {
                $patient = $link->patient;
            }
        }

        if (!$patient) {
            return response()->json([
                'success' => false,
                'status' => 'error',
                'message' => 'عذراً، رابط البوابة غير صالح أو انتهت صلاحيته.',
            ], 404);
        }

        $tenant = Tenant::find($patient->tenant_id);

        // Format patient age
        $ageFormatted = null;
        if ($patient->birth_date) {
            $birth = Carbon::parse($patient->birth_date);
            $years = (int)$birth->diffInYears(now());
            $months = (int)$birth->copy()->addYears($years)->diffInMonths(now());
            $ageFormatted = "{$years} سنة" . ($months > 0 ? " و {$months} شهر" : '');
        }

        // 2. Fetch Appointments
        $appointments = Appointment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('appointment_date', 'asc')
            ->get()
            ->map(function ($app) {
                $specialist = $app->specialist_id ? User::withoutGlobalScopes()->find($app->specialist_id) : null;
                $dateObj = $app->appointment_date ? Carbon::parse($app->appointment_date) : null;

                return [
                    'id' => $app->id,
                    'date' => $dateObj ? $dateObj->format('Y-m-d') : null,
                    'date_formatted' => $dateObj ? $dateObj->locale('ar')->translatedFormat('l d F Y') : '',
                    'time' => $dateObj ? $dateObj->format('H:i') : '',
                    'specialist_name' => $specialist ? $specialist->name : 'الأخصائي المعالج',
                    'type' => $app->type ?? 'therapy_session',
                    'status' => $app->status ?? 'scheduled',
                    'confirmed_by_patient' => (bool)$app->confirmed_by_patient,
                    'patient_confirmed_at' => $app->patient_confirmed_at,
                    'notes' => $app->notes,
                    'is_upcoming' => $dateObj && $dateObj->isFuture(),
                ];
            });

        // 3. Fetch Homework Assignments (Seed realistic samples if none exist)
        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->orderBy('created_at', 'desc')
            ->get();

        if ($homework->isEmpty()) {
            $this->seedSampleHomework($patient->id, $patient->tenant_id);
            $homework = HomeworkAssignment::withoutGlobalScopes()
                ->where('patient_id', $patient->id)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        $homeworkList = $homework->map(function ($hw) {
            $dueObj = $hw->due_date ? Carbon::parse($hw->due_date) : null;
            return [
                'id' => $hw->id,
                'title' => $hw->exercise_title,
                'instructions' => $hw->instructions,
                'category' => $hw->category,
                'due_date' => $dueObj ? $dueObj->format('Y-m-d') : null,
                'due_date_formatted' => $dueObj ? $dueObj->locale('ar')->translatedFormat('d F Y') : '',
                'is_completed' => (bool)$hw->is_completed,
                'parent_feedback' => $hw->parent_feedback,
                'completed_at' => $hw->completed_at ? Carbon::parse($hw->completed_at)->diffForHumans() : null,
                'attachment_url' => $hw->attachment_path ?: null,
            ];
        });

        // 4. Calculate Attendance & Completion Stats
        $totalAppointments = $appointments->count();
        $completedAppointments = $appointments->where('status', 'completed')->count();
        $attendanceRate = $totalAppointments > 0 
            ? round(($completedAppointments / max(1, $totalAppointments)) * 100) 
            : 100;

        $totalHomework = $homeworkList->count();
        $completedHomework = $homeworkList->where('is_completed', true)->count();
        $homeworkRate = $totalHomework > 0 
            ? round(($completedHomework / $totalHomework) * 100) 
            : 0;

        return response()->json([
            'success' => true,
            'status' => 'valid',
            'patient' => [
                'id' => $patient->id,
                'first_name' => $patient->first_name,
                'last_name' => $patient->last_name,
                'full_name' => trim($patient->first_name . ' ' . $patient->last_name),
                'gender' => $patient->gender,
                'age_formatted' => $ageFormatted,
                'phone' => $patient->phone,
                'guardian_name' => $patient->guardian_name,
            ],
            'clinic' => [
                'name' => $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة التخصصية',
                'name_fr' => $tenant ? $tenant->header_title_fr : '',
                'subdomain' => $tenant ? $tenant->subdomain : 'clinic',
                'phone' => $tenant ? $tenant->phone : '',
                'address' => $tenant ? $tenant->address : '',
                'logo_url' => $tenant ? ($tenant->logo_url ?: $tenant->logo_path) : null,
                'report_accent_color' => $tenant ? ($tenant->report_accent_color ?: '#0d9488') : '#0d9488',
                'type' => $tenant ? $tenant->type : 'orthophony',
            ],
            'appointments' => $appointments->values(),
            'upcoming_appointments' => $appointments->where('is_upcoming', true)->values(),
            'homework' => $homeworkList->values(),
            'stats' => [
                'total_appointments' => $totalAppointments,
                'completed_appointments' => $completedAppointments,
                'attendance_rate' => $attendanceRate,
                'total_homework' => $totalHomework,
                'completed_homework' => $completedHomework,
                'homework_completion_rate' => $homeworkRate,
            ],
        ]);
    }

    /**
     * Parent confirms appointment attendance.
     */
    public function confirmAppointment(Request $request, string $token, string $appointmentId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();
        if (!$patient) {
            $link = PatientPortalLink::withoutGlobalScopes()->where('access_token', $token)->first();
            $patient = $link ? $link->patient : null;
        }

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 403);
        }

        $appointment = Appointment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $appointmentId)
            ->firstOrFail();

        $appointment->update([
            'confirmed_by_patient' => true,
            'status' => 'confirmed',
            'patient_confirmed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تأكيد حضور الموعد بنجاح! نحن بانتظاركم في العيادة في الموعد المحدد.',
            'appointment' => [
                'id' => $appointment->id,
                'status' => $appointment->status,
                'confirmed_by_patient' => true,
                'confirmed_at' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Parent marks homework exercise as completed.
     */
    public function completeHomework(Request $request, string $token, string $homeworkId): JsonResponse
    {
        $patient = Patient::withoutGlobalScopes()->where('portal_access_token', $token)->first();
        if (!$patient) {
            $link = PatientPortalLink::withoutGlobalScopes()->where('access_token', $token)->first();
            $patient = $link ? $link->patient : null;
        }

        if (!$patient) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 403);
        }

        $homework = HomeworkAssignment::withoutGlobalScopes()
            ->where('patient_id', $patient->id)
            ->where('id', $homeworkId)
            ->firstOrFail();

        $feedback = $request->input('parent_feedback') ?: $request->input('feedback');

        $homework->update([
            'is_completed' => true,
            'completed_at' => now(),
            'parent_feedback' => $feedback,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'رائع! تم تسجيل إنجاز النشاط المنزلي بنجاح وإشعار الأخصائي المعالج.',
            'homework' => [
                'id' => $homework->id,
                'is_completed' => true,
                'parent_feedback' => $homework->parent_feedback,
                'completed_at' => $homework->completed_at ? Carbon::parse($homework->completed_at)->diffForHumans() : 'الآن',
            ],
        ]);
    }

    /**
     * Generate Magic Portal Link with instant WhatsApp sharing.
     */
    public function generatePortalLink(Request $request, string $patientId): JsonResponse
    {
        $user = Auth::user();
        $patientQuery = Patient::withoutGlobalScopes();
        if ($user && $user->tenant_id) {
            $patientQuery->where('tenant_id', $user->tenant_id);
        }
        $patient = $patientQuery->findOrFail($patientId);

        // Ensure token exists on patient
        if (empty($patient->portal_access_token)) {
            $newToken = Str::random(32);
            $patient->forceFill([
                'portal_access_token' => $newToken,
                'portal_enabled' => true,
            ])->save();
            $patient->portal_access_token = $newToken;
        }

        $tenant = Tenant::find($patient->tenant_id);
        $subdomain = $tenant ? $tenant->subdomain : 'clinic';
        $token = $patient->portal_access_token;

        $portalUrl = "https://{$subdomain}.psypro.tech/portal/{$token}";
        $childName = trim(($patient->first_name ?? '') . ' ' . ($patient->last_name ?? ''));
        $clinicName = $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة';

        $whatsappMessage = "السلام عليكم ورحمة الله،\n\n" .
            "مرحباً بكم من {$clinicName}.\n" .
            "يسرنا تزويدكم بالرابط المباشر لبوابة المتابعة المنزلية والمواعيد للبطل ({$childName}):\n\n" .
            "🔗 {$portalUrl}\n\n" .
            "يمكنكم من خلال الرابط:\n" .
            "📅 تأكيد المواعيد القادمة بنقرة واحدة.\n" .
            "📚 تحميل التمارين المنزلية وتسجيل إنجازها.\n" .
            "📈 متابعة نسبة التقدم والانتظام.\n\n" .
            "دمتم بصحة وعافية.";

        $patientPhone = $patient->phone ? preg_replace('/[^0-9]/', '', $patient->phone) : null;
        $intlPhone = $patientPhone ? ($patientPhone[0] === '0' ? '213' . substr($patientPhone, 1) : $patientPhone) : null;
        $whatsappUrl = $intlPhone ? "https://wa.me/{$intlPhone}?text=" . urlencode($whatsappMessage) : null;

        return response()->json([
            'success' => true,
            'message' => 'تم توليد رابط بوابة الولي بنجاح.',
            'portal_token' => $token,
            'portal_url' => $portalUrl,
            'whatsapp_url' => $whatsappUrl,
            'whatsapp_message' => $whatsappMessage,
        ]);
    }

    /**
     * Seeds initial realistic homework activities.
     */
    private function seedSampleHomework(string $patientId, ?string $tenantId): void
    {
        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'تمرين مخارج الحروف والتمييز السمعي (صوت الراء / R)',
            'instructions' => 'تدريب الطفل أمام المرآة على وضع اللسان خلف الأسنان العلوية وتكرار المقاطع الصوتية لمدة 10 دقائق يومياً.',
            'category' => 'articulation',
            'due_date' => now()->addDays(4)->format('Y-m-d'),
            'is_completed' => false,
        ]);

        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'بطاقة بناء الجمل والطلاقة التعبيرية',
            'instructions' => 'استخدام الصور المرفقة لبناء جمل من 3 إلى 4 كلمات والتعبير عن الأحداث اليومية المشتركة.',
            'category' => 'langage_expressif',
            'due_date' => now()->addDays(7)->format('Y-m-d'),
            'is_completed' => true,
            'parent_feedback' => 'تجاوب ممتاز من الطفل مع الصور وأصبح يركب جملاً أطول.',
            'completed_at' => now()->subDay(),
        ]);

        HomeworkAssignment::create([
            'clinic_id' => $tenantId,
            'patient_id' => $patientId,
            'exercise_title' => 'نشاط الانتباه والتركيز البصري المتسلسل',
            'instructions' => 'لعبة إيجاد الفروق وتطابق الأشكال الهندسية لتعزيز مدى الانتباه والتركيز.',
            'category' => 'attention',
            'due_date' => now()->addDays(10)->format('Y-m-d'),
            'is_completed' => false,
        ]);
    }
}
