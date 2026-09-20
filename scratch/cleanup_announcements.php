<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SystemAnnouncement;

$dup = SystemAnnouncement::where('id', 2)->first();
if ($dup) {
    $dup->delete();
    echo "Deleted duplicate announcement ID 2 successfully.\n";
} else {
    echo "Duplicate not found or already deleted.\n";
}

$remaining = SystemAnnouncement::all();
echo "Remaining announcements count: " . count($remaining) . "\n";
