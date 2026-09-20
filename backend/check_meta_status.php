<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$gw = \App\Models\CommunicationGateway::first();
$service = app(\App\Services\WhatsAppCloudApiService::class);
$list = $service->listTemplates($gw);

echo "=== TEMPLATES STATUS IN META ===" . PHP_EOL;
$approved = [];
$pending = [];
$rejected = [];

foreach ($list['templates'] as $t) {
    $st = $t['status'] ?? 'N/A';
    $name = $t['name'];
    $cat = $t['category'] ?? 'N/A';
    if ($st === 'APPROVED') {
        $approved[] = "✅ {$name} ({$cat})";
    } elseif ($st === 'PENDING') {
        $pending[] = "⏳ {$name} ({$cat})";
    } else {
        $rejected[] = "❌ {$name} ({$cat}) -> {$st}";
    }
}

echo "APPROVED (" . count($approved) . "):" . PHP_EOL . implode(PHP_EOL, $approved) . PHP_EOL . PHP_EOL;
echo "PENDING (" . count($pending) . "):" . PHP_EOL . implode(PHP_EOL, $pending) . PHP_EOL . PHP_EOL;
echo "OTHERS (" . count($rejected) . "):" . PHP_EOL . implode(PHP_EOL, $rejected) . PHP_EOL;
