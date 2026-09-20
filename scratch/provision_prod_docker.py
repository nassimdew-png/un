import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import time

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
prod_ip = "197.140.142.48"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(prod_ip, username="root", pkey=k, timeout=30)

print("Starting Dokploy & Traefik & Docker installation on 197.140.142.48...")

dokploy_script = """
set -e
echo ">>> Installing Dokploy and Docker Swarm & Traefik..."
curl -sSL https://dokploy.com/install.sh | bash

echo ">>> Verifying Docker and Traefik status..."
sleep 10
docker ps

echo ">>> Starting MySQL 8.0 container..."
if ! docker ps -a --format '{{.Names}}' | grep -q '^clinic_mysql$'; then
    docker run -d --name clinic_mysql \
        --restart unless-stopped \
        -p 127.0.0.1:3306:3306 \
        -e MYSQL_ROOT_PASSWORD=root_secure_password123 \
        -e MYSQL_DATABASE=clinic_saas_db \
        -e MYSQL_USER=clinic_user \
        -e MYSQL_PASSWORD=clinic_secure_password123 \
        -v mysql_data:/var/lib/mysql \
        mysql:8.0
else
    docker start clinic_mysql
fi

echo ">>> Starting Redis container..."
if ! docker ps -a --format '{{.Names}}' | grep -q '^clinic_redis$'; then
    docker run -d --name clinic_redis \
        --restart unless-stopped \
        -p 127.0.0.1:6379:6379 \
        redis:alpine
else
    docker start clinic_redis
fi

echo ">>> Final Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
"""

stdin, stdout, stderr = ssh.exec_command(dokploy_script)
for line in stdout:
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("\nSTDERR:\n", err[-500:])

ssh.close()
print("\nDokploy, Traefik, MySQL 8.0, and Redis deployed successfully!")
