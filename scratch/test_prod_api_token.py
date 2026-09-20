import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = r"""
cd /var/www/clinic-saas/backend
php artisan tinker --execute="
\$user = App\Models\User::where('role', 'superadmin')->first();
\$token = \$user->createToken('prod-test')->plainTextToken;
echo 'TOKEN:' . \$token . PHP_EOL;
"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace')
print(out)

token = None
for line in out.splitlines():
    if line.startswith('TOKEN:'):
        token = line.split('TOKEN:')[1].strip()

if token:
    print("Obtained token:", token[:15] + "...")
    # Test Super Admin endpoints through Traefik
    test_cmd = f"""
curl -s -H "Authorization: Bearer {token}" -H "Accept: application/json" -H "Host: psypro.tech" http://127.0.0.1/api/super-admin/dashboard/stats
"""
    stdin, stdout, stderr = ssh.exec_command(test_cmd)
    res = stdout.read().decode('utf-8', errors='replace')
    print("\nAPI Response from /api/super-admin/dashboard/stats:")
    print(res[:500])

ssh.close()
