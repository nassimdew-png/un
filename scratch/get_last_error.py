import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """python3 -c '
with open("/var/www/clinic-saas/backend/storage/logs/laravel.log") as f:
    lines = f.readlines()
for line in reversed(lines[-100:]):
    if "ERROR" in line:
        print(line)
        break
'"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/last_error.txt", "wb") as f:
    f.write(res.stdout)

print("Saved output to scratch/last_error.txt")
