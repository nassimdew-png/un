import subprocess
import os
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'
HOST = 'root@145.223.116.54'
SSH_BIN = r'C:\Windows\System32\OpenSSH\ssh.exe'
SCP_BIN = r'C:\Windows\System32\OpenSSH\scp.exe'

php_code = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();

use Illuminate\\Support\\Facades\\DB;
use App\\Models\\Tenant;
use App\\Models\\User;

echo "=== ALL TENANTS IN DB ===" . PHP_EOL;
$tenants = Tenant::all();
foreach ($tenants as $t) {
    echo "ID: {$t->id} | Name: {$t->name} | Subdomain: '{$t->subdomain}' | Status: {$t->status} | Type: {$t->type} | Plan: {$t->plan_id}" . PHP_EOL;
}

echo PHP_EOL . "=== USERS (CLINIC USERS) ===" . PHP_EOL;
$users = User::all();
foreach ($users as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role} | Tenant: {$u->tenant_id}" . PHP_EOL;
}
"""

local_path = os.path.join(r"E:\3", "test_runner.php")
with open(local_path, "w", encoding="utf-8") as f:
    f.write(php_code)

subprocess.run([SCP_BIN, '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', local_path, f'{HOST}:/var/www/clinic-saas/backend/test_runner.php'], capture_output=True)
if os.path.exists(local_path):
    os.remove(local_path)

cmd = "cd /var/www/clinic-saas/backend && php test_runner.php && rm -f test_runner.php"
res = subprocess.run([SSH_BIN, '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', HOST, cmd], capture_output=True, encoding='utf-8', errors='replace')
print("STDOUT:")
print(res.stdout)
print("STDERR:")
print(res.stderr)
