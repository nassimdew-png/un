import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY)

commands = [
    ("Backend cache & storage link", """
cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan storage:link
"""),
    ("Frontend Build", """
cd /var/www/clinic-saas/frontend
npm run build
"""),
    ("PM2 Launch", """
pm2 delete all || true

pm2 start /var/www/clinic-saas/backend/artisan --name "clinic-backend" --interpreter php -- serve --host 0.0.0.0 --port 8000
pm2 start /var/www/clinic-saas/frontend/node_modules/.bin/vite --name "clinic-frontend" -- preview --host 0.0.0.0 --port 3001
pm2 start /var/www/clinic-saas/backend/artisan --name "clinic-queue" --interpreter php -- queue:work --sleep=3 --tries=3

pm2 save
pm2 startup systemd -u root --hp /root || true
sleep 3
pm2 list
"""),
    ("Smoke Testing Direct & Traefik", """
echo "=== Direct Backend Port 8000 ==="
curl -sI http://127.0.0.1:8000/up | head -n 5

echo "=== Direct Frontend Port 3001 ==="
curl -sI http://127.0.0.1:3001/ | head -n 5

echo "=== Traefik Health Route ==="
curl -sI http://127.0.0.1/up | head -n 5

echo "=== Traefik Main Domain Host ==="
curl -sI -H "Host: psypro.tech" http://127.0.0.1/ | head -n 5

echo "=== Traefik Subdomain Host ==="
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/ | head -n 5

echo "=== Traefik Subdomain API ==="
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/api/health 2>&1 | head -n 5
""")
]

for title, cmd in commands:
    print(f"\n{'='*50}\n>> {title}\n{'='*50}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(1024).decode('utf-8', errors='replace')
            sys.stdout.write(chunk)
            sys.stdout.flush()
        if stderr.channel.recv_stderr_ready():
            chunk = stderr.channel.recv_stderr(1024).decode('utf-8', errors='replace')
            sys.stderr.write(chunk)
            sys.stderr.flush()
        time.sleep(0.1)
        
    exit_code = stdout.channel.recv_exit_status()
    chunk = stdout.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stdout.write(chunk)
    chunk = stderr.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stderr.write(chunk)
    print(f"\n[Exit: {exit_code}]")

ssh.close()
