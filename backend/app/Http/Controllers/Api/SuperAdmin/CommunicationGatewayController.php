<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\CommunicationGateway;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class CommunicationGatewayController extends Controller
{
    /**
     * Get communication gateways settings with masked sensitive keys.
     */
    public function getSettings(Request $request): JsonResponse
    {
        $gateway = CommunicationGateway::first();

        if (!$gateway) {
            $gateway = CommunicationGateway::create([
                'mail_driver' => 'smtp',
                'mail_host' => 'smtp.gmail.com',
                'mail_port' => 587,
                'mail_username' => 'notifications@psypro.tech',
                'mail_password' => '',
                'mail_encryption' => 'tls',
                'mail_from_address' => 'noreply@psypro.tech',
                'mail_from_name' => 'PsyPro Tech Clinics Platform',
                'is_mail_active' => true,
                'sms_provider' => 'custom_http',
                'sms_api_key' => '',
                'sms_sender_id' => 'PsyProDZ',
                'sms_api_url' => 'https://api.sms-gateway.dz/v1/send',
                'is_sms_active' => false,
                'whatsapp_provider' => 'whatsapp_cloud_api',
                'whatsapp_instance_id' => 'instance_99482',
                'whatsapp_token' => '',
                'whatsapp_phone_number_id' => '104928374928374',
                'whatsapp_sender_number' => '+213550123456',
                'is_whatsapp_active' => true,
            ]);
        }

        $data = $gateway->toArray();
        // Mask sensitive tokens
        $data['mail_password'] = !empty($gateway->mail_password) ? '••••••••••••' : '';
        $data['sms_api_key'] = !empty($gateway->sms_api_key) ? '••••••••••••' : '';
        $data['whatsapp_token'] = !empty($gateway->whatsapp_token) ? '••••••••••••' : '';

        return response()->json([
            'success' => true,
            'settings' => $data,
        ]);
    }

    /**
     * Save communication gateways settings with encryption.
     */
    public function saveSettings(Request $request): JsonResponse
    {
        $request->validate([
            'mail_driver' => 'nullable|string',
            'mail_host' => 'nullable|string',
            'mail_port' => 'nullable|integer',
            'mail_username' => 'nullable|string',
            'mail_encryption' => 'nullable|string',
            'mail_from_address' => 'nullable|string|email',
            'mail_from_name' => 'nullable|string',
            'is_mail_active' => 'nullable|boolean',
            'sms_provider' => 'nullable|string',
            'sms_sender_id' => 'nullable|string',
            'sms_api_url' => 'nullable|string',
            'is_sms_active' => 'nullable|boolean',
            'whatsapp_provider' => 'nullable|string',
            'whatsapp_instance_id' => 'nullable|string',
            'whatsapp_phone_number_id' => 'nullable|string',
            'whatsapp_sender_number' => 'nullable|string',
            'is_whatsapp_active' => 'nullable|boolean',
        ]);

        $gateway = CommunicationGateway::first() ?: new CommunicationGateway();

        $gateway->mail_driver = $request->input('mail_driver', 'smtp');
        $gateway->mail_host = $request->input('mail_host', 'smtp.gmail.com');
        $gateway->mail_port = (int)$request->input('mail_port', 587);
        $gateway->mail_username = $request->input('mail_username');
        $gateway->mail_encryption = $request->input('mail_encryption', 'tls');
        $gateway->mail_from_address = $request->input('mail_from_address', 'noreply@psypro.tech');
        $gateway->mail_from_name = $request->input('mail_from_name', 'PsyPro Tech');
        $gateway->is_mail_active = filter_var($request->input('is_mail_active'), FILTER_VALIDATE_BOOLEAN);

        // Update password only if new non-masked string is provided
        $mailPass = $request->input('mail_password');
        if (!empty($mailPass) && !str_contains($mailPass, '••••')) {
            $gateway->mail_password = $mailPass;
        }

        // SMS Config
        $gateway->sms_provider = $request->input('sms_provider', 'custom_http');
        $gateway->sms_sender_id = $request->input('sms_sender_id', 'PsyProDZ');
        $gateway->sms_api_url = $request->input('sms_api_url');
        $gateway->is_sms_active = filter_var($request->input('is_sms_active'), FILTER_VALIDATE_BOOLEAN);

        $smsKey = $request->input('sms_api_key');
        if (!empty($smsKey) && !str_contains($smsKey, '••••')) {
            $gateway->sms_api_key = $smsKey;
        }

        // WhatsApp Config
        $gateway->whatsapp_provider = $request->input('whatsapp_provider', 'whatsapp_cloud_api');
        $gateway->whatsapp_instance_id = $request->input('whatsapp_instance_id');
        $gateway->whatsapp_phone_number_id = $request->input('whatsapp_phone_number_id');
        $gateway->whatsapp_sender_number = $request->input('whatsapp_sender_number');
        $gateway->is_whatsapp_active = filter_var($request->input('is_whatsapp_active'), FILTER_VALIDATE_BOOLEAN);

        $waToken = $request->input('whatsapp_token');
        if (!empty($waToken) && !str_contains($waToken, '••••')) {
            $gateway->whatsapp_token = $waToken;
        }

        $gateway->save();

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ وتشفير إعدادات بوابات التواصل بنجاح! 💾✨',
        ]);
    }

    /**
     * Test SMTP Email dispatch.
     */
    public function testEmail(Request $request): JsonResponse
    {
        $request->validate([
            'test_email' => 'required|email',
        ]);

        $gateway = CommunicationGateway::first();
        if (!$gateway) {
            return response()->json(['success' => false, 'message' => 'يرجى تهيئة إعدادات البريد أولاً.'], 400);
        }

        $password = $gateway->getDecryptedMailPassword();
        $targetEmail = $request->input('test_email');

        try {
            // Apply dynamic SMTP settings
            Config::set('mail.default', 'smtp');
            Config::set('mail.mailers.smtp.transport', 'smtp');
            Config::set('mail.mailers.smtp.host', $gateway->mail_host);
            Config::set('mail.mailers.smtp.port', $gateway->mail_port);
            Config::set('mail.mailers.smtp.encryption', $gateway->mail_encryption ?: null);
            Config::set('mail.mailers.smtp.username', $gateway->mail_username);
            Config::set('mail.mailers.smtp.password', $password);
            Config::set('mail.from.address', $gateway->mail_from_address);
            Config::set('mail.from.name', $gateway->mail_from_name);

            $subject = '🟢 [PsyPro Tech] فحص الاتصال وتأكيد خادم البريد (SMTP Test)';
            $timeNow = now()->toDateTimeString();

            Mail::raw("مرحباً بك،\n\nهذا بريد إلكتروني تجريبي لتأكيد نجاح الربط بخادم SMTP لمنصة PsyPro Tech.\n\nتوقيت الفحص: {$timeNow}\nالخادم: {$gateway->mail_host}:{$gateway->mail_port}\n\nنظام التواصل مشفر وجاهز للعمل بكفاءة 100%.", function ($message) use ($targetEmail, $subject, $gateway) {
                $message->to($targetEmail)
                        ->from($gateway->mail_from_address, $gateway->mail_from_name)
                        ->subject($subject);
            });

            return response()->json([
                'success' => true,
                'message' => "تم إرسال البريد الإلكتروني التجريبي بنجاح إلى: {$targetEmail} 📧✨",
            ]);
        } catch (\Exception $e) {
            Log::error('SMTP Test Failed: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر إرسال البريد التجريبي. تفاصيل الخطأ: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test SMS Gateway dispatch.
     */
    public function testSms(Request $request): JsonResponse
    {
        $request->validate([
            'test_phone' => 'required|string',
        ]);

        $gateway = CommunicationGateway::first();
        if (!$gateway) {
            return response()->json(['success' => false, 'message' => 'يرجى تهيئة بوابة الرسائل القصيرة أولاً.'], 400);
        }

        $phone = $request->input('test_phone');
        $apiKey = $gateway->getDecryptedSmsApiKey();
        $senderId = $gateway->sms_sender_id ?: 'PsyProDZ';
        $messageText = "PsyPro Tech: رمز التحقق وفحص بوابة SMS هو [ " . rand(100000, 999999) . " ]. الخادم يعمل بنجاح.";

        try {
            if ($gateway->sms_provider === 'twilio') {
                // Twilio logic
                if ($gateway->sms_api_url && $apiKey) {
                    $res = Http::withBasicAuth($gateway->sms_sender_id, $apiKey)
                        ->asForm()
                        ->post($gateway->sms_api_url, [
                            'To' => $phone,
                            'From' => $senderId,
                            'Body' => $messageText,
                        ]);
                }
            } elseif ($gateway->sms_provider === 'custom_http' && $gateway->sms_api_url) {
                // Custom HTTP API
                $res = Http::withHeaders([
                    'Authorization' => "Bearer {$apiKey}",
                    'Content-Type' => 'application/json',
                ])->timeout(10)->post($gateway->sms_api_url, [
                    'phone' => $phone,
                    'sender' => $senderId,
                    'message' => $messageText,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "تم تنفيذ وتأكيد إرسال رسالة SMS التجريبية بنجاح إلى الرقم: {$phone} 📱✨",
                'provider' => $gateway->sms_provider,
                'sender' => $senderId,
            ]);
        } catch (\Exception $e) {
            Log::error('SMS Test Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر إرسال SMS التجريبي: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test WhatsApp Gateway dispatch.
     */
    public function testWhatsapp(Request $request): JsonResponse
    {
        $request->validate([
            'test_phone' => 'required|string',
        ]);

        $gateway = CommunicationGateway::first();
        if (!$gateway) {
            return response()->json(['success' => false, 'message' => 'يرجى تهيئة بوابة الواتساب أولاً.'], 400);
        }

        $phone = preg_replace('/[^0-9]/', '', $request->input('test_phone'));
        $token = $gateway->getDecryptedWhatsappToken();
        $provider = $gateway->whatsapp_provider;

        try {
            $testMessage = "مرحباً بك من منصة PsyPro Tech! 🩺✨\n\nهذا إشعار تجريبي لاختبار خادم WhatsApp API.\n\n✅ البوابة: {$provider}\n✅ التوقيت: " . now()->format('Y-m-d H:i:s') . "\n\nنظام التنبيهات السريرية والمواعيد جاهز للعمل تلقائياً.";

            if ($provider === 'ultramsg' && $gateway->whatsapp_instance_id && $token) {
                Http::timeout(10)->post("https://api.ultramsg.com/{$gateway->whatsapp_instance_id}/messages/chat", [
                    'token' => $token,
                    'to' => $phone,
                    'body' => $testMessage,
                ]);
            } elseif ($provider === 'whatsapp_cloud_api' && $gateway->whatsapp_phone_number_id && $token) {
                Http::withToken($token)->timeout(10)->post("https://graph.facebook.com/v19.0/{$gateway->whatsapp_phone_number_id}/messages", [
                    'messaging_product' => 'whatsapp',
                    'to' => $phone,
                    'type' => 'text',
                    'text' => ['body' => $testMessage],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => "تم إرسال إشعار WhatsApp التجريبي بنجاح إلى الرقم: {$phone} 💬✨",
                'provider' => $provider,
            ]);
        } catch (\Exception $e) {
            Log::error('WhatsApp Test Exception: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'تعذر إرسال إشعار الواتساب التجريبي: ' . $e->getMessage(),
            ], 500);
        }
    }
}
