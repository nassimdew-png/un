<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\PatientRecallLog;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PatientRetentionRadarController extends Controller
{
    /**
     * Get Clinical Retention & Patient Recall Radar Overview.
     */
    public function getRetentionOverview(Request $request): JsonResponse
    {
        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        $thresholdDays = (int) ($tenant?->retention_threshold_days ?? 21);

        $patientsQuery = Patient::query();
        if ($tenant) {
            $patientsQuery->where('tenant_id', $tenant->id);
        }

        $patients = $patientsQuery->with([
            'appointments' => function ($q) {
                $q->orderBy('appointment_date', 'desc');
            },
            'recallLogs' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }
        ])->get();

        $now = Carbon::now();
        $today = Carbon::today();

        $atRiskList = [];
        $totalActive = 0;
        $criticalCount = 0;
        $highCount = 0;
        $mediumCount = 0;
        $recalledThisMonthCount = 0;

        foreach ($patients as $patient) {
            $appointments = $patient->appointments;
            if ($appointments->isEmpty()) {
                continue;
            }

            // Has upcoming appointment scheduled?
            $hasUpcoming = $appointments->first(function ($apt) use ($today) {
                return Carbon::parse($apt->appointment_date)->gte($today)
                    && !in_array($apt->status, ['cancelled', 'completed']);
            });

            // Most recent attended appointment
            $lastAttended = $appointments->first(function ($apt) use ($today) {
                return Carbon::parse($apt->appointment_date)->lt($today)
                    && in_array($apt->status, ['completed', 'arrived', 'in_progress', 'confirmed']);
            });

            if ($hasUpcoming) {
                $totalActive++;
                continue;
            }

            if ($lastAttended) {
                $totalActive++;
                $lastAttendedDate = Carbon::parse($lastAttended->appointment_date);
                $daysAbsent = $lastAttendedDate->diffInDays($now);

                if ($daysAbsent >= 14) {
                    $riskLevel = 'medium';
                    if ($daysAbsent >= 45) {
                        $riskLevel = 'critical';
                        $criticalCount++;
                    } elseif ($daysAbsent >= 30) {
                        $riskLevel = 'high';
                        $highCount++;
                    } else {
                        $mediumCount++;
                    }

                    $recentRecall = $patient->recallLogs->first();
                    $lastRecallDate = $recentRecall ? Carbon::parse($recentRecall->created_at)->format('Y-m-d') : null;

                    // Clean phone for WhatsApp
                    $cleanPhone = preg_replace('/[^0-9]/', '', (string) $patient->phone);
                    if (str_starts_with($cleanPhone, '0')) {
                        $cleanPhone = '213' . substr($cleanPhone, 1);
                    }

                    $age = null;
                    if ($patient->birth_date) {
                        $age = Carbon::parse($patient->birth_date)->age;
                    }

                    $atRiskList[] = [
                        'patient_id' => $patient->id,
                        'full_name' => $patient->first_name . ' ' . $patient->last_name,
                        'guardian_name' => $patient->guardian_name,
                        'phone' => $patient->phone,
                        'clean_phone' => $cleanPhone,
                        'age' => $age,
                        'last_attended_date' => $lastAttendedDate->format('Y-m-d'),
                        'last_attended_formatted' => $lastAttendedDate->translatedFormat('d F Y'),
                        'days_absent' => (int) $daysAbsent,
                        'risk_level' => $riskLevel,
                        'recall_count' => $patient->recallLogs->count(),
                        'last_recall_date' => $lastRecallDate,
                        'last_recall_template' => $recentRecall?->recall_template,
                    ];
                }
            }
        }

        // Count recalls sent in last 30 days
        $thirtyDaysAgo = Carbon::now()->subDays(30);
        $recalledThisMonthCount = PatientRecallLog::when($tenant, fn($q) => $q->where('clinic_id', $tenant->id))
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // Sort at-risk by days absent descending
        usort($atRiskList, fn($a, $b) => $b['days_absent'] <=> $a['days_absent']);

        $atRiskCount = count($atRiskList);
        $retentionRate = $totalActive > 0
            ? round((($totalActive - $atRiskCount) / $totalActive) * 100, 1)
            : 100;

        return response()->json([
            'success' => true,
            'clinic' => [
                'name' => $tenant?->name ?? 'العيادة التخصصية',
                'retention_threshold_days' => $thresholdDays,
            ],
            'kpis' => [
                'retention_rate_pct' => max(0, $retentionRate),
                'total_monitored_patients' => $totalActive,
                'total_at_risk' => $atRiskCount,
                'critical_risk_count' => $criticalCount,
                'high_risk_count' => $highCount,
                'medium_risk_count' => $mediumCount,
                'recalled_this_month' => $recalledThisMonthCount,
            ],
            'at_risk_patients' => $atRiskList,
            'templates' => [
                [
                    'key' => 'gentle_checkin',
                    'title' => 'اطمئنان ودي واستفسار عن الحالة',
                    'description' => 'رسالة لطيفة غير ضاغطة للاطمئنان على المريض وعرض المساعدة.',
                ],
                [
                    'key' => 'progress_review',
                    'title' => 'جلسة تقييم التقدم الدوري',
                    'description' => 'تذكير بأهمية المراجعة السريرية لتثبيت المكتسبات السلوكية والعلاجية.',
                ],
                [
                    'key' => 'treatment_milestone',
                    'title' => 'حماية الخطة العلاجية من الانتكاسة',
                    'description' => 'تنبيه مهني لطيف بأهمية استكمال أهداف الخطة الفردية لمنع أي تراجع.',
                ],
            ],
        ]);
    }

    /**
     * Generate WhatsApp Recall Message and Log Event.
     */
    public function sendRecallWhatsApp(Request $request): JsonResponse
    {
        $request->validate([
            'patient_id' => 'required|integer|exists:patients,id',
            'template_key' => 'required|string|in:gentle_checkin,progress_review,treatment_milestone,custom',
            'custom_message' => 'nullable|string|max:1000',
        ]);

        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        $patient = Patient::with(['appointments' => fn($q) => $q->orderBy('appointment_date', 'desc')])
            ->findOrFail($request->patient_id);

        $clinicName = $tenant?->name ?? 'العيادة التخصصية';
        $patientName = $patient->first_name . ' ' . $patient->last_name;
        $salutation = $patient->guardian_name ? "ولي أمر المريض {$patientName}" : "الأخ/الأخت {$patientName}";

        // Calculate days absent
        $lastAttended = $patient->appointments->first(function ($apt) {
            return in_array($apt->status, ['completed', 'arrived', 'in_progress', 'confirmed']);
        });
        $daysAbsent = $lastAttended ? Carbon::parse($lastAttended->appointment_date)->diffInDays(now()) : 0;

        $templateKey = $request->template_key;
        $message = '';

        if ($templateKey === 'custom' && $request->filled('custom_message')) {
            $message = $request->custom_message;
        } elseif ($templateKey === 'progress_review') {
            $message = "تحية طيبة واحترام من عيادة {$clinicName}.\n" .
                "نود تذكيركم {$salutation} بأهمية جلسة المراجعة الدورية وتقييم التقدم السريري المحرز لـ ({$patientName})، لضمان تثبيت المكتسبات وتحقيق أهداف الخطة العلاجية.\n" .
                "يسعدنا التنسيق معكم لحجز الموعد القادم في الوقت الذي يناسبكم.";
        } elseif ($templateKey === 'treatment_milestone') {
            $message = "السلام عليكم ورحمة الله وبركاته من {$clinicName}.\n" .
                "نحرص دائماً على سلامة ومصلحة ({$patientName})، ونود التنبيه إلى أن انقطاع الجلسات قد يؤثر على استقرار التحسن المحقق.\n" .
                "ندعوكم لاستكمال البرنامج العلاجي ونحن في خدمتكم لتسهيل المواعيد المناسبة لكم.";
        } else { // gentle_checkin
            $message = "السلام عليكم ورحمة الله {$salutation}.\n" .
                "نأمل أن تكونوا في أتم الصحة والعافية. نود الاطمئنان عليكم من طرف عيادة {$clinicName} ومتابعة أحوال ({$patientName}).\n" .
                "يسعدنا دائماً استقبالكم ومساعدتكم في أي استفسار أو ترتيب جلسة متابعة جديدة.";
        }

        // Clean phone for WhatsApp
        $rawPhone = $patient->phone;
        $cleanPhone = preg_replace('/[^0-9]/', '', (string) $rawPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        }

        $whatsappUrl = "https://api.whatsapp.com/send?phone={$cleanPhone}&text=" . urlencode($message);

        // Record recall log
        $log = PatientRecallLog::create([
            'clinic_id' => $tenant?->id ?? 'default',
            'patient_id' => $patient->id,
            'last_attended_date' => $lastAttended?->appointment_date ? Carbon::parse($lastAttended->appointment_date)->toDateString() : null,
            'days_absent' => (int) $daysAbsent,
            'recall_template' => $templateKey,
            'recalled_at' => now(),
            'status' => 'sent',
            'notes' => mb_substr($message, 0, 200) . '...',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء رابط رسالة التذكير بنجاح وتسجيل عملية الاستعادة.',
            'whatsapp_url' => $whatsappUrl,
            'message_text' => $message,
            'phone' => $cleanPhone,
            'log' => $log,
        ]);
    }

    /**
     * Update Retention Radar Settings.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $tenantId = $request->user()?->tenant_id ?? $request->header('X-Tenant-Id');
        $tenant = Tenant::find($tenantId) ?? Tenant::first();

        if (!$tenant) {
            return response()->json(['success' => false, 'message' => 'العيادة غير موجودة'], 404);
        }

        $validated = $request->validate([
            'retention_threshold_days' => 'required|integer|min:7|max:90',
        ]);

        $tenant->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث فترة رادار الاستعادة بنجاح.',
            'retention_threshold_days' => $tenant->retention_threshold_days,
        ]);
    }
}
