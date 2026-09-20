import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Test curl https://psypro.tech/ ==="
curl -s -k -o /dev/null -w "HTTP_STATUS:%{http_code}\\n" "https://127.0.0.1/" -H "Host: psypro.tech"

echo "=== Test curl https://psypro.tech/dashboard ==="
curl -s -k -o /dev/null -w "HTTP_STATUS:%{http_code}\\n" "https://127.0.0.1/dashboard" -H "Host: psypro.tech"

echo "=== Test curl https://qa-test-clinic-20260913.psypro.tech/ ==="
curl -s -k -o /dev/null -w "HTTP_STATUS:%{http_code}\\n" "https://127.0.0.1/" -H "Host: qa-test-clinic-20260913.psypro.tech"

echo "=== Test curl https://qa-test-clinic-20260913.psypro.tech/dashboard ==="
curl -s -k -o /dev/null -w "HTTP_STATUS:%{http_code}\\n" "https://127.0.0.1/dashboard" -H "Host: qa-test-clinic-20260913.psypro.tech"

echo "=== Test curl https://qa-test-clinic-20260913.psypro.tech/billing ==="
curl -s -k -o /dev/null -w "HTTP_STATUS:%{http_code}\\n" "https://127.0.0.1/billing" -H "Host: qa-test-clinic-20260913.psypro.tech"
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/curl_domains_out.txt", "wb") as f:
    f.write(res.stdout)
    f.write(b"\n--- STDERR ---\n")
    f.write(res.stderr)

print("Saved to scratch/curl_domains_out.txt")
