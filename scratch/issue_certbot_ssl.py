import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY)

cmd = """
echo "=== 1. Temporarily stopping dokploy-traefik to free port 80 ==="
docker stop dokploy-traefik

echo "=== 2. Requesting Let's Encrypt certificates via Certbot ==="
certbot certonly --standalone \
  -d psysnap.com \
  -d www.psysnap.com \
  -d oran-psy.psysnap.com \
  -d cabinet-alger.psysnap.com \
  -d cabinet-el-amel.psysnap.com \
  -d constantine-sante.psysnap.com \
  -d annaba-ortho.psysnap.com \
  -d elbiar-ortho.psysnap.com \
  --non-interactive \
  --agree-tos \
  --email admin@psypro.tech \
  --preferred-challenges http

echo "=== 3. Checking certificate files ==="
ls -la /etc/letsencrypt/live/psysnap.com/

echo "=== 4. Copying certs to Traefik accessible path ==="
mkdir -p /etc/dokploy/traefik/certs
cp /etc/letsencrypt/live/psysnap.com/fullchain.pem /etc/dokploy/traefik/certs/psysnap.crt
cp /etc/letsencrypt/live/psysnap.com/privkey.pem /etc/dokploy/traefik/certs/psysnap.key
chmod 644 /etc/dokploy/traefik/certs/psysnap.crt
chmod 600 /etc/dokploy/traefik/certs/psysnap.key

echo "=== 5. Starting dokploy-traefik ==="
docker start dokploy-traefik
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
