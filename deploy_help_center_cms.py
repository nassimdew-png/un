import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_help_center_cms.tar.gz"

FILES_TO_PACK = [
    "backend/app/Http/Controllers/Api/SuperAdmin/HelpCenterStudioController.php",
    "frontend/src/api.js",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/super-admin/SuperAdminDashboardView.jsx",
    "frontend/src/components/super-admin/SovereignControlTowerTab.jsx",
    "frontend/src/components/super-admin/HelpCenterStudioTab.jsx",
    "frontend/src/App.jsx",
]

def main():
    print("1. Creating tar.gz archive...")
    archive_path = os.path.join(r"E:\3", ARCHIVE_NAME)
    with tarfile.open(archive_path, "w:gz") as tar:
        for rel_path in FILES_TO_PACK:
            full_path = os.path.join(r"E:\3", rel_path)
            if os.path.exists(full_path):
                tar.add(full_path, arcname=rel_path)
                print(f"  + Added {rel_path}")
            else:
                print(f"  ! Missing file: {full_path}")
                sys.exit(1)

    print("\n2. Uploading archive to VPS...")
    scp_cmd = [SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", archive_path, f"{HOST}:{REMOTE_BASE}/"]
    res = subprocess.run(scp_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("SCP Error:", res.stderr)
        sys.exit(1)
    print("  Uploaded successfully!")

    print("\n3. Extracting, building frontend, and restarting PM2...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm {ARCHIVE_NAME}

echo "=== PHP Syntax Check ==="
php -l backend/app/Http/Controllers/Api/SuperAdmin/HelpCenterStudioController.php

echo "=== Laravel Cache Clear ==="
cd backend
php artisan optimize:clear
php artisan route:clear

echo "=== Building Frontend ==="
cd ../frontend
npm run build

echo "=== Restarting PM2 ==="
pm2 restart 0
pm2 restart 1
pm2 restart 2

echo "=== PM2 Status ==="
pm2 status
"""

    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_script]
    process = subprocess.Popen(ssh_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    for line in process.stdout:
        print(line, end="")
    process.wait()

    if process.returncode != 0:
        print(f"Failed with exit code: {process.returncode}")
        sys.exit(process.returncode)

    print("\nDeployment completed successfully!")

if __name__ == "__main__":
    main()
