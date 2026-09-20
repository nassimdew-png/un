<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;
use App\Models\Patient;
use App\Models\Appointment;

$user = User::first();
$tenant = Tenant::first();
$token = $user->createToken('test-waiting-kiosk')->plainTextToken;

// Find or ensure a test patient with a known kiosk PIN
$patient = Patient::first();
if (!$patient) {
    $patient = Patient::create([
        'first_name' => 'يوسف',
        'last_name' => 'بن عيسى',
        'phone' => '0555001122',
        'birth_date' => '2018-05-15',
        'gender' => 'male',
        'kiosk_pin' => '789123',
    ]);
} else if (empty($patient->kiosk_pin)) {
    $patient->kiosk_pin = '789123';
    $patient->save();
}

$kioskPin = $patient->kiosk_pin;

echo "User: " . $user->email . "\n";
echo "Tenant ID: " . ($tenant ? $tenant->id : 'none') . "\n";
echo "Test Patient: " . $patient->first_name . " " . $patient->last_name . " (PIN: " . $kioskPin . ")\n\n";

function callApi($url, $method = 'POST', $data = [], $token = '', $tenantId = '') {
    $ch = curl_init($url);
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json',
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    if ($tenantId) {
        $headers[] = 'X-Tenant-ID: ' . $tenantId;
        $headers[] = 'X-Tenant: ' . $tenantId;
    }

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    if (!empty($data) || $method === 'POST' || $method === 'PUT') {
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($response, true), 'raw' => $response];
}

$baseUrl = 'http://127.0.0.1:8000/api';
$tenantId = $tenant ? $tenant->id : '';

echo "========================================================\n";
echo "1. Testing POST /api/clinic/waiting-list (Add New Waitlist Entry)\n";
$res1 = callApi("$baseUrl/clinic/waiting-list", 'POST', [
    'patient_name' => 'سفيان بن علي',
    'phone' => '0555123456',
    'specialty_needed' => 'orthophonie',
    'urgency_level' => 'high',
    'preferred_days' => ['الأحد', 'الثلاثاء', 'الخميس'],
    'notes' => 'حالة تأتأة نمائية وصعوبة بلع بحاجة لموعد قريب'
], $token, $tenantId);

echo "Status: " . $res1['status'] . "\n";
echo "Success: " . (isset($res1['body']['success']) && $res1['body']['success'] ? 'true' : 'false') . "\n";
echo "Message: " . ($res1['body']['message'] ?? 'N/A') . "\n";
echo "Entry ID: " . ($res1['body']['entry']['id'] ?? 'N/A') . "\n";

echo "\n========================================================\n";
echo "2. Testing GET /api/clinic/waiting-list (Verify retrieval)\n";
$res2 = callApi("$baseUrl/clinic/waiting-list", 'GET', [], $token, $tenantId);
echo "Status: " . $res2['status'] . "\n";
echo "Waitlist entries count: " . count($res2['body']['waiting_list'] ?? []) . "\n";
echo "Stats Total: " . ($res2['body']['stats']['total'] ?? 0) . ", Pending: " . ($res2['body']['stats']['pending'] ?? 0) . "\n";

echo "\n========================================================\n";
echo "3. Testing POST /api/kiosk/check-in with INVALID PIN (e.g. 000000)\n";
$res3 = callApi("$baseUrl/kiosk/check-in", 'POST', [
    'kiosk_pin' => '000000',
    'subdomain' => 'elbiar-ortho'
]);
echo "Status: " . $res3['status'] . " (Expected: 404 Not Found, NO 500 Server Error)\n";
echo "Success: " . (isset($res3['body']['success']) && $res3['body']['success'] ? 'true' : 'false') . "\n";
echo "Message: " . ($res3['body']['message'] ?? 'N/A') . "\n";

echo "\n========================================================\n";
echo "4. Testing POST /api/kiosk/check-in with VALID PIN ($kioskPin)\n";
$res4 = callApi("$baseUrl/kiosk/check-in", 'POST', [
    'kiosk_pin' => (string)$kioskPin,
    'subdomain' => 'elbiar-ortho'
]);
echo "Status: " . $res4['status'] . " (Expected: 200 OK)\n";
echo "Success: " . (isset($res4['body']['success']) && $res4['body']['success'] ? 'true' : 'false') . "\n";
echo "Message: " . ($res4['body']['message'] ?? 'N/A') . "\n";
echo "Patient Name: " . ($res4['body']['patient']['name'] ?? 'N/A') . "\n";
echo "Appointment Time: " . ($res4['body']['patient']['appointment_time'] ?? 'N/A') . "\n";

echo "\n========================================================\n";
echo "5. Testing GET /api/clinic/today-agenda-summary (Check Live Waiting Room Reception)\n";
$res5 = callApi("$baseUrl/clinic/today-agenda-summary", 'GET', [], $token, $tenantId);
echo "Status: " . $res5['status'] . "\n";
echo "Waiting Room Patients: " . count($res5['body']['waiting_room'] ?? []) . "\n";
if (!empty($res5['body']['waiting_room'])) {
    foreach ($res5['body']['waiting_room'] as $w) {
        $pName = $w['patient']['first_name'] ?? $w['patient_name'] ?? 'Unknown';
        echo " - Waiting Patient in Salle d'Attente: $pName (Status: " . $w['status'] . ")\n";
    }
}

echo "\n========================================================\n";
echo "ALL WAITING ROOM & KIOSK TESTS FINISHED\n";
