import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(staging_ip, username="root", pkey=k, timeout=20)

inspect_cmds = """
echo "=== DOCKER PS ==="
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"

echo "=== TRAEFIK DYNAMIC CONFIGS ==="
ls -la /etc/dokploy/traefik/dynamic/
cat /etc/dokploy/traefik/dynamic/clinic-wildcard.yml 2>/dev/null || cat /etc/dokploy/traefik/dynamic/clinic-saas.yml 2>/dev/null

echo "=== MYSQL CONTAINER INSPECTION ==="
docker inspect clinic_mysql --format '{{json .Config.Env}}' 2>/dev/null

echo "=== REDIS CONTAINER INSPECTION ==="
docker inspect clinic_redis --format '{{json .Config.Env}}' 2>/dev/null

echo "=== BACKEND .ENV DB & REDIS CONFIG ==="
grep -E '^(DB_|REDIS_|APP_ENV|APP_URL|CACHE_STORE|SESSION_DRIVER|QUEUE_CONNECTION)' /var/www/clinic-saas/backend/.env

echo "=== PHP VERSION & EXTENSIONS ==="
php -v
php -m

echo "=== NODE & NPM & PM2 ==="
node -v
npm -v
pm2 -v
"""

stdin, stdout, stderr = ssh.exec_command(inspect_cmds)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
