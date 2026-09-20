<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$exists = Illuminate\Support\Facades\Schema::hasTable('academic_verifications');
echo "Table academic_verifications exists: " . ($exists ? "YES" : "NO") . "\n";
if ($exists) {
    echo "Columns: " . implode(', ', Illuminate\Support\Facades\Schema::getColumnListing('academic_verifications')) . "\n";
    echo "Total rows: " . Illuminate\Support\Facades\DB::table('academic_verifications')->count() . "\n";
}

$settings = Illuminate\Support\Facades\Schema::hasTable('system_settings');
echo "Table system_settings exists: " . ($settings ? "YES" : "NO") . "\n";

$plans = Illuminate\Support\Facades\DB::table('subscription_plans')->get(['id', 'name', 'slug']);
echo "Subscription plans: " . json_encode($plans, JSON_UNESCAPED_UNICODE) . "\n";
