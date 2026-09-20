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

print("Starting provisioning on 197.140.142.48...")

setup_script = """
set -e
echo ">>> STEP 1: Updating packages and base tools..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y curl wget git unzip htop rsync software-properties-common ca-certificates gnupg lsb-release

echo ">>> STEP 2: Installing PHP 8.3 and extensions..."
apt-get install -y php8.3-cli php8.3-fpm php8.3-mysql php8.3-curl php8.3-mbstring php8.3-xml php8.3-bcmath php8.3-zip php8.3-intl php8.3-gd php8.3-redis composer

echo ">>> STEP 3: Installing Node.js 20 and PM2..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
npm install -g pm2

echo ">>> STEP 4: Verifying tools versions..."
php -v | head -n 1
node -v
npm -v
pm2 -v
"""

stdin, stdout, stderr = ssh.exec_command(setup_script)
for line in stdout:
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("\nSTDERR:\n", err[-500:])

ssh.close()
print("\nBase packages, PHP 8.3, Node.js 20, and PM2 installed successfully!")
