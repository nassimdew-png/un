<?php

namespace App\Services;

use App\Models\CommunicationGateway;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppCloudApiService
{
    /**
     * Verify Meta X-Hub-Signature-256 HMAC hash.
     */
    public static function verifySignature(string $payload, ?string $signatureHeader, ?string $appSecret): bool
    {
        // If app secret is not configured, pass verification in development/testing mode
        if (empty($appSecret)) {
            return true;
        }

        if (empty($signatureHeader) || !str_starts_with($signatureHeader, 'sha256=')) {
            return false;
        }

        $expectedHash = substr($signatureHeader, 7);
        $computedHash = hash_hmac('sha256', $payload, $appSecret);

        return hash_equals($computedHash, $expectedHash);
    }

    /**
     * Send standard Text Message via Meta WhatsApp Cloud API (v20.0).
     */
    public static function sendTextMessage(string $toPhone, string $message, ?CommunicationGateway $gateway = null): array
    {
        $gateway = $gateway ?: CommunicationGateway::first();
        if (!$gateway) {
            return ['success' => false, 'message' => 'بوابة التواصل غير مهيأة'];
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $toPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        }

        $provider = $gateway->whatsapp_provider;
        $token = $gateway->getDecryptedWhatsappToken();

        try {
            if ($provider === 'whatsapp_cloud_api') {
                $phoneNumberId = $gateway->whatsapp_phone_number_id;
                if (empty($phoneNumberId) || empty($token)) {
                    return ['success' => false, 'message' => 'بيانات WhatsApp Phone Number ID أو Token غير مكتملة'];
                }

                $url = "https://graph.facebook.com/v20.0/{$phoneNumberId}/messages";
                $response = Http::withToken($token)
                    ->timeout(15)
                    ->post($url, [
                        'messaging_product' => 'whatsapp',
                        'recipient_type' => 'individual',
                        'to' => $cleanPhone,
                        'type' => 'text',
                        'text' => [
                            'preview_url' => false,
                            'body' => $message,
                        ],
                    ]);

                if ($response->successful()) {
                    return [
                        'success' => true,
                        'data' => $response->json(),
                        'message_id' => $response->json('messages.0.id'),
                    ];
                }

                Log::error('WhatsApp Cloud API Send Error: ' . $response->body());
                return [
                    'success' => false,
                    'error' => $response->json() ?: $response->body(),
                    'message' => 'فشل إرسال الرسالة عبر Meta WhatsApp Cloud API',
                ];
            } elseif ($provider === 'ultramsg' && $gateway->whatsapp_instance_id && $token) {
                // Fallback for UltraMsg instance
                $url = "https://api.ultramsg.com/{$gateway->whatsapp_instance_id}/messages/chat";
                $response = Http::timeout(15)->post($url, [
                    'token' => $token,
                    'to' => $cleanPhone,
                    'body' => $message,
                ]);

                return [
                    'success' => $response->successful(),
                    'data' => $response->json(),
                ];
            }

            return ['success' => false, 'message' => 'مزود الخدمة المحدد غير مدعوم'];
        } catch (\Exception $e) {
            Log::error('WhatsAppCloudApiService Exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'استثناء أثناء الإرسال: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Send Interactive Buttons for Appointment Confirmation.
     */
    public static function sendAppointmentButtons(
        string $toPhone,
        string $patientName,
        string $appointmentDate,
        string $appointmentTime,
        string $appointmentId,
        ?CommunicationGateway $gateway = null
    ): array {
        $gateway = $gateway ?: CommunicationGateway::first();
        if (!$gateway) {
            return ['success' => false, 'message' => 'بوابة التواصل غير مهيأة'];
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $toPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        }

        $phoneNumberId = $gateway->whatsapp_phone_number_id;
        $token = $gateway->getDecryptedWhatsappToken();

        if (empty($phoneNumberId) || empty($token)) {
            // Fallback to text message
            $fallbackText = "مرحباً بك {$patientName}،\nنود تذكيركم بموعدكم السريري يوم {$appointmentDate} على الساعة {$appointmentTime}.\n\nالرجاء الرد بـ:\n1️⃣ لتأكيد الحضور\n2️⃣ للاعتذار أو التأجيل";
            return self::sendTextMessage($cleanPhone, $fallbackText, $gateway);
        }

        $url = "https://graph.facebook.com/v20.0/{$phoneNumberId}/messages";

        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'recipient_type' => 'individual',
                'to' => $cleanPhone,
                'type' => 'interactive',
                'interactive' => [
                    'type' => 'button',
                    'header' => [
                        'type' => 'text',
                        'text' => '🩺 تأكيد موعد سريري',
                    ],
                    'body' => [
                        'text' => "مرحباً بك {$patientName}، نود تذكيركم بموعدكم يوم {$appointmentDate} الساعة {$appointmentTime}. يُرجى تحديد خياركم:",
                    ],
                    'footer' => [
                        'text' => 'المنظومة السريرية الذكية PsyPro',
                    ],
                    'action' => [
                        'buttons' => [
                            [
                                'type' => 'reply',
                                'reply' => [
                                    'id' => "confirm_{$appointmentId}",
                                    'title' => '✅ تأكيد الحضور',
                                ],
                            ],
                            [
                                'type' => 'reply',
                                'reply' => [
                                    'id' => "cancel_{$appointmentId}",
                                    'title' => '❌ اعتذار / إلغاء',
                                ],
                            ],
                        ],
                    ],
                ],
            ];

            $response = Http::withToken($token)->timeout(15)->post($url, $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'message_id' => $response->json('messages.0.id'),
                ];
            }

            // If interactive fails (e.g., recipient outside 24h window or not supported), fallback to template
            $fallbackText = "مرحباً بك {$patientName}،\nنود تذكيركم بموعدكم السريري يوم {$appointmentDate} على الساعة {$appointmentTime}.\n\nالرجاء الرد بـ:\n1️⃣ لتأكيد الحضور\n2️⃣ للاعتذار أو التأجيل";
            return self::sendTextMessage($cleanPhone, $fallbackText, $gateway);
        } catch (\Exception $e) {
            Log::error('sendAppointmentButtons error: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Send pre-approved Template Message via Meta WhatsApp Cloud API.
     * Works anytime 24/7/365, even outside the 24-hour customer care window.
     */
    public static function sendTemplateMessage(
        string $toPhone,
        string $templateName,
        string $languageCode = 'ar',
        array $bodyParameters = [],
        ?CommunicationGateway $gateway = null
    ): array {
        return self::sendCategorizedTemplate(
            toPhone: $toPhone,
            templateName: $templateName,
            languageCode: $languageCode,
            bodyParams: $bodyParameters,
            headerParams: [],
            buttonParams: [],
            gateway: $gateway
        );
    }

    /**
     * Enhanced Sender supporting Header parameters, Body parameters, and Button actions.
     */
    public static function sendCategorizedTemplate(
        string $toPhone,
        string $templateName,
        string $languageCode = 'ar',
        array $bodyParams = [],
        array $headerParams = [],
        array $buttonParams = [],
        ?CommunicationGateway $gateway = null
    ): array {
        $gateway = $gateway ?: CommunicationGateway::first();
        if (!$gateway) {
            return ['success' => false, 'message' => 'بوابة التواصل غير مهيأة'];
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $toPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '213' . substr($cleanPhone, 1);
        }

        $phoneNumberId = $gateway->whatsapp_phone_number_id;
        $token = $gateway->getDecryptedWhatsappToken();

        if (empty($phoneNumberId) || empty($token)) {
            return ['success' => false, 'message' => 'بيانات WhatsApp Phone Number ID أو Token غير مكتملة'];
        }

        $url = "https://graph.facebook.com/v20.0/{$phoneNumberId}/messages";

        $templateData = [
            'name' => $templateName,
            'language' => [
                'code' => $languageCode,
            ],
        ];

        $components = [];

        // Header parameters
        if (!empty($headerParams)) {
            $headerFormatted = [];
            foreach ($headerParams as $param) {
                if (is_array($param) && isset($param['type'])) {
                    $headerFormatted[] = $param;
                } else {
                    $headerFormatted[] = [
                        'type' => 'text',
                        'text' => (string) $param,
                    ];
                }
            }
            $components[] = [
                'type' => 'header',
                'parameters' => $headerFormatted,
            ];
        }

        // Body parameters
        if (!empty($bodyParams)) {
            $bodyFormatted = [];
            foreach ($bodyParams as $param) {
                $bodyFormatted[] = [
                    'type' => 'text',
                    'text' => (string) $param,
                ];
            }
            $components[] = [
                'type' => 'body',
                'parameters' => $bodyFormatted,
            ];
        }

        // Button parameters (e.g., dynamic URL suffix or OTP code)
        if (!empty($buttonParams)) {
            foreach ($buttonParams as $index => $btn) {
                if (isset($btn['type']) && $btn['type'] === 'payload') {
                    $components[] = [
                        'type' => 'button',
                        'sub_type' => 'quick_reply',
                        'index' => (string) $index,
                        'parameters' => [
                            [
                                'type' => 'payload',
                                'payload' => (string) $btn['payload'],
                            ],
                        ],
                    ];
                } elseif (isset($btn['type']) && $btn['type'] === 'url') {
                    $components[] = [
                        'type' => 'button',
                        'sub_type' => 'url',
                        'index' => (string) $index,
                        'parameters' => [
                            [
                                'type' => 'text',
                                'text' => (string) $btn['text'],
                            ],
                        ],
                    ];
                } elseif (isset($btn['type']) && $btn['type'] === 'coupon_code') {
                    $components[] = [
                        'type' => 'button',
                        'sub_type' => 'copy_code',
                        'index' => (string) $index,
                        'parameters' => [
                            [
                                'type' => 'coupon_code',
                                'coupon_code' => (string) $btn['code'],
                            ],
                        ],
                    ];
                }
            }
        }

        if (!empty($components)) {
            $templateData['components'] = $components;
        }

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->post($url, [
                    'messaging_product' => 'whatsapp',
                    'recipient_type' => 'individual',
                    'to' => $cleanPhone,
                    'type' => 'template',
                    'template' => $templateData,
                ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'message_id' => $response->json('messages.0.id'),
                ];
            }

            Log::error('WhatsApp Template Send Error: ' . $response->body());
            return [
                'success' => false,
                'error' => $response->json() ?: $response->body(),
                'message' => 'فشل إرسال قالب الواتساب عبر Meta Cloud API: ' . ($response->json('error.message') ?? $response->body()),
            ];
        } catch (\Exception $e) {
            Log::error('sendCategorizedTemplate Exception: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Fetch Live Templates from Meta WhatsApp Business Account (WABA).
     */
    public static function listTemplates(?CommunicationGateway $gateway = null): array
    {
        $gateway = $gateway ?: CommunicationGateway::first();
        $defaults = self::getDefaultClinicalTemplates();

        if (!$gateway) {
            return [
                'success' => true,
                'is_live' => false,
                'templates' => $defaults,
                'message' => 'عرض القوالب الافتراضية المحفوظة محلياً (يرجى تهيئة بيانات WABA لجلب البيانات الحية)',
            ];
        }

        $wabaId = $gateway->whatsapp_business_account_id;
        $token = $gateway->getDecryptedWhatsappToken();

        if (empty($wabaId) || empty($token)) {
            return [
                'success' => true,
                'is_live' => false,
                'templates' => $defaults,
                'message' => 'عرض القوالب الافتراضية السريرية (لم يتم إدخال WABA ID أو API Token بعد)',
            ];
        }

        try {
            $url = "https://graph.facebook.com/v20.0/{$wabaId}/message_templates?limit=100";
            $response = Http::withToken($token)->timeout(15)->get($url);

            if ($response->successful()) {
                $metaTemplates = $response->json('data', []);
                
                // Merge and enrich meta templates with PsyPro clinical metadata
                $merged = [];
                $metaMap = [];
                foreach ($metaTemplates as $t) {
                    $metaMap[$t['name']] = $t;
                }

                foreach ($defaults as $def) {
                    $name = $def['name'];
                    if (isset($metaMap[$name])) {
                        $metaItem = $metaMap[$name];
                        $merged[] = array_merge($def, [
                            'id' => $metaItem['id'] ?? $def['id'],
                            'status' => $metaItem['status'] ?? 'APPROVED',
                            'category' => $metaItem['category'] ?? $def['category'],
                            'language' => $metaItem['language'] ?? $def['language'],
                            'components' => $metaItem['components'] ?? $def['components'],
                            'quality_score' => $metaItem['quality_score'] ?? ['score' => 'GREEN'],
                            'is_synced' => true,
                        ]);
                        unset($metaMap[$name]);
                    } else {
                        $merged[] = array_merge($def, [
                            'status' => 'LOCAL_ONLY',
                            'is_synced' => false,
                        ]);
                    }
                }

                // Add any other non-default templates that exist in the user's Meta WABA
                foreach ($metaMap as $customMeta) {
                    $cName = trim($customMeta['name'] ?? '');
                    if (empty($cName) || !preg_match('/^[a-zA-Z0-9_]+$/', $cName)) {
                        continue; // skip malformed/garbage template names
                    }
                    $merged[] = [
                        'id' => $customMeta['id'] ?? uniqid('meta_'),
                        'name' => $cName,
                        'title_ar' => $cName,
                        'category' => $customMeta['category'] ?? 'UTILITY',
                        'language' => $customMeta['language'] ?? 'ar',
                        'status' => $customMeta['status'] ?? 'PENDING',
                        'components' => $customMeta['components'] ?? [],
                        'quality_score' => $customMeta['quality_score'] ?? ['score' => 'UNKNOWN'],
                        'is_synced' => true,
                        'is_custom' => true,
                    ];
                }

                return [
                    'success' => true,
                    'is_live' => true,
                    'templates' => $merged,
                    'meta_count' => count($metaTemplates),
                ];
            }

            Log::warning('Meta List Templates Warning: ' . $response->body());
            return [
                'success' => true,
                'is_live' => false,
                'templates' => $defaults,
                'error_detail' => $response->json('error.message') ?? $response->body(),
                'message' => 'تعذر الاتصال المباشر بـ Meta API، تم عرض القوالب السريرية الجاهزة محلياً.',
            ];
        } catch (\Exception $e) {
            Log::error('listTemplates Exception: ' . $e->getMessage());
            return [
                'success' => true,
                'is_live' => false,
                'templates' => $defaults,
                'message' => 'استثناء أثناء جلب القوالب: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create / Submit a New Message Template to Meta WhatsApp Business Account.
     * Complies with Meta's Template Categorization Rules (UTILITY, AUTHENTICATION, MARKETING).
     */
    public static function createTemplate(array $templateData, ?CommunicationGateway $gateway = null): array
    {
        $gateway = $gateway ?: CommunicationGateway::first();
        if (!$gateway) {
            return ['success' => false, 'message' => 'بوابة التواصل غير مهيأة'];
        }

        $wabaId = $gateway->whatsapp_business_account_id;
        $token = $gateway->getDecryptedWhatsappToken();

        if (empty($wabaId) || empty($token)) {
            return ['success' => false, 'message' => 'بيانات WhatsApp Business Account ID (WABA) أو Token غير مكتملة'];
        }

        $category = strtoupper($templateData['category'] ?? 'UTILITY');
        $validCategories = ['UTILITY', 'AUTHENTICATION', 'MARKETING'];
        if (!in_array($category, $validCategories)) {
            return ['success' => false, 'message' => 'التصنيف غير صالح. يجب أن يكون UTILITY أو AUTHENTICATION أو MARKETING'];
        }

        $name = strtolower(preg_replace('/[^a-z0-9_]/', '_', trim($templateData['name'] ?? '')));
        if (empty($name)) {
            return ['success' => false, 'message' => 'اسم القالب مطلوب ويجب أن يحتوي على أحرف إنجليزية وأرقام وشرطة سفلية فقط'];
        }

        $language = $templateData['language'] ?? 'ar';
        $components = $templateData['components'] ?? [];

        // Run validation against Meta Categorization Guidelines
        $bodyText = '';
        foreach ($components as $c) {
            if (($c['type'] ?? '') === 'BODY' || ($c['type'] ?? '') === 'body') {
                $bodyText = $c['text'] ?? '';
                break;
            }
        }
        $validation = self::validateTemplateCategorization($category, $bodyText, $components);
        if (!$validation['valid']) {
            return [
                'success' => false,
                'message' => 'مخالفة لقواعد تصنيف ميتا: ' . $validation['reason'],
                'warnings' => $validation['warnings'],
            ];
        }

        $payload = [
            'name' => $name,
            'category' => $category,
            'language' => $language,
            'components' => $components,
        ];

        try {
            $url = "https://graph.facebook.com/v20.0/{$wabaId}/message_templates";
            $response = Http::withToken($token)->timeout(15)->post($url, $payload);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'data' => $response->json(),
                    'template_id' => $response->json('id'),
                    'status' => $response->json('status', 'PENDING'),
                    'message' => "تم إرسال القالب '{$name}' بنجاح إلى Meta للمراجعة والاعتماد! 🎉",
                ];
            }

            Log::error('Meta Create Template Error: ' . $response->body());
            $errMsg = $response->json('error.error_user_msg') 
                ?? $response->json('error.message') 
                ?? $response->body();

            return [
                'success' => false,
                'error' => $response->json(),
                'message' => 'فشل إنشاء القالب في Meta: ' . $errMsg,
            ];
        } catch (\Exception $e) {
            Log::error('createTemplate Exception: ' . $e->getMessage());
            return ['success' => false, 'message' => 'استثناء أثناء الإرسال: ' . $e->getMessage()];
        }
    }

    /**
     * Delete a Template from Meta WhatsApp Business Account.
     */
    public static function deleteTemplate(string $templateName, ?CommunicationGateway $gateway = null): array
    {
        $gateway = $gateway ?: CommunicationGateway::first();
        if (!$gateway) {
            return ['success' => false, 'message' => 'بوابة التواصل غير مهيأة'];
        }

        $wabaId = $gateway->whatsapp_business_account_id;
        $token = $gateway->getDecryptedWhatsappToken();

        if (empty($wabaId) || empty($token)) {
            return ['success' => false, 'message' => 'بيانات WABA أو Token غير مكتملة'];
        }

        try {
            $url = "https://graph.facebook.com/v20.0/{$wabaId}/message_templates?name={$templateName}";
            $response = Http::withToken($token)->timeout(15)->delete($url);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'message' => "تم حذف القالب '{$templateName}' بنجاح من Meta! 🗑️",
                ];
            }

            return [
                'success' => false,
                'message' => 'تعذر حذف القالب من Meta: ' . ($response->json('error.message') ?? $response->body()),
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Push all Default Clinical Templates to Meta WABA in One Click.
     */
    public static function syncDefaultTemplates(?CommunicationGateway $gateway = null): array
    {
        $defaults = self::getDefaultClinicalTemplates();
        $results = [
            'total' => count($defaults),
            'synced' => 0,
            'skipped' => 0,
            'failed' => 0,
            'details' => [],
        ];

        foreach ($defaults as $tmpl) {
            $res = self::createTemplate([
                'name' => $tmpl['name'],
                'category' => $tmpl['category'],
                'language' => $tmpl['language'] ?? 'ar',
                'components' => $tmpl['components'],
            ], $gateway);

            if (!empty($res['success'])) {
                $results['synced']++;
                $results['details'][] = ['name' => $tmpl['name'], 'status' => 'SYNCED'];
            } else {
                // If it already exists in Meta, count as skipped/existing
                $errMsg = $res['message'] ?? '';
                if (str_contains($errMsg, 'already exists') || str_contains($errMsg, 'already Arabic content') || str_contains($errMsg, '100')) {
                    $results['skipped']++;
                    $results['details'][] = ['name' => $tmpl['name'], 'status' => 'ALREADY_EXISTS'];
                } else {
                    $results['failed']++;
                    $results['details'][] = ['name' => $tmpl['name'], 'status' => 'FAILED', 'error' => $errMsg];
                }
            }
        }

        return [
            'success' => true,
            'results' => $results,
            'message' => "تمت المزامنة: تم نشر {$results['synced']} قالب جديد، {$results['skipped']} موجود مسبقاً لدى Meta، {$results['failed']} تعذر رفعه.",
        ];
    }

    /**
     * AI/Rule-based Validation of Template content according to Meta Categorization Guidelines.
     * Prevents Meta template rejections and reclassifications.
     */
    public static function validateTemplateCategorization(string $category, string $bodyText, array $components = []): array
    {
        $category = strtoupper($category);
        $warnings = [];

        // Marketing keywords check in UTILITY templates
        $marketingKeywords = [
            'تخفيض', 'خصم', 'عروض', 'عرض خاص', 'مجانا', 'هدية', 'اشتراك رخيص', 'وفر معنا', 
            'promo', 'discount', 'free', 'sale', 'off', 'deal', 'win', 'cashback'
        ];

        if ($category === 'UTILITY') {
            foreach ($marketingKeywords as $kw) {
                if (mb_stripos($bodyText, $kw) !== false) {
                    $warnings[] = "تحذير ميتا: القالب يحتوي على الكلمة التسويقية '{$kw}'. تصنيف UTILITY مخصص فقط للإشعارات والمعاملات المطلوبة. قد تقوم Meta برفض القالب أو تصنيفه تلقائياً كـ MARKETING.";
                }
            }
        }

        // Authentication rules
        if ($category === 'AUTHENTICATION') {
            $hasSecRec = false;
            foreach ($components as $c) {
                if (!empty($c['add_security_recommendation'])) {
                    $hasSecRec = true;
                    break;
                }
            }

            if (!$hasSecRec && !str_contains($bodyText, '{{1}}')) {
                return [
                    'valid' => false,
                    'reason' => 'قوالب المصادقة AUTHENTICATION يجب أن تحتوي على رمز التحقق كمتغير أساسي {{1}} أو تمكين خاصية add_security_recommendation.',
                    'warnings' => $warnings,
                ];
            }
            if (str_contains($bodyText, 'http://') || str_contains($bodyText, 'https://')) {
                return [
                    'valid' => false,
                    'reason' => 'قواعد Meta تمنع إدراج روابط URLs داخل نص قوالب المصادقة (AUTHENTICATION).',
                    'warnings' => $warnings,
                ];
            }
        }

        // Variable sequence validation ({{1}}, {{2}}, etc.)
        preg_match_all('/\{\{(\d+)\}\}/', $bodyText, $matches);
        if (!empty($matches[1])) {
            $vars = array_map('intval', $matches[1]);
            sort($vars);
            for ($i = 0; $i < count($vars); $i++) {
                if ($vars[$i] !== ($i + 1)) {
                    $warnings[] = "تنبيه تسلسل المتغيرات: يفضل أن تبدأ المتغيرات من {{1}} وتتزايد تسلسلياً ({{1}}, {{2}}, ...) لتجنب أخطاء بناء القالب.";
                    break;
                }
            }
        }

        return [
            'valid' => true,
            'warnings' => $warnings,
        ];
    }

    /**
     * Built-in Comprehensive Clinical & Administrative Templates Library.
     * Categorized strictly under: UTILITY, AUTHENTICATION, MARKETING.
     */
    public static function getDefaultClinicalTemplates(): array
    {
        return [
            // =========================================================================
            // 1. UTILITY (الخدمية والمعاملات السريرية)
            // =========================================================================
            [
                'id' => 'tmpl_util_appt_remind',
                'name' => 'appointment_reminder_v2',
                'title_ar' => '🩺 تذكير بالموعد السريري',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'إشعار تذكير رسمي بالموعد السريري مع اسم الطبيب والتاريخ والساعة.',
                'sample_params' => ['محمد بن علي', 'الشفاء التخصصية', 'د. ناصر بوجمعة', 'السبت 14 أكتوبر', '10:30 صباحاً'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'تذكير بموعد استشارة سريرية',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nنود تذكيركم بموعدكم السريري في عيادة {{2}} مع الأخصائي/الطبيب {{3}} يوم {{4}} على الساعة {{5}}.\n\nيرجى الحضور قبل الموعد بـ 10 دقائق لضمان سير الجلسة في أفضل الظروف.",
                        'example' => [
                            'body_text' => [['محمد بن علي', 'الشفاء التخصصية', 'د. ناصر بوجمعة', 'السبت 14 أكتوبر', '10:30 صباحاً']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'المنظومة السريرية الذكية PsyPro',
                    ],
                    [
                        'type' => 'BUTTONS',
                        'buttons' => [
                            ['type' => 'QUICK_REPLY', 'text' => 'تأكيد الحضور'],
                            ['type' => 'QUICK_REPLY', 'text' => 'اعتذار أو تأجيل'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_appt_confirm',
                'name' => 'appointment_confirmation_v2',
                'title_ar' => '✅ تأكيد حجز موعد سريري',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'تأكيد فوري لتثبيت حجز الجلسة بعد التنسيق مع العيادة.',
                'sample_params' => ['فاطمة الزهراء', 'الأمل للصحة النفسية', 'الثلاثاء 17 أكتوبر', '14:00'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'تأكيد حجز الموعد السريري',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nتم تأكيد حجز موعدكم السريري بنجاح في عيادة {{2}} يوم {{3}} على الساعة {{4}}.\n\nنتمنى لكم دوام الصحة والعافية ويسعدنا دائماً خدمتكم.",
                        'example' => [
                            'body_text' => [['فاطمة الزهراء', 'الأمل للصحة النفسية', 'الثلاثاء 17 أكتوبر', '14:00']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'منصة PsyPro السريرية',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_assess_invite',
                'name' => 'clinical_assessment_invite',
                'title_ar' => '📋 دعوة لملء رائز واستبيان سريري',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'إرسال رابط آمن ومباشر للمريض أو الولي لملء رائز نفسي أو مقياس نمائي.',
                'sample_params' => ['ياسين قادري', 'مقياس فاينلاند للسلوك التكيفي', 'https://psypro.tech/test/v2026', '24 ساعة'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'استبيان وتقييم سريري رقمي',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nنرجو منكم التكرم بملء استبيان الفحص السريري {{2}} لتقييم ومتابعة الخطة العلاجية عبر الرابط الآمن {{3}} مباشرة.\n\nصلاحية هذا الرابط هي {{4}} للبدء في الإجابة.",
                        'example' => [
                            'body_text' => [['ياسين قادري', 'مقياس فاينلاند للسلوك التكيفي', 'https://psypro.tech/test/v2026', '24 ساعة']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'سري وخاص بالملف الطبي — PsyPro',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_portal_access',
                'name' => 'patient_portal_magic_link',
                'title_ar' => '🌐 رابط الدخول لبوابة المريض',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'تسليم رابط مباشر وآمن لملف المريض ومتابعة المواعيد والحصائل.',
                'sample_params' => ['أمينة مرابط', 'النور للأرطوفونيا', 'https://psypro.tech/p/77482'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'بوابة المريض السريرية',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nيمكنك الآن الوصول المباشر إلى ملفك السريري ومتابعة تطور الحصص ومواعيدك القادمة في عيادة {{2}} عبر الرابط المعتمد {{3}} لمتابعة ملفكم.",
                        'example' => [
                            'body_text' => [['أمينة مرابط', 'النور للأرطوفونيا', 'https://psypro.tech/p/77482']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'PsyPro Patient Portal',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_homework_alert',
                'name' => 'session_homework_alert',
                'title_ar' => '📝 إشعار بالواجبات والتوصيات السريرية',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'إرسال التمارين المنزلية والتوصيات العلاجية لولي الأمر بعد انتهاء الجلسة.',
                'sample_params' => ['ولي أمر الطفل ريان', 'جلسة التخاطب والنطق', 'الأخصائي حمزة', 'تمرين التنفس وتمييز الأصوات الصفيرية 10 دقائق يومياً'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'الخطة العلاجية والتمارين المنزلية',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nلقد تم تسجيل توصيات وتمارين منزلية جديدة لـ ({{2}}) من قِبل {{3}}:\n\nالبرنامج المطلوب:\n{{4}}\n\nالتزامكم اليومي يعزز سرعة تحسن الحالة واستقرارها.",
                        'example' => [
                            'body_text' => [['ولي أمر الطفل ريان', 'جلسة التخاطب والنطق', 'الأخصائي حمزة', 'تمرين التنفس وتمييز الأصوات الصفيرية 10 دقائق يومياً']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'الخطة العلاجية الفردية PEI — PsyPro',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_receipt_bill',
                'name' => 'invoice_payment_receipt',
                'title_ar' => '🧾 وصل تسديد أتعاب الاستشارة',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'تأكيد استلام الدفعة المالية وإصدار وصل الفحص المعتمد.',
                'sample_params' => ['كريم سلطاني', 'FAC-2026-0482', '3500.00', 'الشفاء النفسي والتأهيل'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'وصل استلام وتسديد رسمي',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً {{1}}،\nتم بنجاح تسجيل تسديد وصل الفحص رقم #{{2}} بقيمة {{3}} دج لدى عيادة {{4}}.\n\nنشكركم على ثقتكم بنا.",
                        'example' => [
                            'body_text' => [['كريم سلطاني', 'FAC-2026-0482', '3500.00', 'الشفاء النفسي والتأهيل']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'إدارة الفوترة والتحصيل — PsyPro',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_debt_remind',
                'name' => 'debt_payment_reminder',
                'title_ar' => '⏳ تذكير بمستحقات الجلسات السريرية',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'تذكير مهني لطيف بالرصيد المتبقي لتسويته في الجلسة المقبلة.',
                'sample_params' => ['سفيان براهيمي', '4000.00', 'الأمل الطبي'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'إشعار الرصيد والمستحقات',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nنود تذكيركم بلطف بوجود رصيد متبقي بقيمة {{2}} دج لجلسات المتابعة لدى عيادة {{3}}.\n\nيمكنكم تسويته خلال موعدكم القادم في العيادة. نشكركم على حسن تفهمكم.",
                        'example' => [
                            'body_text' => [['سفيان براهيمي', '4000.00', 'الأمل الطبي']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'القسم المالي والتحصيل',
                    ],
                ],
            ],

            // =========================================================================
            // 2. AUTHENTICATION & SECURITY (رموز التحقق والمصادقة السريرية)
            // =========================================================================
            [
                'id' => 'tmpl_auth_portal_otp',
                'name' => 'patient_portal_verification_code',
                'title_ar' => '🔐 رمز التحقق لفتح الملف الطبي',
                'category' => 'AUTHENTICATION',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'إرسال رمز تحقق سريري مؤقت لفتح البوابة السريرية والاطلاع على الملف.',
                'sample_params' => ['محمد', '849201', '10'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'رمز التحقق والدخول السريري',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nرمز التحقق الخاص بك للدخول إلى بوابة المريض السريرية هو: {{2}}.\n\nهذا الرمز صالح لمدة {{3}} دقائق. يرجى عدم مشاركته مع أي شخص حفاظاً على سرية بياناتكم.",
                        'example' => [
                            'body_text' => [['محمد', '849201', '10']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'الحماية والسرية الطبية — PsyPro',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_auth_staff_mfa',
                'name' => 'staff_security_login_code',
                'title_ar' => '🛡️ رمز المصادقة الثنائية للممارس السريري',
                'category' => 'AUTHENTICATION',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'رمز التحقق الثنائي MFA للأطباء وأخصائيي العيادة.',
                'sample_params' => ['د. ناصر', '592814', '5'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'رمز المصادقة الثنائية للمنظومة',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً {{1}}،\nرمز تسجيل الدخول الآمن لحسابكم السريري هو: {{2}}.\n\nالرمز صالح للاستخدام خلال {{3}} دقائق فقط.",
                        'example' => [
                            'body_text' => [['د. ناصر', '592814', '5']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'الأمان السريري المتقدم — PsyPro',
                    ],
                ],
            ],

            // =========================================================================
            // 3. MARKETING (الرسائل الترويجية والتوعوية واستبقاء المرضى)
            // =========================================================================
            [
                'id' => 'tmpl_mkt_welcome_onboard',
                'name' => 'clinic_welcome_onboarding',
                'title_ar' => '🌿 ترحيب بالمرضى الجدد واستعراض الخدمات',
                'category' => 'MARKETING',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'رسالة ترحيبية مهنية للمرضى الجدد واستعراض تخصصات العيادة وساعات العمل.',
                'sample_params' => ['أحمد', 'عيادة النور للصحة النفسية والأرطوفونيا'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'مرحبا بكم في عيادتنا',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "أهلاً وسهلاً بك {{1}} في {{2}}.\n\nيسعدنا مرافقتكم في رحلتكم العلاجية والتأهيلية. فريقنا من الأخصائيين النفسانيين وأخصائيي التخاطب والأرطوفونيا على أتم الاستعداد لتقديم أفضل رعاية سريرية لكم ولعائلتكم.",
                        'example' => [
                            'body_text' => [['أحمد', 'عيادة النور للصحة النفسية والأرطوفونيا']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'PsyPro Clinic Suite',
                    ],
                    [
                        'type' => 'BUTTONS',
                        'buttons' => [
                            ['type' => 'QUICK_REPLY', 'text' => 'حجز استشارة'],
                            ['type' => 'QUICK_REPLY', 'text' => 'موقع العيادة'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'tmpl_mkt_health_tip',
                'name' => 'mental_health_awareness_tip',
                'title_ar' => '💡 إضاءة وتوعية سريرية دورية',
                'category' => 'MARKETING',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'حملة تثقيفية وتوعوية بنمو الطفل والصحة النفسية وتنمية المهارات اللغوية.',
                'sample_params' => ['أم ريان', 'عيادة الشفاء', 'الحوار اليومي والتفاعل البصري مع الطفل لمدة 15 دقيقة يعزز النمو اللغوي واللفظي بنسبة 40%'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'إضاءة وتوعية نمائية',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "عزيزنا {{1}}،\nإضاءة الأسبوع السريرية من {{2}}:\n\n✨ \"{{3}}\"\n\nنهتم دائماً بصحتكم النفسية وتطور أطفالكم المعرفي واللغوي.",
                        'example' => [
                            'body_text' => [['أم ريان', 'عيادة الشفاء', 'الحوار اليومي والتفاعل البصري مع الطفل لمدة 15 دقيقة يعزز النمو اللغوي واللفظي بنسبة 40%']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'التثقيف والتوعية الصحية — PsyPro',
                    ],
                ],
            ],
            [
                'id' => 'tmpl_mkt_retention_checkin',
                'name' => 'patient_retention_checkin',
                'title_ar' => '🩺 متابعة واطمئنان واستبقاء المرضى',
                'category' => 'MARKETING',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'متابعة دورية واطمئنان على حالة المريض بعد فترة من انتهاء البرنامج السريري.',
                'sample_params' => ['أمين', 'المركز السريري الحديث'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'متابعة واطمئنان على صحتكم',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً {{1}}،\nنأمل أن تكون بخير وبصحة ممتازة. نود الاطمئنان على استقرار النتائج ومتابعة تحسنكم بعد زيارتكم الأخيرة لـ {{2}}.\n\nيسعدنا دائماً استقبال أي استفسار أو حجز جلسة تقييم ومتابعة دورية.",
                        'example' => [
                            'body_text' => [['أمين', 'المركز السريري الحديث']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'رعايتكم أولويتنا الدائمة',
                    ],
                    [
                        'type' => 'BUTTONS',
                        'buttons' => [
                            ['type' => 'QUICK_REPLY', 'text' => 'أرغب باستشارة متابعة'],
                            ['type' => 'QUICK_REPLY', 'text' => 'الحمد لله أنا بخير'],
                        ],
                    ],
                ],
            ],
            [
                'id' => 'tmpl_util_teletherapy_consult',
                'name' => 'teletherapy_session_consultation',
                'title_ar' => '💻 رابط جلسة الاستشارة عن بعد (Teletherapy)',
                'category' => 'UTILITY',
                'language' => 'ar',
                'status' => 'APPROVED',
                'description_ar' => 'إرسال رابط قاعة الاستشارة الرقمية المباشرة للمريض.',
                'sample_params' => ['عمر فاروق', 'عيادة الشفاء السريرية', 'https://psypro.tech/teletherapy/room-101', '10 دقائق'],
                'components' => [
                    [
                        'type' => 'HEADER',
                        'format' => 'TEXT',
                        'text' => 'جلسة استشارة سريرية عن بعد',
                    ],
                    [
                        'type' => 'BODY',
                        'text' => "مرحباً بك {{1}}،\nنود إعلامكم بجاهزية قاعة الاستشارة السريرية عن بعد لدى {{2}}.\n\nرابط الدخول المباشر للقاعة: {{3}} للانضمام للجلسة.\n\nيرجى التواجد قبل الموعد بـ {{4}} للتأكد من جودة الاتصال.",
                        'example' => [
                            'body_text' => [['عمر فاروق', 'عيادة الشفاء السريرية', 'https://psypro.tech/teletherapy/room-101', '10 دقائق']],
                        ],
                    ],
                    [
                        'type' => 'FOOTER',
                        'text' => 'العيادة الرقمية — PsyPro',
                    ],
                    [
                        'type' => 'BUTTONS',
                        'buttons' => [
                            ['type' => 'QUICK_REPLY', 'text' => 'سأنضم الآن'],
                            ['type' => 'QUICK_REPLY', 'text' => 'تأجيل الموعد'],
                        ],
                    ],
                ],
            ],
        ];
    }
}
