import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

inspect_cmd = r"""
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Tenant;
use App\Models\Patient;
use App\Models\User;

echo "=== TENANTS COUNT ===\n";
echo "Total tenants: " . Tenant::count() . "\n";
echo "Trial tenants: " . Tenant::where("status", "trial")->count() . "\n";
echo "Active tenants: " . Tenant::where("status", "active")->count() . "\n";
echo "Sandbox tenants: " . Tenant::where("is_sandbox_clone", true)->count() . "\n\n";

echo "=== ALL TENANTS LIST ===\n";
foreach (Tenant::all() as $t) {
    $patientCount = Patient::withoutGlobalScopes()->where("tenant_id", $t->id)->count();
    $userCount = User::withoutGlobalScopes()->where("tenant_id", $t->id)->count();
    echo "ID: {$t->id} | Name: {$t->name} | Subdomain: {$t->subdomain} | Status: {$t->status} | Patients: {$patientCount} | Users: {$userCount}\n";
}

echo "\n=== PATIENTS TOTAL COUNT ===\n";
echo "Total patients: " . Patient::withoutGlobalScopes()->count() . "\n";
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, inspect_cmd], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
