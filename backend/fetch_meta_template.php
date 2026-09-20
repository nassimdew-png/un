<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gw = \App\Models\CommunicationGateway::first();
$token = $gw->getDecryptedWhatsappToken();
$wabaId = $gw->whatsapp_business_account_id;

$res = \Illuminate\Support\Facades\Http::withToken($token)->get("https://graph.facebook.com/v20.0/{$wabaId}/message_templates?name=appointment_reminder_v2");
echo "Meta Graph API Response for appointment_reminder_v2:" . PHP_EOL;
echo json_encode($res->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
