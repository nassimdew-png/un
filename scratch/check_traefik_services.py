import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Services in clinic-saas.yml ==="
grep -n -C 5 "services:" /etc/dokploy/traefik/dynamic/clinic-saas.yml
grep -n -C 5 "3001" /etc/dokploy/traefik/dynamic/clinic-saas.yml
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/traefik_services.txt", "wb") as f:
    f.write(res.stdout)

print("Saved to scratch/traefik_services.txt")
