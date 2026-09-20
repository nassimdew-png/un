import tarfile
import subprocess
import os
import sys

# Ensure UTF-8 output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_student_offer.tar.gz"

FILES_TO_PACK = [
    # Backend
    "backend/database/migrations/2026_09_19_000002_enhance_academic_verifications_for_student_offer.php",
    "backend/app/Models/AcademicVerification.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/StudentOfferController.php",
    "backend/app/Http/Controllers/Api/AcademicController.php",
    "backend/routes/api.php",
    # Frontend
    "frontend/src/api.js",
    "frontend/src/components/super-admin/StudentOfferManagerTab.jsx",
    "frontend/src/components/academic/StudentOfferLandingView.jsx",
    "frontend/src/components/super-admin/SuperAdminDashboardView.jsx",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/super-admin/SovereignControlTowerTab.jsx",
    "frontend/src/components/academic/StudentHubView.jsx",
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
    scp_cmd = [SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30", archive_path, f"{HOST}:{REMOTE_BASE}/"]
    res = subprocess.run(scp_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("SCP Error:", res.stderr)
        sys.exit(1)
    print("  Uploaded successfully!")

    print("\n3. Extracting, Migrating, Clearing Cache, Building Frontend, and Restarting PM2...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm -f {ARCHIVE_NAME}

echo "=== MIGRATING DATABASE & OPTIMIZING LARAVEL ==="
cd backend
php artisan migrate --force
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
echo "=== STUDENT OFFER DEPLOYMENT COMPLETE ==="
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30", HOST, remote_script]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    print("Remote Output:")
    print(res.stdout)
    if res.stderr:
        print("Remote Errors / Warnings:")
        print(res.stderr)

    if res.returncode == 0:
        print("\n🎉 Deployment completed successfully!")
    else:
        print(f"\n❌ Deployment exited with code {res.returncode}")
        sys.exit(res.returncode)

if __name__ == '__main__':
    main()
