<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$anns = \App\Models\SystemAnnouncement::all();
echo "Count: " . count($anns) . "\n";
echo json_encode($anns, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
