<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CommunicationGateway;
use App\Models\Patient;
use App\Models\Tenant;
use App\Services\WhatsAppCloudApiService;
use Illuminate\Support\Str;

$targetPhone = $argv[1] ?? '0556698975';

$patient = Patient::first();
if (!$patient) {
    echo "No patient found\n";
    exit(1);
}

if (empty($patient->portal_access_token)) {
    $patient->portal_access_token = Str::random(32);
    $patient->portal_enabled = true;
    $patient->save();
}

$tenant = Tenant::first();
$clinicName = $tenant ? $tenant->name : 'Cabinet Orthophonie Alger';
$patientName = $patient->first_name . ' ' . $patient->last_name;

$validPortalUrl = "https://psypro.tech/portal/" . $patient->portal_access_token;

echo "Target Phone: " . $targetPhone . "\n";
echo "Patient: " . $patientName . "\n";
echo "Clinic: " . $clinicName . "\n";
echo "Portal URL: " . $validPortalUrl . "\n\n";

$bodyParams = [
    $patientName,
    $clinicName,
    "برنامج التمارين المنزلية: 1️⃣ مخارج حرفي الراء واللام (10 دقائق) • 2️⃣ تقنية الإطالة الصوتية في بداية الكلمات • 3️⃣ بطاقات التمييز السمعي المسائية",
    $validPortalUrl,
];

$gw = CommunicationGateway::first();
echo "Sending Meta Template 'session_homework_summary' (ar)...\n";

$res = WhatsAppCloudApiService::sendCategorizedTemplate(
    toPhone: $targetPhone,
    templateName: 'session_homework_summary',
    languageCode: 'ar',
    bodyParams: $bodyParams,
    headerParams: [],
    buttonParams: [],
    gateway: $gw
);

echo "\nResult:\n" . json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
