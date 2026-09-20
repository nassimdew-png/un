import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Docker Containers ==="
docker ps

echo "=== PM2 ecosystem or script for frontend ==="
pm2 describe 1
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/docker_info.txt", "wb") as f:
    f.write(res.stdout)

print("Saved docker info to scratch/docker_info.txt")
