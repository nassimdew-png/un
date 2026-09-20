import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    remote_test = r"""
cat << 'EOF' > /tmp/check_user.php
<?php
require '/var/www/clinic-saas/backend/vendor/autoload.php';
$app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\User::where('email', 'nassimdew00@gmail.com')->first();
if ($user) {
    echo "USER FOUND:\n";
    echo "ID: " . $user->id . "\n";
    echo "NAME: " . $user->name . "\n";
    echo "EMAIL: " . $user->email . "\n";
    echo "ROLE: " . $user->role . "\n";
    echo "PERMISSIONS: " . json_encode($user->permissions) . "\n";
    echo "TENANT_ID: " . $user->tenant_id . "\n";
} else {
    echo "User nassimdew00@gmail.com NOT found. Listing last 5 users:\n";
    foreach (App\Models\User::latest()->take(5)->get() as $u) {
        echo "- ID: {$u->id} | Name: {$u->name} | Email: {$u->email} | Role: {$u->role}\n";
    }
}
EOF
php /tmp/check_user.php && rm -f /tmp/check_user.php
"""
    cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_test]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

if __name__ == "__main__":
    main()
