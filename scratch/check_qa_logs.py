import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

bash_cmd = """cd /var/www/clinic-saas/backend && php artisan tinker --execute='
$logs = App\\Models\\AuditLog::where("tenant_id", "c4e72bc0-c41c-47c7-8009-d8e6642fcd41")->get();
echo "Clinic Logs Count: " . $logs->count() . PHP_EOL;
foreach ($logs as $log) {
    echo "ID: " . $log->id . " | Action: " . $log->action . " | Email: " . $log->user_email . " | Date: " . $log->created_at . PHP_EOL;
}
'"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST,
    bash_cmd
], capture_output=True, text=True)

print("STDOUT:\n", res.stdout)
