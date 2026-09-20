import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Curl 3001 root ==="
curl -s -w "\\nHTTP_STATUS:%{http_code}\\n" http://127.0.0.1:3001/ | head -n 20

echo "=== Curl 3001 /dashboard ==="
curl -s -w "\\nHTTP_STATUS:%{http_code}\\n" http://127.0.0.1:3001/dashboard | head -n 20

echo "=== Curl 3001 /billing ==="
curl -s -w "\\nHTTP_STATUS:%{http_code}\\n" http://127.0.0.1:3001/billing | head -n 20

echo "=== Traefik config / routes ==="
docker exec dokploy-traefik cat /etc/traefik/traefik.yml 2>/dev/null || true
docker exec dokploy-traefik cat /etc/traefik/dynamic.yml 2>/dev/null || true
ls -la /etc/dokploy/traefik/dynamic/ 2>/dev/null || true
cat /etc/dokploy/traefik/dynamic/* 2>/dev/null || true
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/curl_routes.txt", "wb") as f:
    f.write(res.stdout)
    f.write(b"\n--- STDERR ---\n")
    f.write(res.stderr)

print("Saved curl routes to scratch/curl_routes.txt")
