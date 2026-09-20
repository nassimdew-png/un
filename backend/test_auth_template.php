<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gw = \App\Models\CommunicationGateway::first();
$wabaId = $gw->whatsapp_business_account_id;
$token = $gw->getDecryptedWhatsappToken();

echo "Testing Meta Authentication Template creation on WABA: {$wabaId}..." . PHP_EOL;

$payload = [
    'name' => 'staff_auth_otp_code',
    'category' => 'AUTHENTICATION',
    'language' => 'ar',
    'components' => [
        [
            'type' => 'BODY',
            'add_security_recommendation' => true,
        ],
        [
            'type' => 'FOOTER',
            'code_expiration_minutes' => 5,
        ],
        [
            'type' => 'BUTTONS',
            'buttons' => [
                [
                    'type' => 'OTP',
                    'otp_type' => 'COPY_CODE',
                ],
            ],
        ],
    ],
];

$url = "https://graph.facebook.com/v20.0/{$wabaId}/message_templates";
$response = \Illuminate\Support\Facades\Http::withToken($token)->timeout(15)->post($url, $payload);

echo "HTTP Status: " . $response->status() . PHP_EOL;
echo "Response Body:" . PHP_EOL . json_encode($response->json() ?: $response->body(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
