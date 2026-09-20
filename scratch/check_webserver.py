import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Listening Ports ==="
ss -tulpn

echo "=== Web server processes ==="
ps aux | grep -E "nginx|caddy|apache|node|vite|php" | grep -v grep

echo "=== Caddyfile? ==="
find /etc -name "*caddy*" -o -name "*nginx*" 2>/dev/null
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/webserver_info.txt", "wb") as f:
    f.write(res.stdout)

print("Saved info to scratch/webserver_info.txt")
