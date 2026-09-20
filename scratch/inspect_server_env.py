import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_ssh(remote_cmd):
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)

print("=== Checking env on VPS ===")
run_ssh("grep -E '(CACHE_|QUEUE_|DB_)' /var/www/clinic-saas/backend/.env")

print("\n=== Checking PM2 queue startup args ===")
run_ssh("pm2 describe clinic-queue")
