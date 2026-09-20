<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\ClinicalAssessment;
use App\Models\ClinicalTestAssignment;
use App\Models\CommunicationGateway;
use App\Models\Patient;
use App\Models\SessionSoapNote;
use App\Models\Tenant;
use App\Services\WhatsAppCloudApiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClinicalTestAssignmentController extends Controller
{
    /**
     * Create a new test assignment (Generate temporary link & QR code).
     */
    public function store(Request $request, $patientId = null): JsonResponse
    {
        $rawPatientId = $request->input('patient_id') ?: $patientId;

        // Auto-resolve or seed demo patient if demo ID passed or patient does not exist in DB
        if ($rawPatientId === 'demo-patient-001' || $rawPatientId === 'demo-patient-002' || $rawPatientId === 'demo' || ($rawPatientId && !Patient::where('id', $rawPatientId)->exists())) {
            $user = Auth::user();
            $tenantId = $user ? $user->tenant_id : null;
            if (!$tenantId) {
                $tenant = Tenant::where('status', 'active')->first() ?: Tenant::first();
                $tenantId = $tenant ? $tenant->id : null;
            }
            $demoPatient = Patient::firstOrCreate(
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
            $request->merge(['patient_id' => $demoPatient->id]);
            $patientId = $demoPatient->id;
        } elseif ($patientId && !$request->has('patient_id')) {
            $request->merge(['patient_id' => $patientId]);
        }

        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'test_code' => 'required|string|max:50',
            'test_title' => 'required|string|max:255',
            'appointment_id' => 'nullable|exists:appointments,id',
            'mode' => 'nullable|string|in:specialist_live,clinic_tablet,remote_link,remote,tablet',
            'pin_code' => 'nullable|string|max:10',
            'duration_hours' => 'nullable|integer|min:1|max:720',
            'expires_in_hours' => 'nullable|integer|min:1|max:720',
        ]);

        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;
        if (!$tenantId) {
            $patient = Patient::findOrFail($validated['patient_id']);
            $tenantId = $patient->tenant_id;
        }

        $durationHours = (int) ($validated['expires_in_hours'] ?? $validated['duration_hours'] ?? 72);
        $token = Str::random(48);

        $rawMode = $validated['mode'] ?? 'remote_link';
        $normalizedMode = in_array($rawMode, ['tablet', 'clinic_tablet']) ? 'clinic_tablet' : 'remote_link';

        $assignment = ClinicalTestAssignment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $validated['patient_id'],
            'appointment_id' => $validated['appointment_id'] ?? null,
            'specialist_id' => Auth::id(),
            'test_code' => strtoupper(trim($validated['test_code'])),
            'test_title' => $validated['test_title'],
            'access_token' => $token,
            'pin_code' => $validated['pin_code'] ?? null,
            'mode' => $normalizedMode,
            'status' => 'pending',
            'expires_at' => Carbon::now()->addHours($durationHours),
        ]);

        $patient = Patient::find($validated['patient_id']);
        $tenant = Tenant::find($tenantId);

        // Build Portal Link using HTTPS domain or configured frontend URL
        $frontendUrl = env('FRONTEND_URL') ?: (app()->environment('production') ? 'https://psypro.tech' : (request()->header('origin') ?: config('app.url', 'https://psypro.tech')));
        $frontendUrl = rtrim($frontendUrl, '/');
        $portalUrl = "{$frontendUrl}/portal/test/{$token}";

        // Formatted WhatsApp message in Arabic
        $patientName = $patient ? $patient->first_name : 'المريض';
        $clinicName = $tenant ? $tenant->name : 'العيادة';
        $whatsappText = "مرحباً {$patientName}،\nيرجى التكرم بملء هذا التقييم السريري المطلوب من طرف عيادة {$clinicName}:\n\n📋 *{$assignment->test_title}*\n\nالرابط المباشر الآمن:\n{$portalUrl}\n\n(هذا الرابط صالح لمدة {$durationHours} ساعة).";
        $whatsappUrl = 'https://wa.me/' . preg_replace('/[^0-9]/', '', $patient->phone ?? '') . '?text=' . urlencode($whatsappText);

        $loadedAssignment = $assignment->load(['patient', 'appointment']);
        $loadedAssignment->portal_url = $portalUrl;
        $loadedAssignment->whatsapp_link = $whatsappUrl;
        $loadedAssignment->whatsapp_url = $whatsappUrl;

        return response()->json([
            'success' => true,
            'message' => 'تم إنشاء رابط التقييم بنجاح.',
            'assignment' => $loadedAssignment,
            'portal_url' => $portalUrl,
            'whatsapp_link' => $whatsappUrl,
            'whatsapp_url' => $whatsappUrl,
        ], 201);
    }

    /**
     * List all test assignments for a specific patient.
     */
    public function getPatientAssignments(string|int $patientId): JsonResponse
    {
        if ($patientId === 'demo-patient-001' || $patientId === 'demo-patient-002' || $patientId === 'demo' || !Patient::where('id', $patientId)->exists()) {
            return response()->json([
                'success' => true,
                'data' => [],
                'assignments' => [],
            ]);
        }

        $assignments = ClinicalTestAssignment::where('patient_id', $patientId)
            ->with(['specialist:id,name,role', 'appointment:id,appointment_date,status,type', 'clinicalAssessment:id,title,assessment_date,diagnostic_conclusion'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $assignments,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Delete / Revoke a test assignment.
     */
    public function destroy(string|int $id): JsonResponse
    {
        $assignment = ClinicalTestAssignment::findOrFail($id);
        $assignment->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء رابط التقييم.',
        ]);
    }

    /**
     * Public Route: Retrieve test information for the patient using token (No Auth needed).
     */
    public function getPublicTest(Request $request, string $token): JsonResponse
    {
        $assignment = ClinicalTestAssignment::withoutGlobalScopes()
            ->with(['patient', 'tenant', 'specialist:id,name,role'])
            ->where('access_token', $token)
            ->first();

        if (!$assignment) {
            return response()->json([
                'success' => false,
                'message' => 'عذراً، رابط التقييم غير صالح أو تم حذفه.',
            ], 404);
        }

        if ($assignment->isExpired()) {
            return response()->json([
                'success' => false,
                'status' => 'expired',
                'message' => 'عذراً، انتهت صلاحية هذا الرابط (صالح لمدة محددة). يرجى التواصل مع العيادة لتجديده.',
            ], 410);
        }

        if ($assignment->isCompleted()) {
            return response()->json([
                'success' => true,
                'status' => 'already_completed',
                'message' => 'تم إكمال هذا التقييم مسبقاً بنجاح وحفظه في ملفك الطبي.',
                'completed_at' => $assignment->completed_at,
                'severity_label' => $assignment->severity_label,
            ]);
        }

        // If a PIN is required, verify it
        if ($assignment->pin_code) {
            $providedPin = $request->header('X-Test-Pin') ?: $request->query('pin');
            if ($providedPin && $providedPin !== $assignment->pin_code) {
                return response()->json([
                    'success' => false,
                    'status' => 'pin_required',
                    'message' => 'رمز الأمان (PIN) غير صحيح.',
                ], 403);
            }
            if (!$providedPin) {
                return response()->json([
                    'success' => false,
                    'status' => 'pin_required',
                    'message' => 'يتطلب هذا التقييم إدخال رمز الأمان (PIN) المكون من 4 أرقام.',
                ], 401);
            }
        }

        $patient = $assignment->patient;
        $tenant = $assignment->tenant;

        $globalConfig = \App\Models\GlobalTestConfiguration::where('test_code', $assignment->test_code)->first();
        $normsPayload = $globalConfig ? $globalConfig->norms_payload : null;

        return response()->json([
            'success' => true,
            'assignment' => [
                'id' => $assignment->id,
                'test_code' => $assignment->test_code,
                'test_title' => $assignment->test_title,
                'mode' => $assignment->mode,
                'expires_at' => $assignment->expires_at,
                'saved_draft' => $assignment->answers_payload,
                'norms_payload' => $normsPayload,
            ],
            'patient' => [
                'first_name' => $patient ? $patient->first_name : 'المفحوص',
                'last_name' => $patient ? $patient->last_name : '',
                'birth_date' => $patient ? $patient->birth_date : null,
            ],
            'clinic' => [
                'name' => $tenant ? $tenant->name : 'العيادة التخصصية',
                'phone' => $tenant ? $tenant->phone : '',
                'address' => $tenant ? $tenant->address : '',
            ],
        ]);
    }

    /**
     * Public Route: Submit test answers, compute score, create ClinicalAssessment, and link to SOAP note.
     */
    public function submitPublicTest(Request $request, string $token): JsonResponse
    {
        $assignment = ClinicalTestAssignment::withoutGlobalScopes()
            ->with(['patient', 'tenant'])
            ->where('access_token', $token)
            ->first();

        if (!$assignment) {
            return response()->json(['success' => false, 'message' => 'رابط غير صالح.'], 404);
        }

        if ($assignment->isExpired()) {
            return response()->json(['success' => false, 'message' => 'انتهت صلاحية الرابط.'], 410);
        }

        if ($assignment->isCompleted()) {
            return response()->json(['success' => false, 'message' => 'تم إرسال هذا التقييم مسبقاً.'], 400);
        }

        $validated = $request->validate([
            'answers_payload' => 'required|array',
            'raw_score' => 'required|numeric',
            'severity_label' => 'required|string|max:255',
            'diagnostic_notes' => 'nullable|string',
            'radar_data' => 'nullable|array',
        ]);

        $testCode = strtoupper(trim($assignment->test_code));
        $answers = $validated['answers_payload'] ?? [];
        
        // Check for Red Alert / Critical Safety Flag (PHQ-9 or BDI-II item 9, or HAM-D item 3)
        $hasCriticalAlert = false;
        $alertItemScore = null;
        if (str_contains($testCode, 'PHQ') && isset($answers['9'])) {
            $alertItemScore = (int) $answers['9'];
            if ($alertItemScore > 0) {
                $hasCriticalAlert = true;
            }
        } elseif (str_contains($testCode, 'BDI') && isset($answers['9'])) {
            $alertItemScore = (int) $answers['9'];
            if ($alertItemScore > 0) {
                $hasCriticalAlert = true;
            }
        } elseif ((str_contains($testCode, 'HAM-D') || str_contains($testCode, 'HAMD')) && isset($answers['3'])) {
            $alertItemScore = (int) $answers['3'];
            if ($alertItemScore > 0) {
                $hasCriticalAlert = true;
            }
        } elseif (!empty($answers['critical_alert']) || !empty($answers['has_critical_alert'])) {
            $hasCriticalAlert = true;
        } else {
            // Dynamic check from GlobalTestConfiguration
            $globalConfig = \App\Models\GlobalTestConfiguration::where('test_code', $testCode)->first();
            if ($globalConfig && !empty($globalConfig->norms_payload['critical_items'])) {
                foreach ($globalConfig->norms_payload['critical_items'] as $critId) {
                    if (isset($answers[(string) $critId]) && ((int) $answers[(string) $critId]) > 0) {
                        $hasCriticalAlert = true;
                        $alertItemScore = (int) $answers[(string) $critId];
                        break;
                    }
                }
            }
        }

        $diagNotes = $validated['diagnostic_notes'] ?? '';
        if ($hasCriticalAlert) {
            $itemNum = $alertItemScore ? "المسجل" : ((str_contains($testCode, 'HAM-D') || str_contains($testCode, 'HAMD')) ? 3 : 9);
            $redAlertPrefix = "🚨 [تنبيه أمان سريري عاجل - RED ALERT]: تم رصد درجة إيجابية ({$alertItemScore}) في بنود الأمان الحرجة (أفكار تفضيل الموت أو الرغبة في إيذاء النفس). يتطلب ذلك تدخلاً عيادياً فورياً وتطبيق بروتوكول الأمان وتأمين المفحوص.\n\n";
            $diagNotes = $redAlertPrefix . $diagNotes;
        }

        $completedAt = Carbon::now();

        // 1. Update Assignment
        $updateData = [
            'status' => 'completed',
            'completed_at' => $completedAt,
            'answers_payload' => $validated['answers_payload'],
            'raw_score' => $validated['raw_score'],
            'severity_label' => $validated['severity_label'],
            'diagnostic_notes' => $diagNotes,
        ];
        
        // If column exists or handled by model
        if (\Illuminate\Support\Facades\Schema::hasColumn('clinical_test_assignments', 'has_critical_alert')) {
            $updateData['has_critical_alert'] = $hasCriticalAlert;
        }
        $assignment->update($updateData);

        // 2. Create Clinical Assessment in EHR
        $isOrtho = in_array($testCode, ['SSI-4', 'ELO', 'TELD-3', 'GRBASI', 'APRAXIA-DZ', 'FOIS-GUSS', 'TEST-ARTIC-DZ']);
        $assessmentType = $isOrtho ? 'orthophony_bilan' : 'psychometric_eval';

        $assessment = ClinicalAssessment::create([
            'tenant_id' => $assignment->tenant_id,
            'patient_id' => $assignment->patient_id,
            'specialist_id' => $assignment->specialist_id ?: ($assignment->patient->specialist_id ?? 1),
            'type' => $assessmentType,
            'title' => ($hasCriticalAlert ? "🚨 [تنبيه أمان] " : "") . "[{$testCode}] {$assignment->test_title} (" . ($assignment->mode === 'clinic_tablet' ? 'تابلت العيادة' : 'عن بُعد') . ")",
            'assessment_date' => $completedAt->toDateString(),
            'results_data' => [
                'test_code' => $testCode,
                'test_title' => $assignment->test_title,
                'raw_score' => $validated['raw_score'],
                'severity_label' => $validated['severity_label'],
                'has_critical_alert' => $hasCriticalAlert,
                'mode' => $assignment->mode,
                'assignment_id' => $assignment->id,
                'appointment_id' => $assignment->appointment_id,
                'completed_at' => $completedAt->toIso8601String(),
                'answers' => $validated['answers_payload'],
                'radar' => $validated['radar_data'] ?? null,
            ],
            'diagnostic_conclusion' => ($hasCriticalAlert ? "🚨 تنبيه أمان: أفكار إيذاء نفس | " : "") . $validated['severity_label'],
            'recommendations' => $diagNotes ?: "تم إكمال التقييم من طرف المفحوص وحساب النتيجة المعيارية ({$validated['raw_score']}) بنجاح.",
        ]);

        // Link assessment back to assignment
        $assignment->update(['clinical_assessment_id' => $assessment->id]);

        // 3. Link to Clinical Session SOAP Note (if appointment_id is present)
        if ($assignment->appointment_id) {
            $soapNote = SessionSoapNote::where('appointment_id', $assignment->appointment_id)->first();
            if ($soapNote) {
                $alertText = $hasCriticalAlert ? " ⚠️ [تنبيه أحمر: أفكار إيذاء نفس مسجلة في البند 9]" : "";
                $entry = "\n• [تقييم معياري: {$assignment->test_title}]{$alertText} النتيجة: {$validated['raw_score']} ({$validated['severity_label']}) - التاريخ: {$completedAt->format('Y-m-d H:i')}";
                $soapNote->objective = trim(($soapNote->objective ?? '') . $entry);
                $soapNote->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ التقييم بنجاح في السجل الطبي للأخصائي.',
            'assessment_id' => $assessment->id,
            'raw_score' => $validated['raw_score'],
            'severity_label' => $validated['severity_label'],
            'has_critical_alert' => $hasCriticalAlert,
        ]);
    }

    /**
     * Send test assignment link directly to patient's WhatsApp via WhatsApp Cloud API.
     */
    public function sendViaWhatsApp(Request $request, string|int $id): JsonResponse
    {
        $assignment = ClinicalTestAssignment::with(['patient', 'tenant'])->findOrFail($id);
        $patient = $assignment->patient;

        $targetPhone = $request->input('phone') ?: ($patient ? $patient->phone : null);
        if (empty($targetPhone)) {
            return response()->json([
                'success' => false,
                'message' => 'يرجى إدخال رقم هاتف صالح للإرسال عبر واتساب.',
            ], 422);
        }

        $rawPhone = preg_replace('/[^0-9]/', '', (string)$targetPhone);
        if (str_starts_with($rawPhone, '0')) {
            $rawPhone = '213' . substr($rawPhone, 1);
        }

        $tenant = $assignment->tenant ?: Tenant::find($assignment->tenant_id) ?: Tenant::first();
        $clinicName = $tenant ? $tenant->name : 'عيادة الطب النفسي والتأهيل';
        $patientName = $patient->first_name ?? 'المريض';

        $frontendUrl = env('FRONTEND_URL') ?: (app()->environment('production') ? 'https://psypro.tech' : (request()->header('origin') ?: config('app.url', 'https://psypro.tech')));
        $frontendUrl = rtrim($frontendUrl, '/');
        $portalUrl = "{$frontendUrl}/portal/test/{$assignment->access_token}";

        $pinPart = $assignment->pin_code ? "\n🔐 رمز الأمان (PIN): *{$assignment->pin_code}*" : '';
        $message = "مرحباً بك {$patientName} من {$clinicName} 🩺✨\n\n"
                 . "يرجى التكرم بملء المقياس السريري المطلوب لمتابعة خطتك العلاجية:\n"
                 . "📋 *{$assignment->test_title}*\n\n"
                 . "🔗 رابط المقياس المباشر:\n"
                 . "{$portalUrl}{$pinPart}\n\n"
                 . "⏱️ الرابط آمن وخاص بك وصالح للملء.\n"
                 . "عند إكمالك للأسئلة، ستصل النتائج تلقائياً إلى ملفك السريري لدى الأخصائي المعالج.";

        $gw = CommunicationGateway::first();

        if (!$gw || !$gw->is_whatsapp_active || empty($gw->whatsapp_phone_number_id)) {
            return response()->json([
                'success' => false,
                'message' => 'بوابة واتساب السحابية غير مفعلة، يمكنك استخدام رابط واتساب العادي.',
                'whatsapp_url' => 'https://wa.me/' . $rawPhone . '?text=' . urlencode($message),
            ], 400);
        }

        $res = WhatsAppCloudApiService::sendTextMessage($rawPhone, $message, $gw);

        if (!empty($res['success'])) {
            return response()->json([
                'success' => true,
                'message' => 'تم إرسال رابط المقياس بنجاح إلى واتساب المريض! 🚀',
                'message_id' => $res['message_id'] ?? null,
                'phone' => $rawPhone,
                'whatsapp_url' => 'https://wa.me/' . $rawPhone . '?text=' . urlencode($message),
            ]);
        }

        // Automatic Fallback: If 24-hour window is closed (Error 131047), send approved Meta Template!
        $errorDetails = json_encode($res['error'] ?? '');
        if (str_contains($errorDetails, '131047') || str_contains($errorDetails, 'Re-engagement message')) {
            $templateRes = WhatsAppCloudApiService::sendTemplateMessage(
                $rawPhone,
                'clinical_scale_invitation',
                'ar',
                [
                    $patientName,
                    $clinicName,
                    $assignment->test_title,
                    $portalUrl,
                ],
                $gw
            );

            if (!empty($templateRes['success'])) {
                return response()->json([
                    'success' => true,
                    'is_template' => true,
                    'message' => 'تم إرسال رابط المقياس عبر القالب الرسمي المعتمد من Meta (خارج نافذة 24 ساعة) بنجاح! 🚀',
                    'message_id' => $templateRes['message_id'] ?? null,
                    'phone' => $rawPhone,
                    'whatsapp_url' => 'https://wa.me/' . $rawPhone . '?text=' . urlencode($message),
                ]);
            }
        }

        return response()->json([
            'success' => false,
            'message' => 'تعذر الإرسال التلقائي عبر واتساب: ' . ($res['error'] ?? 'خطأ في الاتصال'),
            'whatsapp_url' => 'https://wa.me/' . $rawPhone . '?text=' . urlencode($message),
        ], 500);
    }
}
