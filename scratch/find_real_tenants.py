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
use App\Models\User;

echo "=== NON-GENERATED / SUSPECTED REAL TENANTS ===\n";
foreach (Tenant::all() as $t) {
    // Check if tenant does NOT end with pattern like -(123) or random 4-char suffix
    $isGenerated = preg_match("/\(\d+\)$/", $t->name) || preg_match("/-[a-z0-9]{4}$/", $t->subdomain);
    if (!$isGenerated) {
        $owner = User::withoutGlobalScopes()->where("tenant_id", $t->id)->first();
        $email = $owner ? $owner->email : "None";
        echo "ID: {$t->id} | Name: {$t->name} | Subdomain: {$t->subdomain} | Status: {$t->status} | Owner Email: {$email}\n";
    }
}

echo "\n=== SUPERADMIN USERS ===\n";
foreach (User::withoutGlobalScopes()->where("role", "superadmin")->orWhere("is_super_admin", true)->get() as $u) {
    echo "ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | TenantID: {$u->tenant_id}\n";
}
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, inspect_cmd], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)
