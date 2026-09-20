import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"

FRONTEND_FILES = [
    ("frontend/src/locales/ar.json", "frontend/src/locales/ar.json"),
    ("frontend/src/locales/fr.json", "frontend/src/locales/fr.json"),
    ("frontend/src/i18n.js", "frontend/src/i18n.js"),
    ("frontend/src/components/Login.jsx", "frontend/src/components/Login.jsx"),
    ("frontend/src/components/super-admin/SovereignControlTowerTab.jsx", "frontend/src/components/super-admin/SovereignControlTowerTab.jsx"),
]

def run_cmd(cmd_list):
    print(f">> Running: {' '.join(cmd_list)}")
    res = subprocess.run(cmd_list, capture_output=True, text=True)
    if res.returncode != 0:
        print("ERROR:", res.stderr)
        return False
    if res.stdout:
        print(res.stdout)
    return True

def run_ssh(remote_cmd):
    cmd_list = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd]
    return run_cmd(cmd_list)

def scp_file(local_rel, remote_rel):
    local_path = os.path.abspath(os.path.join(r"E:\3", local_rel))
    remote_path = f"{HOST}:{REMOTE_BASE}/{remote_rel}"
    cmd_list = [SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_path, remote_path]
    return run_cmd(cmd_list)

def main():
    print("=== Step 1: Uploading Updated Frontend & Locale Files ===")
    for loc, rem in FRONTEND_FILES:
        if not scp_file(loc, rem):
            print(f"Failed to upload {loc}")
            sys.exit(1)

    print("\n=== Step 2: Building Frontend on VPS ===")
    build_cmd = f"cd {REMOTE_BASE}/frontend && npm run build"
    if not run_ssh(build_cmd):
        print("Build failed on VPS!")
        sys.exit(1)

    print("\n=== Step 3: Restarting PM2 Frontend Service ===")
    restart_cmd = "pm2 restart 1"
    if not run_ssh(restart_cmd):
        print("PM2 restart failed!")
        sys.exit(1)

    print("\n=== SUCCESS: Login i18n, RTL/LTR switcher, demo cards & Kill-Switch safety modal deployed! ===")

if __name__ == "__main__":
    main()
