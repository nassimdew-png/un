import subprocess

script = """
import requests

# 1. Kiosk Info
r1 = requests.get('http://127.0.0.1:8000/api/kiosk/info')
print("Kiosk Info:", r1.status_code, r1.json().get('name'))

# 2. Kiosk Verify PIN
r2 = requests.post('http://127.0.0.1:8000/api/kiosk/verify-access', json={'pin': '1234'}, headers={'Accept': 'application/json'})
print("Kiosk Verify Access:", r2.status_code, r2.json().get('success'))

# 3. Kiosk CheckIn Not Found test
r3 = requests.post('http://127.0.0.1:8000/api/kiosk/check-in', json={'kiosk_pin': '999999'}, headers={'Accept': 'application/json'})
print("Kiosk Check-In 404 handled:", r3.status_code == 404, r3.json().get('message'))

# 4. Auth Tour
r4 = requests.post('http://127.0.0.1:8000/api/user/complete-tour', headers={'Accept': 'application/json'})
print("Auth Complete Tour (Unauth 401 handled):", r4.status_code == 401)
"""

cmd = [
    r"C:\Windows\System32\OpenSSH\ssh.exe",
    "-i", r"C:\Users\Nassim\.ssh\id_ed25519_vps",
    "-o", "StrictHostKeyChecking=no",
    "root@145.223.116.54",
    f"python3 -c \"{script}\""
]

res = subprocess.run(cmd, capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
