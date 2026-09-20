<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Tenant;

$user = User::first();
$tenant = Tenant::first();
$token = $user->createToken('test-summary')->plainTextToken;

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
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    $response = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return ['status' => $status, 'body' => json_decode($response, true), 'raw' => $response];
}

$baseUrl = 'http://127.0.0.1:8000/api';
$tenantId = $tenant ? $tenant->id : '';

$res = callApi("$baseUrl/clinic/today-summary", 'GET', [], $token, $tenantId);
echo "Status: " . $res['status'] . "\n";
echo "Waiting room count: " . count($res['body']['waiting_room'] ?? []) . "\n";
foreach ($res['body']['waiting_room'] ?? [] as $w) {
    $p = $w['patient']['first_name'] . ' ' . $w['patient']['last_name'];
    echo " -> Patient present in waiting room: $p (Status: " . $w['status'] . ")\n";
}
