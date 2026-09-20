import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    cmd = """
cd /var/www/clinic-saas/backend
php artisan tinker --execute="
\$amiras = \\App\\Models\\Patient::where('first_name', 'like', '%أميرة%')
    ->orWhere('first_name', 'like', '%اميرة%')
    ->orWhere('last_name', 'like', '%غربي%')
    ->get();
echo 'AMIRA / GHARBI MATCHES: ' . \$amiras->count() . PHP_EOL;
foreach (\$amiras as \$p) {
    echo 'ID: ' . \$p->id . ' | Tenant: ' . \$p->tenant_id . ' | Name: ' . \$p->first_name . ' ' . \$p->last_name . ' | Phone: ' . \$p->phone . PHP_EOL;
}
"
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    with open("find_amira_results.txt", "w", encoding="utf-8") as f:
        f.write(res.stdout)
        if res.stderr:
            f.write("\nSTDERR:\n" + res.stderr)
    print("Done")

if __name__ == "__main__":
    main()
