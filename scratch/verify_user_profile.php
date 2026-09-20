<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;

$user = User::first();
$tenant = Tenant::first();
$token = $user->createToken('test-profile')->plainTextToken;

echo "Testing user profile endpoints for user: " . $user->email . "\n";
echo "Initial user name: " . $user->name . ", specialty: " . ($user->specialty ?? 'none') . "\n\n";

function callApi($url, $method = 'GET', $data = [], $token = '', $tenantId = '') {
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
echo "1. Testing GET /api/user/profile\n";
$res1 = callApi("$baseUrl/user/profile", 'GET', [], $token, $tenantId);
echo "Status: " . $res1['status'] . "\n";
echo "Success: " . (isset($res1['body']['success']) && $res1['body']['success'] ? 'true' : 'false') . "\n";
echo "User Profile: " . json_encode($res1['body']['user'] ?? [], JSON_UNESCAPED_UNICODE) . "\n";

echo "\n========================================================\n";
echo "2. Testing PUT /api/user/profile (Update Name, Phone & Specialty)\n";
$res2 = callApi("$baseUrl/user/profile", 'PUT', [
    'name' => 'د. أمينة بن علي',
    'email' => $user->email,
    'phone' => '0550112233',
    'specialty' => 'أخصائي أرطوفونيا وتخاطب (Orthophoniste)',
    'specialty_license_number' => 'DZ-MSPRH-2026-884'
], $token, $tenantId);
echo "Status: " . $res2['status'] . "\n";
echo "Success: " . (isset($res2['body']['success']) && $res2['body']['success'] ? 'true' : 'false') . "\n";
echo "Message: " . ($res2['body']['message'] ?? 'N/A') . "\n";
echo "Updated User: " . json_encode($res2['body']['user'] ?? [], JSON_UNESCAPED_UNICODE) . "\n";

echo "\n========================================================\n";
echo "3. Testing PUT /api/user/password with WRONG current password\n";
$res3 = callApi("$baseUrl/user/password", 'PUT', [
    'current_password' => 'wrongpassword123',
    'new_password' => 'newSecretPass2026!',
    'new_password_confirmation' => 'newSecretPass2026!'
], $token, $tenantId);
echo "Status: " . $res3['status'] . " (Expected: 422 Unprocessable)\n";
echo "Error Message: " . ($res3['body']['message'] ?? json_encode($res3['body']['errors'] ?? [])) . "\n";

echo "\n========================================================\n";
echo "ALL USER PROFILE TESTS FINISHED\n";
