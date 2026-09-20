import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== Test 5: Call /api/impersonate/stop ==="
curl -s -X POST -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/impersonate/stop"

echo ""
echo "=== Test 6: Verify new audit log for impersonation_end ==="
curl -s -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/audit-logs?action=auth.impersonation_end"
echo ""
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/verify_stop_out.txt", "wb") as f:
    f.write(res.stdout)
    f.write(b"\n--- STDERR ---\n")
    f.write(res.stderr)

print("Saved output to scratch/verify_stop_out.txt")
