import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

bash_cmd = """cd /var/www/clinic-saas/backend && php artisan tinker --execute='
$logs = App\\Models\\AuditLog::where("event_type", "like", "%impersonat%")->get();
echo "Count: " . $logs->count() . PHP_EOL;
foreach ($logs as $log) {
    echo "ID: " . $log->id . " | Tenant: " . $log->tenant_id . " | Email: " . $log->user_email . " | Name: " . $log->user_name . " | Action: " . $log->action . " | TargetType: " . $log->target_type . " | AuditableType: " . $log->auditable_type . " | Date: " . $log->created_at . PHP_EOL;
}
'"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST,
    bash_cmd
], capture_output=True, text=True)

print("STDOUT:\n", res.stdout)
print("STDERR:\n", res.stderr)
