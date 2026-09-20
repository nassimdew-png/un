import os
import tarfile
import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
LOCAL_BASE = r"E:\3"
REMOTE_BASE = "/var/www/clinic-saas"

FILES_TO_DEPLOY = [
    ("backend/app/Http/Controllers/Api/PublicAuthController.php", "backend/app/Http/Controllers/Api/PublicAuthController.php"),
    ("backend/app/Http/Controllers/Api/SuperAdmin/SovereignControlTowerController.php", "backend/app/Http/Controllers/Api/SuperAdmin/SovereignControlTowerController.php"),
    ("backend/routes/api.php", "backend/routes/api.php"),
    ("frontend/src/api.js", "frontend/src/api.js"),
    ("frontend/src/components/super-admin/SovereignControlTowerTab.jsx", "frontend/src/components/super-admin/SovereignControlTowerTab.jsx"),
    ("frontend/src/components/public/RegisterView.jsx", "frontend/src/components/public/RegisterView.jsx"),
    ("frontend/src/components/public/LandingPageView.jsx", "frontend/src/components/public/LandingPageView.jsx"),
]

def make_archive(archive_path):
    print(f"Creating archive at {archive_path}...")
    with tarfile.open(archive_path, "w:gz") as tar:
        for local_rel, arc_name in FILES_TO_DEPLOY:
            full_local = os.path.join(LOCAL_BASE, local_rel)
            if not os.path.exists(full_local):
                raise FileNotFoundError(f"Missing local file: {full_local}")
            print(f"  Adding {local_rel} -> {arc_name}")
            tar.add(full_local, arcname=arc_name)
    print("Archive created successfully.")

def main():
    archive_name = "patch_registration_pause.tar.gz"
    archive_path = os.path.join(r"E:\3\scratch", archive_name)
    make_archive(archive_path)

    print(f"\nUploading {archive_name} to VPS...")
    scp_cmd = [SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", archive_path, f"{HOST}:{REMOTE_BASE}/"]
    res = subprocess.run(scp_cmd, capture_output=True, text=False)
    if res.returncode != 0:
        print(f"SCP failed: {res.stderr.decode('utf-8', errors='replace')}")
        sys.exit(1)
    print("Upload complete.")

    remote_commands = f"""
    set -e
    cd {REMOTE_BASE}
    echo "=== Extracting archive ==="
    tar -xzf {archive_name}
    rm -f {archive_name}

    echo "=== Clearing backend caches ==="
    cd backend
    php artisan optimize:clear
    php artisan config:clear
    php artisan route:clear

    echo "=== Building frontend ==="
    cd ../frontend
    npm run build

    echo "=== Restarting PM2 processes ==="
    pm2 restart 0
    pm2 restart 1
    pm2 restart 2

    pm2 status
    """

    print("\nExecuting deployment and build on VPS...")
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_commands]
    res = subprocess.run(ssh_cmd, capture_output=True, text=False)
    print(res.stdout.decode('utf-8', errors='replace'))
    if res.returncode != 0:
        print(f"Deployment failed:\n{res.stderr.decode('utf-8', errors='replace')}")
        sys.exit(1)

    print("\nDeployment completed successfully!")

if __name__ == '__main__':
    main()
