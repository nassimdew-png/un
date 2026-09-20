<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gw = \App\Models\CommunicationGateway::first();
$service = app(\App\Services\WhatsAppCloudApiService::class);
$list = $service->listTemplates($gw);

foreach ($list['templates'] as $t) {
    if ($t['name'] === 'session_homework_summary') {
        echo json_encode($t, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
        break;
    }
}
