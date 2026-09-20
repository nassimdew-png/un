import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"

php_check = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();

use App\\Models\\Tenant;
use App\\Models\\Appointment;
use Carbon\\Carbon;

$tenant = Tenant::where('subdomain', 'cabinet-alger')->first();
echo "Tenant ID: " . $tenant->id . PHP_EOL;

$apps = Appointment::where('tenant_id', $tenant->id)->with('patient')->get();
echo "Total appointments for tenant: " . $apps->count() . PHP_EOL;
foreach ($apps as $a) {
    echo "App ID: {$a->id} | Patient: " . ($a->patient ? ($a->patient->first_name . ' ' . $a->patient->last_name) : 'None') . " | Date: {$a->appointment_date} | Status: {$a->status}" . PHP_EOL;
}
"""

local_path = os.path.join(r"E:\3", "test_apps.php")
with open(local_path, "w", encoding="utf-8") as f:
    f.write(php_check)

subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_path, f"{HOST}:/tmp/test_apps.php"], check=True)
if os.path.exists(local_path):
    os.remove(local_path)

cmd = "cd /var/www/clinic-saas/backend && php /tmp/test_apps.php && rm -f /tmp/test_apps.php"
res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd], capture_output=True, encoding='utf-8', errors='replace')
print("OUTPUT:")
print(res.stdout)
