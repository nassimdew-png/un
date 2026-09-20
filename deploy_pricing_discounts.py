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
ARCHIVE_NAME = "patch_pricing_discounts.tar.gz"

FILES_TO_PACK = [
    # Backend
    "backend/database/migrations/2026_09_19_000003_add_discount_fields_to_subscription_plans.php",
    "backend/app/Models/SubscriptionPlan.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/SubscriptionPlanManagerController.php",
    # Frontend
    "frontend/src/components/super-admin/SubscriptionPlansManagerView.jsx",
    "frontend/src/components/public/LandingPageView.jsx",
    "frontend/src/components/subscription/RenewSubscriptionModal.jsx",
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

echo "--- Running PHP Migrations & Clearing Cache ---"
cd {REMOTE_BASE}/backend
php -l app/Models/SubscriptionPlan.php
php -l app/Http/Controllers/Api/SuperAdmin/SubscriptionPlanManagerController.php
php -l database/migrations/2026_09_19_000003_add_discount_fields_to_subscription_plans.php
php artisan migrate --force
php artisan optimize:clear
php artisan config:clear
php artisan route:clear

echo "--- Building Frontend ---"
cd {REMOTE_BASE}/frontend
npm run build

echo "--- Restarting PM2 Services ---"
pm2 restart 0
pm2 restart 1
pm2 restart 2

echo "--- PM2 Status ---"
pm2 status
"""

    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=30", HOST, remote_script]
    process = subprocess.Popen(ssh_cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding='utf-8', errors='replace')
    for line in process.stdout:
        print(line, end="")
    process.wait()

    if process.returncode == 0:
        print("\n✅ Deployment of Pricing Discounts Feature completed successfully!")
    else:
        print(f"\n❌ Deployment failed with exit code {process.returncode}")
        sys.exit(1)

if __name__ == "__main__":
    main()
