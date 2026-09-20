import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_ssh(remote_cmd):
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)

print("=== Checking Route List for rotate-token & parent portal ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan route:list --name=sovereign_tower.rotate_token && php artisan route:list --name=parent_portal.list_links")

print("\n=== Checking System Diagnostic Table ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"echo 'Diagnostic table exists: ' . (Schema::hasTable('system_error_diagnostics') ? 'YES' : 'NO') . PHP_EOL;\"")
