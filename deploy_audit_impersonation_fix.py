import tarfile
import subprocess
import os

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_audit_impersonation.tar.gz"

FILES_TO_PACK = [
    "backend/app/Models/AuditLog.php",
    "backend/app/Http/Controllers/Api/AuditLogController.php",
    "backend/app/Http/Controllers/Api/SuperAdminController.php",
    "backend/routes/api.php",
    "frontend/src/api.js",
    "frontend/src/components/Navbar.jsx",
    "frontend/src/components/AuditLogs.jsx",
    "frontend/src/locales/ar.json",
    "frontend/src/locales/fr.json",
]

def main():
    print(f"[+] Packaging {len(FILES_TO_PACK)} files into {ARCHIVE_NAME}...")
    with tarfile.open(ARCHIVE_NAME, "w:gz") as tar:
        for file_path in FILES_TO_PACK:
            if os.path.exists(file_path):
                tar.add(file_path)
                print(f"  + Added: {file_path}")
            else:
                print(f"  [-] File missing: {file_path}")
                return

    print("\n[+] Uploading archive to VPS via SCP...")
    scp_cmd = [
        SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
        ARCHIVE_NAME, f"{HOST}:{REMOTE_BASE}/{ARCHIVE_NAME}"
    ]
    res = subprocess.run(scp_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("[-] SCP upload failed:", res.stderr)
        return
    print("[+] Archive uploaded successfully.")

    remote_exec = f"""
    set -e
    cd {REMOTE_BASE}
    tar -xzf {ARCHIVE_NAME}
    rm {ARCHIVE_NAME}

    echo "--- PHP Syntax check ---"
    php -l backend/app/Models/AuditLog.php
    php -l backend/app/Http/Controllers/Api/AuditLogController.php
    php -l backend/app/Http/Controllers/Api/SuperAdminController.php
    php -l backend/routes/api.php

    echo "--- Clearing Laravel Cache ---"
    cd backend
    php artisan optimize:clear
    php artisan config:clear
    php artisan route:clear

    echo "--- Building Frontend ---"
    cd ../frontend
    npm run build

    echo "--- Restarting PM2 ---"
    pm2 restart 0
    pm2 restart 1
    pm2 restart 2

    pm2 status
    """

    print("\n[+] Executing remote deploy and build commands...")
    ssh_cmd = [
        SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
        HOST, remote_exec
    ]
    deploy_proc = subprocess.run(ssh_cmd, capture_output=True, text=True)
    print("STDOUT:\n", deploy_proc.stdout)
    if deploy_proc.returncode != 0:
        print("STDERR:\n", deploy_proc.stderr)
        print("[-] Remote deployment failed!")
    else:
        print("[+] Deployment & Build completed successfully!")

if __name__ == "__main__":
    main()
