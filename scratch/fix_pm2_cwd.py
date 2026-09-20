import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = """
pm2 delete all || true

pm2 start /var/www/clinic-saas/backend/artisan --name "clinic-backend" --cwd /var/www/clinic-saas/backend --interpreter php -- serve --host 0.0.0.0 --port 8000
pm2 start /var/www/clinic-saas/frontend/node_modules/.bin/vite --name "clinic-frontend" --cwd /var/www/clinic-saas/frontend -- preview --host 0.0.0.0 --port 3001
pm2 start /var/www/clinic-saas/backend/artisan --name "clinic-queue" --cwd /var/www/clinic-saas/backend --interpreter php -- queue:work --sleep=3 --tries=3

pm2 save
sleep 3
pm2 list

echo "=== Test 1: Direct 3001 localhost ==="
curl -sI http://127.0.0.1:3001/ | head -n 5

echo "=== Test 2: Direct 3001 with Host psypro.tech ==="
curl -sI -H "Host: psypro.tech" http://127.0.0.1:3001/ | head -n 5

echo "=== Test 3: Traefik http://127.0.0.1/ with Host psypro.tech ==="
curl -sI -H "Host: psypro.tech" http://127.0.0.1/ | head -n 10

echo "=== Test 4: Traefik http://127.0.0.1/ with Host oran-psy.psypro.tech ==="
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/ | head -n 10

echo "=== Test 5: Traefik API call ==="
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/api/super-admin/dashboard/stats 2>&1 | head -n 10
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
