<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = app(\App\Services\WhatsAppCloudApiService::class);
$targetPhone = $argv[1] ?? '0562690920';
$template = $argv[2] ?? 'hello_world';
$lang = $argv[3] ?? 'en_US';

echo "Sending template '{$template}' ({$lang}) to {$targetPhone}..." . PHP_EOL;

$res = $service->sendTemplateMessage(
    toPhone: $targetPhone,
    templateName: $template,
    languageCode: $lang,
    bodyParameters: []
);

echo "Result:" . PHP_EOL . json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
