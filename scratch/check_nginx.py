import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Nginx sites enabled ==="
ls -la /etc/nginx/sites-enabled/
for f in /etc/nginx/sites-enabled/*; do
    echo "--- File: $f ---"
    cat "$f"
done
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/nginx_conf.txt", "wb") as f:
    f.write(res.stdout)
    f.write(b"\n--- STDERR ---\n")
    f.write(res.stderr)

print("Saved nginx conf to scratch/nginx_conf.txt")
