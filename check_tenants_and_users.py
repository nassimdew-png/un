import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    cmd = """
cd /var/www/clinic-saas/backend
php artisan tinker --execute="
\$tenants = \\App\\Models\\Tenant::all();
echo 'TENANTS:' . PHP_EOL;
foreach (\$tenants as \$t) {
    echo 'Tenant ID: ' . \$t->id . ' | Name: ' . \$t->name . ' | Subdomain: ' . \$t->subdomain . PHP_EOL;
}
\$users = \\App\\Models\\User::all();
echo 'USERS:' . PHP_EOL;
foreach (\$users as \$u) {
    echo 'User ID: ' . \$u->id . ' | Email: ' . \$u->email . ' | Tenant: ' . \$u->tenant_id . ' | Role: ' . \$u->role . PHP_EOL;
}
"
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    with open("tenants_and_users.txt", "w", encoding="utf-8") as f:
        f.write(res.stdout)
    print("Results written to tenants_and_users.txt")

if __name__ == "__main__":
    main()
