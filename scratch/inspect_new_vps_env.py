import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

NEW_HOST = "root@197.140.142.48"
SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

inspect_cmd = """
echo "=== 1. OS & Uptime ==="
cat /etc/os-release | grep PRETTY_NAME
uptime

echo "=== 2. Check Installed Services & Binaries ==="
which nginx || echo "nginx: not installed"
which docker || echo "docker: not installed"
which php || echo "php: not installed"
which node || echo "node: not installed"
which npm || echo "npm: not installed"
which pm2 || echo "pm2: not installed"
which mysql || echo "mysql: not installed"
which composer || echo "composer: not installed"

echo "=== 3. Listening Ports ==="
ss -tulpn || netstat -tulpn || true

echo "=== 4. Docker Containers (if any) ==="
docker ps 2>/dev/null || echo "docker not running"
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", NEW_HOST, inspect_cmd], capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("STDERR:", res.stderr)
