import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_test = """<?php
require '/var/www/clinic-saas/backend/vendor/autoload.php';
$app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$tenant = App\\Models\\Tenant::first();
$targetUser = App\\Models\\User::where('tenant_id', $tenant->id)->first();

echo "Target User: " . $targetUser->email . " (role: " . $targetUser->role . ", is_super_admin: " . ($targetUser->is_super_admin ? 'true' : 'false') . ")\\n";

$token = $targetUser->createToken('test_impersonation')->plainTextToken;

// Now curl /api/audit-logs with this token
$ch = curl_init('http://127.0.0.1:8000/api/audit-logs');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\\n";
echo "Response: " . $response . "\\n";
"""

p = subprocess.Popen([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST,
    "cat > /tmp/test_audit_api.php && php /tmp/test_audit_api.php && rm /tmp/test_audit_api.php"
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')

stdout, stderr = p.communicate(input=php_test)
print("STDOUT:\n", stdout)
if stderr:
    print("STDERR:\n", stderr)
