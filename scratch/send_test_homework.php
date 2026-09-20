<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\CommunicationGateway;
use App\Models\Patient;
use App\Models\Tenant;
use App\Services\WhatsAppCloudApiService;

$targetPhone = '0562690920';

// Pick or create demo patient for valid portal link
$patient = Patient::first();
$patientName = $patient ? ($patient->first_name . ' ' . $patient->last_name) : 'يانيس مزياني';
$patientPin = $patient && $patient->kiosk_pin ? $patient->kiosk_pin : '123456';

$tenant = Tenant::first();
$clinicName = $tenant ? $tenant->name : 'Cabinet Orthophonie & Psychologie Alger';

// Build valid portal link
$validUrl = "https://psypro.tech/p/" . $patientPin;

echo "Target Phone: " . $targetPhone . "\n";
echo "Patient: " . $patientName . "\n";
echo "Clinic: " . $clinicName . "\n";
echo "Valid Link: " . $validUrl . "\n\n";

$bodyParams = [
    $patientName,
    $clinicName,
    "تمارين مخارج الحروف والطلاقة الكلامية (حرفي الراء واللام) + تدريب التنفس الحجابي 15 دقيقة يومياً",
    $validUrl,
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
