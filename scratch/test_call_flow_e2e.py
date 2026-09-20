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

# 1. Login to get auth token
login_url = 'https://cabinet-alger.psypro.tech/api/auth/login'
payload = json.dumps({
    'email': 'admin@cabinet-alger.dz',
    'password': 'password123',
    'subdomain': 'cabinet-alger'
}).encode('utf-8')
req = urllib.request.Request(login_url, data=payload, headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
    res = json.loads(response.read().decode('utf-8'))
    token = res.get('access_token') or res.get('token')
    print("1. Logged in successfully. Token acquired:", token[:15] + "...")

# 2. Check TV Queue before calling
queue_url = 'https://cabinet-alger.psypro.tech/api/public/tv-queue/cabinet-alger'
req = urllib.request.Request(queue_url, headers={'Accept': 'application/json'})
with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
    qres = json.loads(response.read().decode('utf-8'))
    waiting = qres.get('waiting_list', [])
    calling = qres.get('current_calling')
    print("2. Initial TV Queue State:")
    print("   - Waiting patients:", len(waiting))
    for w in waiting:
        print("     * ID: " + str(w.get('id')) + " | " + str(w.get('patient_name')) + " (" + str(w.get('token')) + ") | Status: " + str(w.get('status')))
    print("   - Current Calling:", calling.get('patient_name') if calling else "None")

# 3. Call first patient from waiting list
if waiting:
    first_app_id = waiting[0].get('id')
    call_url = 'https://cabinet-alger.psypro.tech/api/appointments/' + str(first_app_id) + '/call-queue'
    call_req = urllib.request.Request(
        call_url,
        data=b'{}',
        headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    with urllib.request.urlopen(call_req, context=ctx, timeout=10) as response:
        c_res = json.loads(response.read().decode('utf-8'))
        print("\\n3. Calling Patient (In-Office Signal Dispatched):")
        print("   - Success: " + str(c_res.get('success')))
        print("   - Message: " + str(c_res.get('message')))

# 4. Check TV Queue after call signal
with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
    qres2 = json.loads(response.read().decode('utf-8'))
    calling2 = qres2.get('current_calling')
    print("\\n4. Updated TV Queue State After Call Signal:")
    print("   - Currently Called to Office: " + str(calling2.get('patient_name')) + " (" + str(calling2.get('token')) + ") -> Room: " + str(calling2.get('room_name')))
"""

local_path = os.path.join(r"E:\3", "test_call_flow.py")
with open(local_path, "w", encoding="utf-8") as f:
    f.write(verify_script)

subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_path, f"{HOST}:/tmp/test_call_flow.py"], check=True)
if os.path.exists(local_path):
    os.remove(local_path)

cmd = "python3 /tmp/test_call_flow.py && rm -f /tmp/test_call_flow.py"
res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, cmd], capture_output=True, encoding='utf-8', errors='replace')
print("OUTPUT:")
print(res.stdout)
if res.stderr:
    print("STDERR:")
    print(res.stderr)
