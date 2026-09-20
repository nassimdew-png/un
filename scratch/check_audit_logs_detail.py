import subprocess
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

script = """
import subprocess

php_code = '''
$logs = \\App\\Models\\AuditLog::where('created_at', '>=', '2026-09-13 00:00:00')->get();
echo "Logs since 2026-09-13: " . $logs->count() . "\\n";
foreach ($logs as $l) {
    echo "ID: {$l->id} | Tenant: {$l->tenant_id} | User: {$l->user_email} | Event: {$l->event_type} | Action: {$l->action} | Target: {$l->target_type} | auditable_type: {$l->auditable_type} | created_at: {$l->created_at}\\n";
}
'''

res = subprocess.run(['php', 'artisan', 'tinker', '--execute', php_code], cwd='/var/www/clinic-saas/backend', capture_output=True, text=True)
print(res.stdout)
"""

cmd = [
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST,
    "python3"
]

res = subprocess.run(cmd, input=script, capture_output=True, text=True, encoding="utf-8", errors="replace")
sys.stdout.buffer.write(res.stdout.encode('utf-8', errors='replace'))
