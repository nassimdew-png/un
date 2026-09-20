import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_whatsapp_template_fixes.tar.gz"

FILES_TO_PACK = [
    "backend/app/Http/Controllers/Api/WhatsAppWebhookController.php",
    "frontend/src/components/portal/GeneratePortalLinkModal.jsx",
    "frontend/src/components/ActiveConsultationWorkspace.jsx",
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

    print("\n3. Extracting, Checking PHP syntax, Clearing Cache, Building Frontend, and Restarting PM2...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm -f {ARCHIVE_NAME}

echo "=== CHECKING PHP SYNTAX ==="
php -l backend/app/Http/Controllers/Api/WhatsAppWebhookController.php

echo "=== CLEARING LARAVEL CACHE ==="
cd backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear

echo "=== BUILDING FRONTEND ==="
cd ../frontend
npm run build

echo "=== RESTARTING PM2 SERVICES ==="
pm2 restart 0
pm2 restart 1
pm2 restart 2
pm2 status
echo "=== DEPLOYMENT COMPLETE ==="
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_script]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    sys.stdout.buffer.write(res.stdout.encode('utf-8', errors='replace'))
    if res.stderr:
        sys.stderr.buffer.write(res.stderr.encode('utf-8', errors='replace'))

    if res.returncode != 0:
        print("Deployment FAILED with returncode:", res.returncode)
        sys.exit(res.returncode)

    print("\n=== DEPLOYMENT FINISHED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
