import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """
echo "=== PM2 Status ==="
pm2 status

echo "=== Test 1: Fetch audit logs with Clinic Admin Token ==="
curl -s -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/audit-logs"

echo ""
echo "=== Test 2: Search for SuperAdmin email ==="
curl -s -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/audit-logs?search=superadmin@clinic-saas.dz"

echo ""
echo "=== Test 3: Filter by date 2026-09-13 ==="
curl -s -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/audit-logs?start_date=2026-09-13"

echo ""
echo "=== Test 4: Combined search and date ==="
curl -s -H "Authorization: Bearer 558|sEwlApoMqb5PEMshK9D9DPNLY97UEQPUmK5gQByVd96ef96a" \
     -H "Accept: application/json" \
     "http://127.0.0.1:8000/api/audit-logs?start_date=2026-09-13&search=superadmin"
echo ""
"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/verify_audit_out.txt", "wb") as f:
    f.write(res.stdout)
    f.write(b"\n--- STDERR ---\n")
    f.write(res.stderr)

print("Saved output to scratch/verify_audit_out.txt")
