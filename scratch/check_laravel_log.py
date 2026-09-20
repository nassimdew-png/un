import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

test_script = """tail -n 30 /var/www/clinic-saas/backend/storage/logs/laravel.log"""

res = subprocess.run([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST, test_script
], capture_output=True)

with open("scratch/laravel_log.txt", "wb") as f:
    f.write(res.stdout)

print("Saved log to scratch/laravel_log.txt")
