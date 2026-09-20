<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Invoice;
use App\Models\TherapySession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    /**
     * List appointments (tenant-scoped with date/specialist filters).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Appointment::with(['patient', 'specialist', 'invoice']);

        if ($date = $request->query('date')) {
            $query->whereDate('appointment_date', $date);
        }

        if ($startDate = $request->query('start_date')) {
            $query->whereDate('appointment_date', '>=', $startDate);
        }

        if ($endDate = $request->query('end_date')) {
            $query->whereDate('appointment_date', '<=', $endDate);
        }

        if ($specialistId = $request->query('specialist_id')) {
            $query->where('specialist_id', $specialistId);
        }

        if ($patientId = $request->query('patient_id')) {
            $query->where('patient_id', $patientId);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($request->boolean('today_only')) {
            $query->whereDate('appointment_date', now()->toDateString());
        }

        $perPage = (int) $request->query('per_page', 50);
        if ($perPage <= 0 || $request->boolean('all')) {
            $appointments = $query->orderBy('appointment_date', 'asc')->get();
            $result = [
                'data' => $appointments,
                'appointments' => $appointments,
                'total' => $appointments->count(),
            ];
        } else {
            $paginated = $query->orderBy('appointment_date', 'asc')->paginate($perPage);
            $result = $paginated->toArray();
            $result['appointments'] = $paginated->items();
        }

        // Compute Live Clinical Queue & Waiting Room stats for today / requested date
        $targetDate = $request->query('date') ?: now()->toDateString();
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;
        $todayQuery = Appointment::query();
        if ($tenantId) {
            $todayQuery->where('tenant_id', $tenantId);
        }
        $todayQuery->whereDate('appointment_date', $targetDate);

        $stats = [
            'today_total' => (clone $todayQuery)->count(),
            'waiting_room' => (clone $todayQuery)->where('status', 'confirmed')->count(),
            'in_progress' => (clone $todayQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $todayQuery)->where('status', 'completed')->count(),
            'scheduled' => (clone $todayQuery)->where('status', 'scheduled')->count(),
            'cancelled' => (clone $todayQuery)->whereIn('status', ['cancelled', 'no_show'])->count(),
        ];

        $result['stats'] = $stats;

        return response()->json($result);
    }

    /**
     * Store a new appointment (supports recurrence and conflict detection).
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'specialist_id' => 'nullable|exists:users,id',
            'appointment_date' => 'required|date',
            'start_time' => 'nullable|string',
            'end_time' => 'nullable|string',
            'type' => 'nullable|string',
            'status' => 'nullable|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes' => 'nullable|string',
            'recurrence_weeks' => 'nullable|integer|min:1|max:20',
        ]);

        $validated['specialist_id'] = $validated['specialist_id'] ?? ($user ? $user->id : null);
        if (empty($validated['specialist_id'])) {
            $defaultUser = \App\Models\User::first();
            $validated['specialist_id'] = $defaultUser ? $defaultUser->id : null;
        }

        $validated['tenant_id'] = $user ? $user->tenant_id : null;
        if (empty($validated['tenant_id'])) {
            $patient = \App\Models\Patient::find($validated['patient_id']);
            $validated['tenant_id'] = $patient ? $patient->tenant_id : 1;
        }

        $validated['status'] = $validated['status'] ?? 'scheduled';
        $validated['type'] = $validated['type'] ?? 'therapy_session';

        // Map general type aliases
        if ($validated['type'] === 'consultation') {
            $validated['type'] = 'initial_consultation';
        } elseif ($validated['type'] === 'therapy') {
            $validated['type'] = 'therapy_session';
        }

        $recurrenceWeeks = (int) ($validated['recurrence_weeks'] ?? 1);
        $baseDate = \Carbon\Carbon::parse($validated['appointment_date']);
        $createdAppointments = [];

        for ($i = 0; $i < $recurrenceWeeks; $i++) {
            $entryData = $validated;
            unset($entryData['recurrence_weeks']);
            $currentDate = $baseDate->copy()->addWeeks($i);
            $entryData['appointment_date'] = $currentDate->toDateTimeString();

            if ($i > 0) {
                $entryData['notes'] = trim(($entryData['notes'] ?? '') . " [حصة متكررة #{$i}]");
            }

            $appt = Appointment::create($entryData);
            $createdAppointments[] = $appt;
        }

        $primary = $createdAppointments[0];

        return response()->json([
            'message' => $recurrenceWeeks > 1 
                ? "تمت جدولة {$recurrenceWeeks} حصص متكررة بنجاح." 
                : 'Rendez-vous planifié avec succès.',
            'id' => $primary->id,
            'appointment' => $primary->load(['patient', 'specialist']),
            'data' => $primary,
            'created_count' => count($createdAppointments),
        ], 201);
    }

    /**
     * Check for scheduling conflicts.
     */
    public function checkConflicts(Request $request): JsonResponse
    {
        $specialistId = $request->query('specialist_id');
        $datetimeStr = $request->query('appointment_date');

        if (!$datetimeStr) {
            return response()->json(['conflict' => false]);
        }

        $targetTime = \Carbon\Carbon::parse($datetimeStr);
        $startTime = $targetTime->copy()->subMinutes(25);
        $endTime = $targetTime->copy()->addMinutes(25);

        $query = Appointment::with(['patient', 'specialist'])
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->whereBetween('appointment_date', [$startTime, $endTime]);

        if ($specialistId) {
            $query->where('specialist_id', $specialistId);
        }

        $conflicts = $query->get();

        return response()->json([
            'conflict' => $conflicts->isNotEmpty(),
            'conflict_count' => $conflicts->count(),
            'conflicting_appointments' => $conflicts,
        ]);
    }

    /**
     * Quick start immediate session for a patient.
     */
    public function quickStartSession(Request $request): JsonResponse
    {
        $user = Auth::user();
        $patientId = $request->input('patient_id');
        $patient = \App\Models\Patient::find($patientId);

        $specialistId = $request->input('specialist_id');
        if (empty($specialistId)) {
            $specialistId = $user ? $user->id : (\App\Models\User::first()?->id);
        }

        $tenantId = $user ? $user->tenant_id : ($patient?->tenant_id ?? 1);

        $appointment = Appointment::create([
            'tenant_id' => $tenantId,
            'patient_id' => $patientId,
            'specialist_id' => $specialistId,
            'appointment_date' => now()->toDateString(),
            'start_time' => now()->format('H:i'),
            'type' => 'therapy_session',
            'status' => 'in_progress',
            'notes' => $request->input('notes', 'جلسة علاجية فورية ومباشرة'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الجلسة العلاجية بنجاح.',
            'id' => $appointment->id,
            'appointment' => $appointment->load(['patient', 'specialist']),
        ], 201);
    }

    /**
     * Start an appointment session (mark in_progress).
     */
    public function startSession(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->update(['status' => 'in_progress']);

        return response()->json([
            'success' => true,
            'message' => 'تم بدء الجلسة.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Complete an appointment session and optionally record a therapy session.
     */
     public function completeSession(string $id, Request $request): JsonResponse
     {
         $user = Auth::user();
         $appointment = Appointment::with(['patient', 'specialist', 'invoice'])->findOrFail($id);
         
         $notes = $request->input('notes', $appointment->notes);

         return DB::transaction(function () use ($appointment, $request, $user, $notes) {
             $appointment->update([
                 'status' => 'completed',
                 'notes' => $notes,
                 'completed_at' => now(),
             ]);

             $session = null;
             if ($request->input('save_therapy_session', true)) {
                 $specialty = $request->input('specialty', 'orthophony');
                 if (in_array($specialty, ['orthophonie', 'orthophony', 'speech'])) {
                     $specialty = 'orthophony';
                 } elseif (in_array($specialty, ['psychologie', 'psychology'])) {
                     $specialty = 'psychology';
                 } elseif (in_array($specialty, ['psychomotricite', 'psychomotricity'])) {
                     $specialty = 'psychomotricite';
                 } else {
                     $specialty = 'orthophony';
                 }

                 $duration = (int) $request->input('duration_minutes', 45);
                 if ($duration < 5) $duration = 45;

                 $session = TherapySession::create([
                     'tenant_id' => $appointment->tenant_id ?: ($user ? $user->tenant_id : 1),
                     'patient_id' => $appointment->patient_id,
                     'specialist_id' => $appointment->specialist_id ?: ($user ? $user->id : (\App\Models\User::first()?->id)),
                     'session_date' => $appointment->appointment_date ?: now()->toDateString(),
                     'duration_minutes' => $duration,
                     'specialty' => $specialty,
                     'progress_notes' => $request->input('progress_notes', $notes),
                     'exercises_targeted' => $request->input('exercises_targeted', []),
                     'attendance_status' => 'present',
                 ]);
             }

             // Auto-generate or Update Invoice / Receipt if requested
             $invoice = null;
             $fee = (float) $request->input('session_fee', 0);
             if ($request->boolean('generate_receipt', false) && $fee > 0) {
                 $tenantId = $appointment->tenant_id ?: ($user ? $user->tenant_id : null);
                 $paymentMethod = $request->input('payment_method', 'cash');
                 if (!in_array($paymentMethod, ['cash', 'card', 'bank_transfer', 'baridimob'])) {
                     $paymentMethod = 'cash';
                 }

                 // Check if an invoice already exists for this appointment
                 $existingInvoice = Invoice::withoutGlobalScopes()
                     ->where('tenant_id', $tenantId)
                     ->where('appointment_id', $appointment->id)
                     ->first();

                 if ($existingInvoice) {
                     $existingInvoice->update([
                         'total_amount' => $fee,
                         'paid_amount' => $fee,
                         'payment_status' => 'paid',
                         'payment_method' => $paymentMethod,
                         'items' => [
                             [
                                 'description' => 'Séance de consultation clinique / حصة تأهيل وعلاج سريري',
                                 'quantity' => 1,
                                 'unit_price' => $fee,
                             ]
                         ],
                     ]);
                     $invoice = $existingInvoice;
                 } else {
                     $year = date('Y');
                     $latestInvoice = Invoice::withoutGlobalScopes()
                         ->where('tenant_id', $tenantId)
                         ->whereYear('issued_date', $year)
                         ->where('invoice_number', 'LIKE', "FAC-{$year}-%")
                         ->orderByRaw('CAST(SUBSTRING(invoice_number, 10) AS UNSIGNED) DESC')
                         ->first();

                     $nextSeq = 1;
                     if ($latestInvoice && preg_match('/FAC-\d{4}-(\d+)/', $latestInvoice->invoice_number, $matches)) {
                         $nextSeq = ((int) $matches[1]) + 1;
                     } else {
                         $count = Invoice::withoutGlobalScopes()->where('tenant_id', $tenantId)->whereYear('issued_date', $year)->count();
                         $nextSeq = $count + 1;
                     }

                     // Guaranteed collision-free invoice number
                     do {
                         $candidateInvoiceNumber = sprintf('FAC-%s-%04d', $year, $nextSeq);
                         $exists = Invoice::withoutGlobalScopes()
                             ->where('tenant_id', $tenantId)
                             ->where('invoice_number', $candidateInvoiceNumber)
                             ->exists();
                         if ($exists) {
                             $nextSeq++;
                         }
                     } while ($exists);

                     $invoice = Invoice::create([
                         'tenant_id' => $tenantId,
                         'patient_id' => $appointment->patient_id,
                         'appointment_id' => $appointment->id,
                         'invoice_number' => $candidateInvoiceNumber,
                         'total_amount' => $fee,
                         'paid_amount' => $fee,
                         'payment_status' => 'paid',
                         'payment_method' => $paymentMethod,
                         'issued_date' => now()->toDateString(),
                         'items' => [
                             [
                                 'description' => 'Séance de consultation clinique / حصة تأهيل وعلاج سريري',
                                 'quantity' => 1,
                                 'unit_price' => $fee,
                             ]
                         ],
                     ]);
                 }
             }

             return response()->json([
                 'success' => true,
                 'message' => 'تم إنهاء وتوثيق الجلسة بنجاح.',
                 'appointment' => $appointment->fresh(['patient', 'specialist', 'invoice']),
                 'therapy_session' => $session,
                 'invoice' => $invoice,
             ]);
         });
     }

    /**
     * Display appointment details.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'specialist', 'invoice'])->findOrFail($id);

        return response()->json([
            'appointment' => $appointment,
            'data' => $appointment,
        ]);
    }

    /**
     * Update appointment or status.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);

        $validated = $request->validate([
            'appointment_date' => 'sometimes|required|date',
            'specialist_id' => 'sometimes|nullable|exists:users,id',
            'type' => 'sometimes|nullable|string',
            'status' => 'sometimes|required|in:scheduled,confirmed,in_progress,completed,cancelled,no_show',
            'notes' => 'nullable|string',
        ]);

        $appointment->update($validated);

        return response()->json([
            'message' => 'Rendez-vous mis à jour.',
            'appointment' => $appointment->load(['patient', 'specialist']),
        ]);
    }

    /**
     * Generate WhatsApp reminder message & direct URL for an appointment.
     */
    public function whatsappReminder(string $id): JsonResponse
    {
        $appointment = Appointment::with(['patient', 'specialist'])->find($id);

        if (!$appointment) {
            return response()->json([
                'success' => false,
                'message' => 'الموعد السريري غير موجود.',
            ], 404);
        }

        $patient = $appointment->patient;
        $tenant = $appointment->specialist?->tenant ?? $patient?->tenant ?? \App\Models\Tenant::find($appointment->tenant_id);

        $clinicName = $tenant ? ($tenant->header_title_ar ?: $tenant->name) : 'العيادة التخصصية';
        $clinicPhone = $tenant ? ($tenant->phone ?? '') : '';
        $clinicAddress = $tenant ? ($tenant->address ?? '') : '';

        try {
            $carbonDate = $appointment->appointment_date ? \Carbon\Carbon::parse($appointment->appointment_date) : now();
            $dateFormatted = $carbonDate->format('Y-m-d');
            $timeFormatted = $carbonDate->format('H:i');
        } catch (\Throwable $e) {
            $dateFormatted = date('Y-m-d');
            $timeFormatted = '10:00';
        }

        $specialistName = $appointment->specialist ? $appointment->specialist->name : 'الأخصائي المعالج';
        $patientName = $patient ? trim("{$patient->first_name} {$patient->last_name}") : 'المريض المحترم';
        if (empty($patientName)) {
            $patientName = 'المريض المحترم';
        }

        // Clean & normalize phone number (Algeria format: 05/06/07 -> 213..., +213 -> 213, 00213 -> 213)
        $rawPhone = $patient?->phone ?? '';
        $phone = preg_replace('/[^0-9]/', '', $rawPhone);
        if (str_starts_with($phone, '00')) {
            $phone = substr($phone, 2);
        } elseif (str_starts_with($phone, '0') && strlen($phone) === 10) {
            $phone = '213' . substr($phone, 1);
        }

        $typeLabels = [
            'initial_consultation' => 'استشارة أولى / فحص تشخيصي',
            'therapy_session' => 'حصة تأهيل وعلاج سريري',
            'assessment' => 'جلسة تقييم وتمرير مقاييس',
            'follow_up' => 'جلسة متابعة ومراقبة',
        ];
        $typeLabel = $typeLabels[$appointment->type] ?? 'جلسة علاجية سريرية';

        $text = "السلام عليكم ورحمة الله وبركاته،\n"
              . "نود تذكيركم بموعدكم القادم في: *{$clinicName}*\n\n"
              . "👤 *المريض:* {$patientName}\n"
              . "🩺 *نوع الجلسة:* {$typeLabel}\n"
              . "📅 *التاريخ:* {$dateFormatted}\n"
              . "⏰ *التوقيت:* {$timeFormatted}\n"
              . "👨‍⚕️ *المعالج:* {$specialistName}\n"
              . ($clinicAddress ? "📍 *العنوان:* {$clinicAddress}\n" : "")
              . "\nيرجى التفضل بالحضور قبل الموعد بـ 10 دقائق لتأكيد حضوركم عبر الشاشة الذكية في قاعة الانتظار. في حال الرغبة في التأجيل يرجى إخطارنا مسبقاً.\n"
              . "مع تمنياتنا لكم بدوام الصحة والعافية.";

        $encodedText = rawurlencode($text);
        $whatsappUrl = !empty($phone)
            ? "https://wa.me/{$phone}?text={$encodedText}"
            : "https://wa.me/?text={$encodedText}";
        $apiWhatsappUrl = !empty($phone)
            ? "https://api.whatsapp.com/send?phone={$phone}&text={$encodedText}"
            : "https://api.whatsapp.com/send?text={$encodedText}";

        return response()->json([
            'success' => true,
            'appointment_id' => $appointment->id,
            'phone' => $phone,
            'raw_phone' => $rawPhone,
            'patient_name' => $patientName,
            'specialist_name' => $specialistName,
            'clinic_name' => $clinicName,
            'clinic_address' => $clinicAddress,
            'appointment_date' => $appointment->appointment_date,
            'date_formatted' => $dateFormatted,
            'time_formatted' => $timeFormatted,
            'type_label' => $typeLabel,
            'message_text' => $text,
            'whatsapp_url' => $whatsappUrl,
            'api_whatsapp_url' => $apiWhatsappUrl,
            'status' => 'draft_prepared',
        ]);
    }

    /**
     * Dispatch WhatsApp reminder directly via Cloud API.
     */
    public function sendWhatsAppReminder(string $id): JsonResponse
    {
        $reminderResponse = $this->whatsappReminder($id);
        $reminderData = $reminderResponse->getData(true);

        if (empty($reminderData['success'])) {
            return response()->json([
                'success' => false,
                'cloud_sent' => false,
                'requires_manual' => true,
                'message' => $reminderData['message'] ?? 'تعذر تجهيز مسودة التذكير.',
            ], 200);
        }

        if (empty($reminderData['phone'])) {
            return response()->json([
                'success' => false,
                'cloud_sent' => false,
                'requires_manual' => true,
                'message' => 'لم يتم العثور على رقم هاتف متاح للمريض، يمكنك إدخال الرقم يدوياً.',
                'whatsapp_url' => $reminderData['whatsapp_url'] ?? '',
                'message_text' => $reminderData['message_text'] ?? '',
                'patient_name' => $reminderData['patient_name'] ?? '',
            ], 200);
        }

        $gw = \App\Models\CommunicationGateway::first();
        if (!$gw || !$gw->is_whatsapp_active || empty($gw->whatsapp_phone_number_id)) {
            return response()->json([
                'success' => false,
                'cloud_sent' => false,
                'requires_manual' => true,
                'message' => 'بوابة واتساب السحابية غير مفعلة، تم تجهيز الرابط المباشر ومسودة الرسالة للمعاينة والإرسال اليدوي.',
                'whatsapp_url' => $reminderData['whatsapp_url'],
                'api_whatsapp_url' => $reminderData['api_whatsapp_url'] ?? $reminderData['whatsapp_url'],
                'message_text' => $reminderData['message_text'],
                'phone' => $reminderData['phone'],
                'patient_name' => $reminderData['patient_name'],
            ], 200);
        }

        try {
            $res = \App\Services\WhatsAppCloudApiService::sendTextMessage(
                $reminderData['phone'],
                $reminderData['message_text'],
                $gw
            );

            if (!empty($res['success'])) {
                return response()->json([
                    'success' => true,
                    'cloud_sent' => true,
                    'message' => 'تم إرسال تذكير الموعد السريري بنجاح عبر بوابة واتساب السحابية! 🚀',
                    'message_id' => $res['message_id'] ?? null,
                    'phone' => $reminderData['phone'],
                    'whatsapp_url' => $reminderData['whatsapp_url'],
                    'message_text' => $reminderData['message_text'],
                    'patient_name' => $reminderData['patient_name'],
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('WhatsApp Cloud API dispatch error: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'cloud_sent' => false,
            'requires_manual' => true,
            'message' => 'تعذر الإرسال التلقائي عبر السحابة، تم تجهيز الرابط المباشر ومسودة الرسالة.',
            'whatsapp_url' => $reminderData['whatsapp_url'],
            'api_whatsapp_url' => $reminderData['api_whatsapp_url'] ?? $reminderData['whatsapp_url'],
            'message_text' => $reminderData['message_text'],
            'phone' => $reminderData['phone'],
            'patient_name' => $reminderData['patient_name'],
        ], 200);
    }

    /**
     * Export or print daily schedule for reception desk.
     */
    public function exportDailyPdf(Request $request): JsonResponse
    {
        $user = Auth::user();
        $date = $request->query('date', now()->toDateString());
        $tenantId = $user ? $user->tenant_id : null;

        $query = Appointment::with(['patient', 'specialist'])
            ->whereDate('appointment_date', $date);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $appointments = $query->orderBy('appointment_date', 'asc')->get();

        return response()->json([
            'success' => true,
            'date' => $date,
            'total_count' => $appointments->count(),
            'appointments' => $appointments,
        ]);
    }

    /**
     * Get live waiting room queue for active consultation and front-desk cockpit.
     */
    public function getLiveWaiting(Request $request): JsonResponse
    {
        $user = Auth::user();
        $tenantId = $user ? $user->tenant_id : null;
        $today = now()->toDateString();

        $query = Appointment::with(['patient', 'specialist'])
            ->whereDate('appointment_date', $today)
            ->whereIn('status', ['confirmed', 'arrived', 'waiting'])
            ->orderBy('appointment_date', 'asc');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $waitingList = $query->get();

        return response()->json([
            'success' => true,
            'count' => $waitingList->count(),
            'data' => $waitingList,
            'appointments' => $waitingList,
        ]);
    }

    /**
     * Delete appointment.
     */
    public function destroy(string $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->delete();

        return response()->json([
            'message' => 'Rendez-vous supprimé.',
        ]);
    }
}
