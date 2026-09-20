import subprocess
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

remote_cmd = """
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$count = App\Models\AcademicVerification::count();
echo "Total Academic Verifications in DB: " . $count . PHP_EOL;

$v = App\Models\AcademicVerification::latest()->first();
if ($v) {
    echo "ID: " . $v->id . PHP_EOL;
    echo "Name: " . $v->student_name . PHP_EOL;
    echo "Email: " . $v->email . PHP_EOL;
    echo "Specialty: " . $v->specialty . PHP_EOL;
    echo "Degree: " . $v->degree_level . PHP_EOL;
    echo "Status: " . $v->status . PHP_EOL;
    echo "Expires: " . $v->expires_at . PHP_EOL;
    echo "Discount Code: " . $v->discount_code . PHP_EOL;
    echo "Tenant ID: " . $v->sandbox_tenant_id . PHP_EOL;
}
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True, encoding="utf-8")
print(res.stdout)
if res.stderr:
    print("Errors:", res.stderr)
