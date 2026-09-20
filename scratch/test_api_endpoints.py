import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = r"""
echo "=== 1. Health check ==="
curl -sI -H "Host: psypro.tech" http://127.0.0.1/up | head -n 5

echo "=== 2. Check Database connectivity via artisan ==="
cd /var/www/clinic-saas/backend
php artisan tinker --execute="echo 'Tenants: ' . App\Models\Tenant::count() . ' | Users: ' . App\Models\User::count() . ' | Plans: ' . App\Models\SubscriptionPlan::count() . PHP_EOL;"

echo "=== 3. Public landing page HTML ==="
curl -s -H "Host: psypro.tech" http://127.0.0.1/ | head -n 15

echo "=== 4. Test Clinic subdomains resolving ==="
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/ | head -n 5
curl -sI -H "Host: cabinet-alger.psypro.tech" http://127.0.0.1/ | head -n 5
curl -sI -H "Host: constantine-sante.psypro.tech" http://127.0.0.1/ | head -n 5
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
