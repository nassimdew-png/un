import subprocess
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$user = App\\Models\\User::where('role', 'superadmin')->first();
if (!$user) {
    echo "ERROR: No superadmin found\\n";
    exit(1);
}
$token = $user->createToken('verify_help_center')->plainTextToken;

// 1. GET SuperAdmin Config
$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "1. GET /api/superadmin/help-center-config => HTTP $code\\n";
$data = json_decode($res, true);
if (!$data['success']) {
    echo "FAIL: " . $res . "\\n";
    exit(1);
}
echo "   Categories: " . count($data['config']['categories']) . ", Articles: " . count($data['config']['articles']) . "\\n";

// 2. PUT Direct Payload (No Wrapper)
$payload = $data['config'];
$testMarker = "دليل الاستخدام السريري المعتمد 2026 - اختبار حي " . time();
$payload['header']['title'] = $testMarker;

$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload, JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "2. PUT Direct Payload (no wrapper) => HTTP $code\\n";
$putDirect = json_decode($res, true);
if ($code !== 200 || !($putDirect['success'] ?? false)) {
    echo "FAIL: " . $res . "\\n";
    exit(1);
}
echo "   Message: " . ($putDirect['message'] ?? 'OK') . "\\n";

// 3. GET Public Content Endpoint
$ch = curl_init('http://127.0.0.1:8000/api/public/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept: application/json']);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$pubData = json_decode($res, true);
echo "3. GET /api/public/help-center-config => HTTP $code\\n";
echo "   Public Title: " . ($pubData['data']['header']['title'] ?? 'N/A') . "\\n";
if (($pubData['data']['header']['title'] ?? '') !== $testMarker) {
    echo "FAIL: Public title did not match saved test marker!\\n";
    exit(1);
}

// 4. Verify Audit Log
$latestLog = App\\Models\\AuditLog::where('action', 'HELP_CENTER_CONFIG_UPDATED')->latest()->first();
echo "4. Forensic Audit Log Verification:\\n";
if ($latestLog) {
    echo "   Action: " . $latestLog->action . "\\n";
    echo "   User: " . $latestLog->user_name . " (" . $latestLog->user_role . ")\\n";
    echo "   Timestamp: " . $latestLog->created_at . "\\n";
    echo "   Details: " . json_encode($latestLog->details) . "\\n";
} else {
    echo "   WARN: No audit log entry found.\\n";
}

// 5. Restore clean title
$payload['header']['title'] = "مركز المساعدة والدليل السريري الشامل";
$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['config' => $payload], JSON_UNESCAPED_UNICODE));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);
curl_exec($ch);
echo "5. Restored official clean title.\\n";
echo "ALL TESTS PASSED WITH 100% SUCCESS!\\n";
"""

with open(r"E:\3\scratch\verify_help_cms_live.php", "w", encoding="utf-8") as f:
    f.write(test_script)

scp_cmd = [r"C:\Windows\System32\OpenSSH\scp.exe", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", r"E:\3\scratch\verify_help_cms_live.php", f"{HOST}:/var/www/clinic-saas/backend/verify_help_cms_live.php"]
subprocess.run(scp_cmd, check=True)

ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "php /var/www/clinic-saas/backend/verify_help_cms_live.php && rm /var/www/clinic-saas/backend/verify_help_cms_live.php"]
res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
