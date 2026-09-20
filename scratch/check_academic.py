import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_code = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$exists = Illuminate\\Support\\Facades\\Schema::hasTable('academic_verifications');
echo "Table academic_verifications exists: " . ($exists ? "YES" : "NO") . "\\n";
if ($exists) {
    echo "Columns: " . implode(', ', Illuminate\\Support\\Facades\\Schema::getColumnListing('academic_verifications')) . "\\n";
    echo "Total rows: " . Illuminate\\Support\\Facades\\DB::table('academic_verifications')->count() . "\\n";
}

$settings = Illuminate\\Support\\Facades\\Schema::hasTable('system_settings');
echo "Table system_settings exists: " . ($settings ? "YES" : "NO") . "\\n";

$plans = Illuminate\\Support\\Facades\\DB::table('subscription_plans')->get(['id', 'name', 'slug']);
echo "Subscription plans: " . json_encode($plans, JSON_UNESCAPED_UNICODE) . "\\n";
"""

with open(r"E:\3\scratch\check_academic.php", "w", encoding="utf-8") as f:
    f.write(php_code)

scp_cmd = [r"C:\Windows\System32\OpenSSH\scp.exe", "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", r"E:\3\scratch\check_academic.php", f"{HOST}:/var/www/clinic-saas/backend/check_academic.php"]
subprocess.run(scp_cmd, check=True)

ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "php /var/www/clinic-saas/backend/check_academic.php && rm /var/www/clinic-saas/backend/check_academic.php"]
res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
