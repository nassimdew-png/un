import os
import tarfile
import subprocess
import sys
import urllib.request
import ssl

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
LOCAL_BASE = r"E:\3"
REMOTE_BASE = "/var/www/clinic-saas"

FILES_TO_DEPLOY = [
    # Public brand assets & icons
    ("frontend/public/favicon.ico", "frontend/public/favicon.ico"),
    ("frontend/public/favicon.png", "frontend/public/favicon.png"),
    ("frontend/public/favicon-16x16.png", "frontend/public/favicon-16x16.png"),
    ("frontend/public/favicon-32x32.png", "frontend/public/favicon-32x32.png"),
    ("frontend/public/apple-touch-icon.png", "frontend/public/apple-touch-icon.png"),
    ("frontend/public/pwa-192x192.png", "frontend/public/pwa-192x192.png"),
    ("frontend/public/pwa-512x512.png", "frontend/public/pwa-512x512.png"),
    ("frontend/public/psysnap-logo.png", "frontend/public/psysnap-logo.png"),
    ("frontend/public/psysnap-icon.png", "frontend/public/psysnap-icon.png"),
    ("frontend/public/logo.png", "frontend/public/logo.png"),
    
    # Src assets
    ("frontend/src/assets/psysnap-logo.png", "frontend/src/assets/psysnap-logo.png"),
    ("frontend/src/assets/logo.png", "frontend/src/assets/logo.png"),

    # HTML & Build Config
    ("frontend/index.html", "frontend/index.html"),
    ("frontend/vite.config.js", "frontend/vite.config.js"),

    # Locales
    ("frontend/src/locales/ar.json", "frontend/src/locales/ar.json"),
    ("frontend/src/locales/fr.json", "frontend/src/locales/fr.json"),

    # Core Components
    ("frontend/src/components/public/LandingPageView.jsx", "frontend/src/components/public/LandingPageView.jsx"),
    ("frontend/src/components/Navbar.jsx", "frontend/src/components/Navbar.jsx"),
    ("frontend/src/components/Sidebar.jsx", "frontend/src/components/Sidebar.jsx"),
    ("frontend/src/components/layout/Sidebar.jsx", "frontend/src/components/layout/Sidebar.jsx"),
    ("frontend/src/components/Login.jsx", "frontend/src/components/Login.jsx"),
    ("frontend/src/components/public/RegisterView.jsx", "frontend/src/components/public/RegisterView.jsx"),
    ("frontend/src/components/settings/ClinicSettingsView.jsx", "frontend/src/components/settings/ClinicSettingsView.jsx"),
    ("frontend/src/components/super-admin/CommunicationGatewaysView.jsx", "frontend/src/components/super-admin/CommunicationGatewaysView.jsx"),
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
    archive_name = "patch_psysnap_branding.tar.gz"
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

    echo "=== Copying public assets to build dist if exists ==="
    if [ -d "frontend/dist" ]; then
        cp -f frontend/public/psysnap-logo.png frontend/dist/ || true
        cp -f frontend/public/psysnap-icon.png frontend/dist/ || true
        cp -f frontend/public/favicon.ico frontend/dist/ || true
        cp -f frontend/public/favicon.png frontend/dist/ || true
        cp -f frontend/public/favicon-16x16.png frontend/dist/ || true
        cp -f frontend/public/favicon-32x32.png frontend/dist/ || true
        cp -f frontend/public/apple-touch-icon.png frontend/dist/ || true
        cp -f frontend/public/pwa-192x192.png frontend/dist/ || true
        cp -f frontend/public/pwa-512x512.png frontend/dist/ || true
        cp -f frontend/public/logo.png frontend/dist/ || true
    fi

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
        print(f"Deployment failed with error:\n{res.stderr.decode('utf-8', errors='replace')}")
        sys.exit(1)

    print("\nDeployment successful! Verifying live site...")

if __name__ == '__main__':
    main()
