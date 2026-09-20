import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_script = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$user = App\\Models\\User::where('role', 'superadmin')->first();
$token = $user->createToken('test_cms')->plainTextToken;

// 1. GET
$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json'
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "GET code: $code\\n";
$data = json_decode($res, true);
echo "Articles count: " . count($data['config']['articles'] ?? []) . "\\n";

// 2. PUT test with {config: ...}
$payload = $data['config'];
$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['config' => $payload]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "PUT with {config: ...} code: $code\\n";
$putRes = json_decode($res, true);
echo "PUT success: " . ($putRes['success'] ? 'true' : 'false') . "\\n";

// 3. PUT without wrapper
$ch = curl_init('http://127.0.0.1:8000/api/superadmin/help-center-config');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
    'Content-Type: application/json'
]);
$res = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "PUT direct (no wrapper) code: $code\\n";
echo "PUT direct res: " . substr($res, 0, 150) . "\\n";
"""

with open(r"E:\3\scratch\remote_test.php", "w", encoding="utf-8") as f:
    f.write(php_script)

scp_cmd = [r"C:\Windows\System32\OpenSSH\scp.exe", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", r"E:\3\scratch\remote_test.php", f"{HOST}:/var/www/clinic-saas/backend/remote_test.php"]
subprocess.run(scp_cmd, check=True)

ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "php /var/www/clinic-saas/backend/remote_test.php && rm /var/www/clinic-saas/backend/remote_test.php"]
res = subprocess.run(ssh_cmd, capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
