import urllib.request
import json
import ssl
import sys
import subprocess

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# 1. Fetch current status
url = "https://psypro.tech/api/public/registration-status"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        data = json.loads(r.read().decode('utf-8'))
        print("Initial registration status:", data)
except Exception as e:
    print("Error fetching status:", e)

# 2. Test toggle via artisan / php script on server
SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_cmd = """
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SystemSetting;

echo "Current setting: " . SystemSetting::get("registration_disabled", "0") . "\n";
SystemSetting::set("registration_disabled", "1");
echo "Updated setting to 1: " . SystemSetting::get("registration_disabled") . "\n";
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, test_cmd], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)

# 3. Fetch status again
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        data = json.loads(r.read().decode('utf-8'))
        print("Status after pausing:", data)
        assert data.get('is_disabled') == True, "Expected is_disabled to be True"
        print("PASS: Registration is properly paused!")
except Exception as e:
    print("Error:", e)

# 4. Try registration while paused
post_url = "https://psypro.tech/api/public/register-clinic"
payload = json.dumps({
    "clinic_name": "Test Clinic",
    "owner_name": "Test Doctor",
    "email": "test-blocked@example.com",
    "phone": "0550000000",
    "password": "password123",
    "specialty": "orthophonie",
    "wilaya": "16 - Alger"
}).encode('utf-8')

post_req = urllib.request.Request(post_url, data=payload, headers={
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0'
})

try:
    urllib.request.urlopen(post_req, context=ctx)
    print("FAIL: Registration succeeded but should have been blocked!")
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8')
    print(f"PASS: Registration rejected with HTTP {e.code}: {body}")

# 5. Restore back to enabled
restore_cmd = """
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SystemSetting;
SystemSetting::set("registration_disabled", "0");
echo "Restored setting to 0: " . SystemSetting::get("registration_disabled") . "\n";
'
"""
res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, restore_cmd], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)

# 6. Verify restored
try:
    with urllib.request.urlopen(req, context=ctx) as r:
        data = json.loads(r.read().decode('utf-8'))
        print("Status after restoring:", data)
        assert data.get('is_disabled') == False, "Expected is_disabled to be False"
        print("PASS: Registration restored to open!")
except Exception as e:
    print("Error:", e)
