import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"

verify_script = """import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("=== 1. VERIFYING SPA ROUTES (HTTP 200) ===")
routes = [
    'https://cabinet-alger.psypro.tech/dashboard',
    'https://cabinet-alger.psypro.tech/',
    'https://cabinet-alger.psypro.tech/kiosk',
    'https://cabinet-alger.psypro.tech/front-desk',
    'https://cabinet-alger.psypro.tech/tv',
]

for url in routes:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            status = response.status
            content = response.read().decode('utf-8')
            has_root = '<div id="root">' in content
            print("  + " + url + " -> Status: " + str(status) + ", Root container: " + str(has_root))
    except Exception as e:
        print("  ! Error for " + url + ": " + str(e))

print("\\n=== 2. VERIFYING BACKEND API ENDPOINTS ===")
api_urls = [
    'https://cabinet-alger.psypro.tech/api/public/tenant-info?subdomain=cabinet-alger',
    'https://cabinet-alger.psypro.tech/api/public/tv-queue/cabinet-alger',
    'https://cabinet-alger.psypro.tech/api/kiosk/info?subdomain=cabinet-alger',
]

for url in api_urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
            status = response.status
            raw = response.read().decode('utf-8')
            data = json.loads(raw)
            print("  + " + url + " -> Status: " + str(status))
            if 'clinic' in data:
                c = data['clinic']
                print("    Clinic: name=" + str(c.get('name')) + ", subdomain=" + str(c.get('subdomain')) + ", status=" + str(c.get('status')))
    except Exception as e:
        print("  ! Error for " + url + ": " + str(e))

print("\\n=== 3. TESTING KIOSK CHECK-IN FLOW ===")
try:
    checkin_url = 'https://cabinet-alger.psypro.tech/api/kiosk/check-in'
    payload = json.dumps({'kiosk_pin': '112233', 'subdomain': 'cabinet-alger'}).encode('utf-8')
    req = urllib.request.Request(
        checkin_url,
        data=payload,
        headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'X-Tenant-Subdomain': 'cabinet-alger'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        print("  + Kiosk Check-In Success: " + str(res.get('success')) + " | Message: " + str(res.get('message')) + " | Patient: " + str(res.get('patient')))
except Exception as e:
    print("  ! Kiosk Check-In Error: " + str(e))

print("\\n=== 4. TESTING LIVE WAITING ROOM & TV QUEUE ===")
try:
    queue_url = 'https://cabinet-alger.psypro.tech/api/public/tv-queue/cabinet-alger'
    req = urllib.request.Request(queue_url, headers={'Accept': 'application/json'})
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        waiting = res.get('waiting_queue', [])
        print("  + TV Queue fetched successfully. Waiting count: " + str(len(waiting)))
        for item in waiting:
            print("    - Patient: " + str(item.get('patient_name')) + " (" + str(item.get('token')) + ") - Status: " + str(item.get('status')))
except Exception as e:
    print("  ! TV Queue Error: " + str(e))

print("\\n=== 5. TESTING CLINIC LOGIN AUTH (COCKPIT CREDENTIALS) ===")
try:
    login_url = 'https://cabinet-alger.psypro.tech/api/auth/login'
    payload = json.dumps({
        'email': 'admin@cabinet-alger.dz',
        'password': 'password123',
        'subdomain': 'cabinet-alger'
    }).encode('utf-8')
    req = urllib.request.Request(
        login_url,
        data=payload,
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
        res = json.loads(response.read().decode('utf-8'))
        user = res.get('user', {})
        tenant = res.get('tenant', {})
        token = res.get('access_token') or res.get('token')
        print("  + Login Success! User: " + str(user.get('name')) + " | Role: " + str(user.get('role')) + " | Tenant: " + str(tenant.get('name')) + " | Token present: " + str(bool(token)))
except Exception as e:
    print("  ! Login Auth Error: " + str(e))
"""

local_path = os.path.join(r"E:\3", "test_vps_verify.py")
with open(local_path, "w", encoding="utf-8") as f:
    f.write(verify_script)

subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_path, f"{HOST}:/tmp/test_vps_verify.py"], check=True)
if os.path.exists(local_path):
    os.remove(local_path)

cmd = "python3 /tmp/test_vps_verify.py && rm -f /tmp/test_vps_verify.py"
res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd], capture_output=True, encoding='utf-8', errors='replace')
print("OUTPUT:")
print(res.stdout)
if res.stderr:
    print("STDERR:")
    print(res.stderr)
