<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gw = \App\Models\CommunicationGateway::first();
echo "Gateway WABA ID: " . ($gw ? $gw->whatsapp_business_account_id : "None") . PHP_EOL;
echo "Gateway Phone Number ID: " . ($gw ? $gw->whatsapp_phone_number_id : "None") . PHP_EOL;

$service = app(\App\Services\WhatsAppCloudApiService::class);
$syncRes = $service->syncDefaultTemplates($gw);
echo "Sync Result:" . PHP_EOL . json_encode($syncRes, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;

$listRes = $service->listTemplates($gw);
echo "List Result Meta Count: " . ($listRes['meta_count'] ?? 0) . PHP_EOL;
echo "List Templates:" . PHP_EOL . json_encode(array_map(function($t) {
    return ['name' => $t['name'], 'status' => $t['status'] ?? 'N/A', 'category' => $t['category'] ?? 'N/A', 'is_synced' => $t['is_synced'] ?? false];
}, $listRes['templates'] ?? []), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
