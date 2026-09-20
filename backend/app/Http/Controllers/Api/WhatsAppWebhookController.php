<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\CommunicationGateway;
use App\Models\Patient;
use App\Models\Tenant;
use App\Models\WhatsAppWebhookLog;
use App\Services\WhatsAppCloudApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    /**
     * Handle Meta Webhook Verification Challenge (GET Request).
     * Meta sends: hub.mode, hub.verify_token, hub.challenge.
     */
    public function verifyWebhook(Request $request): Response
    {
        // Note: PHP automatically converts dots to underscores in $_GET variables
        $mode = $request->query('hub_mode') 
            ?? $request->query('hub.mode') 
            ?? $request->input('hub_mode') 
            ?? ($_GET['hub_mode'] ?? null);

        $token = $request->query('hub_verify_token') 
            ?? $request->query('hub.verify_token') 
            ?? $request->input('hub_verify_token') 
            ?? ($_GET['hub_verify_token'] ?? null);

        $challenge = $request->query('hub_challenge') 
            ?? $request->query('hub.challenge') 
            ?? $request->input('hub_challenge') 
            ?? ($_GET['hub_challenge'] ?? null);

        $gateway = CommunicationGateway::first();
        $expectedToken = $gateway?->whatsapp_webhook_verify_token ?: 'psypro_wa_webhook_verify_secret_2026';

        Log::info("WhatsApp Webhook Verification attempt: mode={$mode}, token={$token}");

        if ($mode === 'subscribe' && $token === $expectedToken) {
            // Log verification event
            WhatsAppWebhookLog::create([
                'event_type' => 'verification',
                'status' => 'verified',
                'ip_address' => $request->ip(),
                'signature_valid' => true,
                'message_body' => "Meta Hub Challenge Verified Successfully: {$challenge}",
            ]);

            Log::info("WhatsApp Webhook Challenge Verified Successfully! Challenge: {$challenge}");
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning("WhatsApp Webhook Verification Failed. Expected: {$expectedToken}, Received: {$token}");

        WhatsAppWebhookLog::create([
            'event_type' => 'error',
            'status' => 'failed',
            'ip_address' => $request->ip(),
            'signature_valid' => false,
            'message_body' => "Verification Token Mismatch. Expected: {$expectedToken}, Got: {$token}",
        ]);

        return response('Forbidden: Verification token mismatch', 403)->header('Content-Type', 'text/plain');
    }

    /**
     * Handle Incoming Meta WhatsApp Webhook Notifications (POST Request).
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        $gateway = CommunicationGateway::first();
        $appSecret = $gateway?->getDecryptedWhatsappAppSecret();
        $rawPayload = $request->getContent();
        $signatureHeader = $request->header('X-Hub-Signature-256');

        // 1. Verify X-Hub-Signature-256
        $isSignatureValid = WhatsAppCloudApiService::verifySignature($rawPayload, $signatureHeader, $appSecret);
        if (!$isSignatureValid) {
            Log::warning("WhatsApp Webhook Invalid Signature from IP: " . $request->ip());
            WhatsAppWebhookLog::create([
                'event_type' => 'error',
                'status' => 'signature_rejected',
                'ip_address' => $request->ip(),
                'signature_valid' => false,
                'message_body' => 'X-Hub-Signature-256 verification failed',
                'raw_payload' => ['raw' => substr($rawPayload, 0, 500)],
            ]);

            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $payload = json_decode($rawPayload, true) ?: $request->all();
        $entries = $payload['entry'] ?? [];

        foreach ($entries as $entry) {
            $changes = $entry['changes'] ?? [];
            foreach ($changes as $change) {
                $value = $change['value'] ?? [];

                // Handle incoming Messages
                if (!empty($value['messages'])) {
                    $contacts = $value['contacts'] ?? [];
                    $contactName = $contacts[0]['profile']['name'] ?? 'مريض واتساب';

                    foreach ($value['messages'] as $msg) {
                        $this->processIncomingMessage($msg, $contactName, $payload, $request->ip());
                    }
                }

                // Handle delivery / read Status updates
                if (!empty($value['statuses'])) {
                    foreach ($value['statuses'] as $statusUpdate) {
                        $this->processStatusUpdate($statusUpdate, $payload, $request->ip());
                    }
                }

                // Handle Meta Template Approval/Rejection events
                $field = $change['field'] ?? '';
                if ($field === 'message_template_status_update' || !empty($value['event'])) {
                    $templateEvent = $value['event'] ?? 'UNKNOWN';
                    $templateName = $value['message_template_name'] ?? 'unknown_template';
                    $reason = $value['reason'] ?? 'N/A';

                    WhatsAppWebhookLog::create([
                        'event_type' => 'template_status_update',
                        'status' => strtolower($templateEvent),
                        'ip_address' => $request->ip(),
                        'signature_valid' => true,
                        'message_body' => "Meta Template [{$templateName}] status updated to: {$templateEvent} (Reason: {$reason})",
                        'raw_payload' => $value,
                    ]);

                    Log::info("WhatsApp Webhook: Meta Template '{$templateName}' is now {$templateEvent}");
                }
            }
        }

        // Meta requires an immediate HTTP 200 OK
        return response()->json(['status' => 'EVENT_RECEIVED'], 200);
    }

    /**
     * Process an incoming WhatsApp message (Appointment actions, AI Receptionist, Auto-Replies).
     */
    protected function processIncomingMessage(array $msg, string $contactName, array $fullPayload, ?string $ip): void
    {
        $messageId = $msg['id'] ?? null;
        $fromPhone = $msg['from'] ?? null;
        $msgType = $msg['type'] ?? 'text';
        $body = '';

        if ($msgType === 'text') {
            $body = trim($msg['text']['body'] ?? '');
        } elseif ($msgType === 'interactive') {
            $body = $msg['interactive']['button_reply']['title'] 
                ?? $msg['interactive']['button_reply']['id'] 
                ?? $msg['interactive']['list_reply']['title'] 
                ?? 'رد تفاعلي';
        } elseif ($msgType === 'button') {
            $body = $msg['button']['text'] ?? $msg['button']['payload'] ?? 'زر';
        } else {
            $body = "[مرفق سريري: {$msgType}]";
        }

        // 1. Match with patient by phone number
        $cleanFrom = preg_replace('/[^0-9]/', '', (string)$fromPhone);
        $phoneSuffix = strlen($cleanFrom) > 8 ? substr($cleanFrom, -8) : $cleanFrom;

        $patient = Patient::where('phone', 'LIKE', "%{$phoneSuffix}%")->first();
        $tenantId = $patient?->tenant_id ?? Tenant::first()?->id ?? null;
        $tenant = $tenantId ? Tenant::find($tenantId) : Tenant::first();

        $autoReplySent = null;
        $replyMessage = null;

        // 2. Check for Appointment Confirmation / Cancellation Keywords or Button IDs
        $normalized = mb_strtolower($body);
        $isConfirm = in_array($normalized, ['1', 'تأكيد', 'نعم', 'تاكيد', 'ok', 'confirm']) 
            || str_contains($normalized, 'confirm_') 
            || str_contains($normalized, 'تأكيد') 
            || str_contains($normalized, 'تاكيد') 
            || str_contains($normalized, 'أؤكد') 
            || str_contains($normalized, 'اوكد') 
            || str_contains($normalized, 'سأحضر') 
            || str_contains($normalized, 'ساحضر');

        $isCancel = in_array($normalized, ['2', 'إلغاء', 'الغاء', 'اعتذار', 'تأجيل', 'لا', 'cancel']) 
            || str_contains($normalized, 'cancel_') 
            || str_contains($normalized, 'إلغاء') 
            || str_contains($normalized, 'الغاء') 
            || str_contains($normalized, 'ألغي') 
            || str_contains($normalized, 'الغي') 
            || str_contains($normalized, 'اعتذار') 
            || str_contains($normalized, 'تأجيل') 
            || str_contains($normalized, 'تاجيل') 
            || str_contains($normalized, 'لن أحضر') 
            || str_contains($normalized, 'لن احضر');

        if ($patient && ($isConfirm || $isCancel)) {
            // Find upcoming appointment across any clinic for this patient
            $appointment = Appointment::where('patient_id', $patient->id)
                ->where('appointment_date', '>=', now()->toDateString())
                ->whereIn('status', ['pending', 'scheduled', 'confirmed'])
                ->orderBy('appointment_date', 'asc')
                ->first();

            if ($appointment) {
                // Explicitly resolve the specific clinic for this appointment
                $appointmentTenant = Tenant::find($appointment->tenant_id) ?: $tenant;
                $clinicName = $appointmentTenant?->name ?: 'العيادة';
                $bookingSlug = $appointmentTenant?->slug ?: $appointmentTenant?->id;
                $bookingUrl = "https://psypro.tech/booking/{$bookingSlug}";

                if ($isConfirm) {
                    $appointment->update(['status' => 'confirmed']);
                    $replyMessage = "✅ تم تأكيد موعدكم بنجاح في {$clinicName}!\n\n📅 التاريخ: {$appointment->appointment_date}\n⏰ التوقيت: {$appointment->start_time}\n\nنتشرف باستقبالكم! 🩺✨";
                } else {
                    $appointment->update(['status' => 'cancelled']);
                    $replyMessage = "❌ تم إلغاء موعدكم وتسجيل اعتذاركم ليوم {$appointment->appointment_date} في عيادة {$clinicName}.\n\nيسعدنا خدمتكم في أي وقت آخر. بإمكانكم طلب أو اختيار موعد جديد عبر الرابط:\n{$bookingUrl}";
                }
            } else {
                $bookingSlug = $tenant?->slug ?: $tenant?->id;
                $bookingUrl = "https://psypro.tech/booking/{$bookingSlug}";
                $replyMessage = "مرحباً بك {$patient->first_name}، تم استلام رسالتكم. ليس لديكم مواعيد قادمة معلقة حالياً في المنظومة. لحجز موعد جديد يرجى زيارة: {$bookingUrl}";
            }
        } elseif ($tenant && $tenant->whatsapp_auto_reply_enabled) {
            // 3. Clinical AI Receptionist Smart Triage Reply
            $replyMessage = $this->generateAiReceptionistResponse($body, $tenant, $contactName);
        }

        // Send reply via WhatsApp Cloud API
        if (!empty($replyMessage) && !empty($fromPhone)) {
            $sendRes = WhatsAppCloudApiService::sendTextMessage($fromPhone, $replyMessage);
            if ($sendRes['success'] ?? false) {
                $autoReplySent = $replyMessage;
            }
        }

        // 4. Log the incoming message
        WhatsAppWebhookLog::create([
            'tenant_id' => $tenantId,
            'event_type' => 'incoming_message',
            'message_id' => $messageId,
            'sender_phone' => $fromPhone,
            'sender_name' => $contactName,
            'message_type' => $msgType,
            'message_body' => $body,
            'status' => $autoReplySent ? 'replied' : 'received',
            'patient_id' => $patient?->id,
            'auto_reply_sent' => $autoReplySent,
            'raw_payload' => $fullPayload,
            'ip_address' => $ip,
            'signature_valid' => true,
        ]);
    }

    /**
     * Process message delivery status receipt (sent, delivered, read, failed).
     */
    protected function processStatusUpdate(array $statusUpdate, array $fullPayload, ?string $ip): void
    {
        $messageId = $statusUpdate['id'] ?? null;
        $status = $statusUpdate['status'] ?? 'unknown'; // delivered, read, failed, sent
        $recipientId = $statusUpdate['recipient_id'] ?? null;

        // Update corresponding message log if found
        if ($messageId) {
            $log = WhatsAppWebhookLog::where('message_id', $messageId)->first();
            if ($log) {
                $log->update(['status' => $status]);
            }
        }

        WhatsAppWebhookLog::create([
            'event_type' => 'status_update',
            'message_id' => $messageId,
            'sender_phone' => $recipientId,
            'status' => $status,
            'raw_payload' => $fullPayload,
            'ip_address' => $ip,
            'signature_valid' => true,
        ]);
    }

    /**
     * Generate empathetic, clinically accurate AI Receptionist response.
     */
    protected function generateAiReceptionistResponse(string $userMsg, Tenant $tenant, string $senderName): string
    {
        $lower = mb_strtolower($userMsg);
        $clinicName = $tenant->name ?: 'العيادة الطبية النفسية والتأهيلية';

        // Red Alert / Urgent Danger check
        if (str_contains($lower, 'انتحار') || str_contains($lower, 'أنهي حياتي') || str_contains($lower, 'موت') || str_contains($lower, 'إيذاء')) {
            return "🚨 [تنبيه أمان عاجل من {$clinicName}]\n\nأخي/أختي الكريمة، نحن نهتم لسلامتك بشدة. إذا كنت تشعر بخطر داهم أو ضيق نفسي حاد، يُرجى التوجه فوراً لأقرب مصلحة استعجالات طبية أو الاتصال بالحماية المدنية (14) أو الخط الأخضر (1055).\n\nفريقنا الطبي مستعد لتقديم الدعم السريري العاجل فور استقرار الوضع.";
        }

        // Speech & Language (الأرطوفونيا)
        if (str_contains($lower, 'نطق') || str_contains($lower, 'تأتأة') || str_contains($lower, 'كلام') || str_contains($lower, 'تأخر لغوي') || str_contains($lower, 'مخارج')) {
            return "مرحباً بك {$senderName} في قسم الأرطوفونيا والتخاطب بـ {$clinicName} 🗣️\n\nنقدم فحوصات الحصيلة الأرطوفونية الشاملة، وعلاج تأخر الكلام والتأتأة واضطرابات النطق للأطفال والراشدين.\n\nلحجز موعد فحص أولي، يرجى زيارة الرابط:\nhttps://psypro.tech/booking/{$tenant->slug}?specialty=orthophony\nأو موافاتنا باسم وعمر الحالة لمساعدتكم فوراً.";
        }

        // Child & Autism (التوحد وفرط الحركة)
        if (str_contains($lower, 'توحد') || str_contains($lower, 'حركة') || str_contains($lower, 'تركيز') || str_contains($lower, 'انتباه') || str_contains($lower, 'مدرسة')) {
            return "أهلاً بك {$senderName} في وحدة طب نفس الأطفال ونمو الطفل بـ {$clinicName} 👶✨\n\nنوفر بطاريات تشخيصية معيارية لاضطرابات طيف التوحد (CARS) ونقص الانتباه وفرط النشاط (TDAH) وصعوبات التعلم.\n\nلحجز موعد تقييم سريري شامل:\nhttps://psypro.tech/booking/{$tenant->slug}?specialty=child_psychiatry";
        }

        // Psychology & Mood (الاكتئاب والقلق)
        if (str_contains($lower, 'قلق') || str_contains($lower, 'اكتئاب') || str_contains($lower, 'خوف') || str_contains($lower, 'هلع') || str_contains($lower, 'وسواس') || str_contains($lower, 'نفسي')) {
            return "مرحباً بك {$senderName} في الاستشارات النفسية والعلاج المعرفي السلوكي (CBT) بـ {$clinicName} 🩺\n\nنستقبلكم في بيئة آمنة وسرية تامة لمساعدتكم في تجاوز القلق ونوبات الهلع والاكتئاب والضغوط الحياتية.\n\nلحجز جلسة استشارة نفسية:\nhttps://psypro.tech/booking/{$tenant->slug}?specialty=psychology";
        }

        // Working hours & Location
        if (str_contains($lower, 'عنوان') || str_contains($lower, 'موقع') || str_contains($lower, 'وقت') || str_contains($lower, 'ساعات') || str_contains($lower, 'دوام')) {
            $addr = $tenant->address ?: 'الجزائر';
            return "📍 مقر {$clinicName}:\n{$addr}\n\n⏰ أوقات العمل والاستقبال:\nالسبت - الخميس: 08:30 إلى 17:00\nالجمعة: عطلة أسبوعية\n\n📞 هاتف العيادة: {$tenant->phone}";
        }

        // General greeting
        return "مرحباً بك {$senderName} في {$clinicName}! 🩺✨\n\nأنا موظف الاستقبال الآلي الذكي للعيادة. كيف يمكننا مساعدتك اليوم؟\n\n1️⃣ لحجز موعد جديد: https://psypro.tech/booking/{$tenant->slug}\n2️⃣ لتأكيد أو تعديل موعد قائم: أرسل رقم 1 للتأكيد أو 2 للاعتذار\n3️⃣ لمعلومات عن التخصصات والفحوصات، تفضل بطرح سؤالك مباشرة.";
    }

    /**
     * Get recent Webhook Logs (SuperAdmin / Clinic Monitoring).
     */
    public function getWebhookLogs(Request $request): JsonResponse
    {
        $limit = (int)$request->input('limit', 50);

        $logs = WhatsAppWebhookLog::with(['patient:id,first_name,last_name,phone', 'tenant:id,name'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        $stats = [
            'total_received' => WhatsAppWebhookLog::where('event_type', 'incoming_message')->count(),
            'total_replied' => WhatsAppWebhookLog::where('status', 'replied')->count(),
            'total_delivered' => WhatsAppWebhookLog::where('status', 'delivered')->count(),
            'total_read' => WhatsAppWebhookLog::where('status', 'read')->count(),
        ];

        return response()->json([
            'success' => true,
            'logs' => $logs,
            'stats' => $stats,
        ]);
    }

    /**
     * Simulate Incoming WhatsApp Message (Testing & Verification Studio).
     */
    public function simulateIncomingWebhook(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sender_phone' => 'required|string',
            'sender_name' => 'nullable|string',
            'message_body' => 'required|string',
            'message_type' => 'nullable|string',
        ]);

        $senderPhone = preg_replace('/[^0-9]/', '', $validated['sender_phone']);
        $senderName = $validated['sender_name'] ?: 'مريض تجريبي';
        $messageBody = $validated['message_body'];
        $messageType = $validated['message_type'] ?: 'text';
        $simulatedMsgId = 'wamid_sim_' . uniqid();

        // Build simulated Meta JSON Payload
        $simulatedPayload = [
            'object' => 'whatsapp_business_account',
            'entry' => [
                [
                    'id' => '104928374928374',
                    'changes' => [
                        [
                            'field' => 'messages',
                            'value' => [
                                'messaging_product' => 'whatsapp',
                                'metadata' => [
                                    'display_phone_number' => '213550123456',
                                    'phone_number_id' => '104928374928374',
                                ],
                                'contacts' => [
                                    [
                                        'profile' => ['name' => $senderName],
                                        'wa_id' => $senderPhone,
                                    ],
                                ],
                                'messages' => [
                                    [
                                        'from' => $senderPhone,
                                        'id' => $simulatedMsgId,
                                        'timestamp' => (string)time(),
                                        'type' => $messageType,
                                        'text' => ['body' => $messageBody],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        // Process message through real pipeline
        $msgData = [
            'id' => $simulatedMsgId,
            'from' => $senderPhone,
            'type' => $messageType,
            'text' => ['body' => $messageBody],
        ];

        $this->processIncomingMessage($msgData, $senderName, $simulatedPayload, $request->ip());

        $loggedRecord = WhatsAppWebhookLog::where('message_id', $simulatedMsgId)->first();

        return response()->json([
            'success' => true,
            'message' => 'تمت محاكاة ومعالجة رسالة الواتساب الواردة بنجاح! 💬✨',
            'simulated_log' => $loggedRecord,
        ]);
    }

    /**
     * Send direct WhatsApp notification from any platform service.
     * Prioritizes Meta-approved clinical templates to ensure 100% deliverability even when the 24h customer care window is closed.
     */
    public function sendDirectMessage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'required|string',
            'patient_id' => 'nullable',
            'service_type' => 'nullable|string', // appointment, teletherapy, exercise, portal, report, billing
            'template_name' => 'nullable|string',
            'template_parameters' => 'nullable|array',
        ]);

        $rawPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($rawPhone, '0')) {
            $rawPhone = '213' . substr($rawPhone, 1);
        }

        $fallbackUrl = 'https://wa.me/' . $rawPhone . '?text=' . urlencode($validated['message']);

        $gw = CommunicationGateway::first();
        if (!$gw || !$gw->is_whatsapp_active || empty($gw->whatsapp_phone_number_id)) {
            return response()->json([
                'success' => false,
                'message' => 'بوابة واتساب السحابية غير مهيأة أو غير مفعلة.',
                'whatsapp_url' => $fallbackUrl,
            ], 400);
        }

        $templateName = $validated['template_name'] ?? null;
        $templateParams = $validated['template_parameters'] ?? [];

        // Auto-resolve template if not explicitly specified by frontend
        if (empty($templateName)) {
            $serviceType = $validated['service_type'] ?? '';
            $patient = !empty($validated['patient_id']) ? \App\Models\Patient::with('tenant')->find($validated['patient_id']) : null;
            $patientName = $patient ? trim($patient->first_name . ' ' . $patient->last_name) : 'العميل الكريم';
            $clinicName = $patient?->tenant?->name ?? (auth()->user()?->tenant?->name ?? 'العيادة السريرية');

            // Extract URL from message if present
            preg_match('/https?:\/\/[^\s]+/', $validated['message'], $urlMatches);
            $extractedUrl = $urlMatches[0] ?? config('app.url', 'https://psypro.tech');

            if (in_array($serviceType, ['patient_portal', 'portal', 'parent_portal'])) {
                $templateName = 'patient_portal_magic_link';
                $templateParams = [$patientName, $clinicName, $extractedUrl];
            } elseif (in_array($serviceType, ['clinical_test', 'assessment', 'test', 'protocol_instructions'])) {
                $templateName = 'clinical_scale_invitation';
                $templateParams = [$patientName, $clinicName, 'الفحص السريري المعتمد', $extractedUrl];
            } elseif (in_array($serviceType, ['homework', 'exercise', 'homework_exercise', 'closure_homework_summary'])) {
                $templateName = 'session_homework_summary';
                $templateParams = [$patientName, $clinicName, 'البرنامج العلاجي والتكليفات السريرية', $extractedUrl];
            } elseif (in_array($serviceType, ['teletherapy', 'teletherapy_room'])) {
                $templateName = 'teletherapy_session_consultation';
                $templateParams = [$patientName, $clinicName, $extractedUrl, '10 دقائق'];
            }
        }

        // 1. If we have a valid template, ALWAYS try sending via Meta Template first!
        // Why? Because Meta Cloud API strictly rejects free-form text outside 24h window (error 131047),
        // whereas Meta-approved utility templates are delivered 100% reliably regardless of window status.
        if (!empty($templateName) && !empty($templateParams)) {
            $templateRes = WhatsAppCloudApiService::sendTemplateMessage(
                $rawPhone,
                $templateName,
                'ar',
                $templateParams,
                $gw
            );

            if (!empty($templateRes['success'])) {
                WhatsAppWebhookLog::create([
                    'tenant_id' => auth()->user()?->tenant_id ?? null,
                    'event_type' => 'outgoing_message',
                    'message_id' => $templateRes['message_id'] ?? null,
                    'sender_phone' => $gw->whatsapp_phone_number_id,
                    'status' => 'sent',
                    'patient_id' => $validated['patient_id'] ?? null,
                    'message_body' => $validated['message'],
                    'message_type' => 'template',
                    'raw_payload' => [
                        'service_type' => $validated['service_type'] ?? 'direct_dispatch',
                        'template_name' => $templateName,
                        'template_parameters' => $templateParams,
                        'meta_response' => $templateRes['data'] ?? null,
                    ],
                ]);

                return response()->json([
                    'success' => true,
                    'is_template' => true,
                    'template_name' => $templateName,
                    'message' => 'تم إرسال الرسالة إلى واتساب المريض بنجاح عبر القالب السريري المعتمد! 🚀',
                    'message_id' => $templateRes['message_id'] ?? null,
                    'phone' => $rawPhone,
                    'whatsapp_url' => $fallbackUrl,
                ]);
            }
        }

        // 2. Fallback to direct text message if no template matched or template failed
        $sendRes = WhatsAppCloudApiService::sendTextMessage($rawPhone, $validated['message'], $gw);

        if (!empty($sendRes['success'])) {
            WhatsAppWebhookLog::create([
                'tenant_id' => auth()->user()?->tenant_id ?? null,
                'event_type' => 'outgoing_message',
                'message_id' => $sendRes['message_id'] ?? null,
                'sender_phone' => $gw->whatsapp_phone_number_id,
                'status' => 'sent',
                'patient_id' => $validated['patient_id'] ?? null,
                'message_body' => $validated['message'],
                'message_type' => 'text',
                'raw_payload' => [
                    'service_type' => $validated['service_type'] ?? 'direct_dispatch',
                    'meta_response' => $sendRes['data'] ?? null,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'تم إرسال الرسالة إلى واتساب المريض بنجاح! 🚀',
                'message_id' => $sendRes['message_id'] ?? null,
                'phone' => $rawPhone,
                'whatsapp_url' => $fallbackUrl,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'تعذر الإرسال السحابي التلقائي: ' . ($sendRes['error']['message'] ?? $sendRes['message'] ?? 'خطأ في الربط'),
            'whatsapp_url' => $fallbackUrl,
        ], 422);
    }
}
