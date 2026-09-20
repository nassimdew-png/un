import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

remote_cmd = """
set -e
cd /var/www/clinic-saas/backend
echo "=== 1. Clearing Laravel caches ==="
php artisan optimize:clear
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

echo "=== 2. Re-caching config & routes for high performance ==="
php artisan config:cache || true
php artisan route:cache || true

echo "=== 3. Restarting PM2 processes ==="
pm2 restart 0
pm2 restart 1
pm2 restart 2

echo "=== 4. PM2 Status ==="
pm2 status
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True, encoding='utf-8', errors='replace')
print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
