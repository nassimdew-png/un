import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

bash_cmd = """cd /var/www/clinic-saas/backend && php artisan tinker --execute='
$tenant = App\\Models\\Tenant::find("c4e72bc0-c41c-47c7-8009-d8e6642fcd41");
echo "Tenant: " . ($tenant ? $tenant->name : "not found") . PHP_EOL;
$user = App\\Models\\User::where("tenant_id", "c4e72bc0-c41c-47c7-8009-d8e6642fcd41")->first();
if ($user) {
    echo "User: " . $user->email . " | Role: " . $user->role . " | ID: " . $user->id . PHP_EOL;
    $token = $user->createToken("test_token")->plainTextToken;
    echo "Token: " . $token . PHP_EOL;
}
'"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST,
    bash_cmd
], capture_output=True, text=True)

print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
