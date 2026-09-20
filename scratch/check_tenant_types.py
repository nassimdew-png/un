import subprocess
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

script = """
import subprocess

php_code = '''
$tenants = \\App\\Models\\Tenant::take(10)->get();
foreach ($tenants as $t) {
    echo "ID: " . var_export($t->id, true) . " (type: " . gettype($t->id) . ") | Name: {$t->name} | Subdomain: {$t->subdomain}\\n";
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
print("CODE:", res.returncode)
sys.stdout.buffer.write(res.stdout.encode('utf-8', errors='replace'))
