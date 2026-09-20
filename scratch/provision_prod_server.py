import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
STAGING_IP = '145.223.116.54'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

def run_cmd(ssh, cmd, title=None, timeout=600):
    if title:
        print(f"\n{'='*50}\n>> {title}\n{'='*50}")
    print(f"RUN: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # stream output
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
    # Read remaining
    chunk = stdout.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stdout.write(chunk)
    chunk = stderr.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stderr.write(chunk)
        
    print(f"\n[EXIT CODE: {exit_code}]")
    if exit_code != 0:
        print(f"WARNING: Command returned non-zero exit code: {exit_code}")
    return exit_code

def main():
    print(f"Connecting to Production VPS ({PROD_IP})...")
    ssh_prod = paramiko.SSHClient()
    ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_prod.connect(PROD_IP, username='root', key_filename=SSH_KEY)
    
    # 1. Update & Prerequisites & PHP 8.3 & Node.js 20 & Composer
    setup_packages = """
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git unzip tar rsync software-properties-common ca-certificates gnupg \
    php8.3 php8.3-cli php8.3-fpm php8.3-mysql php8.3-curl php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-zip php8.3-intl php8.3-gd php8.3-redis composer

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

npm install -g pm2
"""
    run_cmd(ssh_prod, setup_packages, "Step 1: Installing System Packages, PHP 8.3, Node 20, PM2")

    # 2. Dokploy & Traefik installation
    dokploy_cmd = """
if ! command -v docker &> /dev/null; then
    echo "Installing Dokploy & Docker stack..."
    curl -sSL https://dokploy.com/install.sh | sh
else
    echo "Docker already present."
fi
"""
    run_cmd(ssh_prod, dokploy_cmd, "Step 2: Installing Dokploy & Traefik")

    # 3. Verify Docker & Launch MySQL 8.0 and Redis containers
    containers_cmd = """
docker info >/dev/null 2>&1 || (echo "Waiting for Docker daemon..."; sleep 5)

# MySQL
if ! docker ps -a --format '{{.Names}}' | grep -Eq '^clinic_mysql$'; then
    echo "Creating clinic_mysql container..."
    docker run -d --name clinic_mysql --restart always \
        -p 127.0.0.1:3306:3306 \
        -v clinic-saas_clinic_mysql_data:/var/lib/mysql \
        -e MYSQL_ROOT_PASSWORD=root_secure_password123 \
        -e MYSQL_DATABASE=clinic_saas_db \
        -e MYSQL_USER=clinic_user \
        -e MYSQL_PASSWORD=clinic_secure_password123 \
        mysql:8.0
else
    echo "clinic_mysql container exists, ensuring running..."
    docker start clinic_mysql
fi

# Redis
if ! docker ps -a --format '{{.Names}}' | grep -Eq '^clinic_redis$'; then
    echo "Creating clinic_redis container..."
    docker run -d --name clinic_redis --restart always \
        -p 127.0.0.1:6379:6379 \
        -v clinic-saas_clinic_redis_data:/data \
        redis:alpine
else
    echo "clinic_redis container exists, ensuring running..."
    docker start clinic_redis
fi

docker ps
"""
    run_cmd(ssh_prod, containers_cmd, "Step 3: Setting up MySQL and Redis Containers")

    ssh_prod.close()
    print("\nPhase 1 Completed successfully!")

if __name__ == '__main__':
    main()
