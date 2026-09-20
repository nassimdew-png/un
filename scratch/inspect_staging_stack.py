import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

OLD_HOST = "root@145.223.116.54"
SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

inspect_cmd = """
echo "=== 1. PHP Version & Extensions ==="
php -v
php -m

echo "=== 2. Node & NPM & PM2 ==="
node -v
npm -v
pm2 list

echo "=== 3. Webserver & Reverse Proxy ==="
which nginx || true
which caddy || true
which traefik || true
docker ps 2>/dev/null || true

echo "=== 4. Database Setup ==="
which mysql || true
systemctl status mysql --no-pager 2>/dev/null || true
systemctl status mariadb --no-pager 2>/dev/null || true

echo "=== 5. Nginx config or Traefik config ==="
ls -la /etc/nginx/sites-enabled/ 2>/dev/null || true
cat /etc/nginx/sites-enabled/* 2>/dev/null | head -n 40 || true
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", OLD_HOST, inspect_cmd], capture_output=True, text=False)
print(res.stdout.decode('utf-8', errors='replace'))
if res.stderr:
    print("STDERR:", res.stderr.decode('utf-8', errors='replace'))
