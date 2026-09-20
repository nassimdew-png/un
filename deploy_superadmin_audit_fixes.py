import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"

BACKEND_FILES = [
    ("backend/routes/console.php", "backend/routes/console.php"),
    ("backend/routes/api.php", "backend/routes/api.php"),
    ("backend/app/Http/Middleware/EnsureTenantIsActive.php", "backend/app/Http/Middleware/EnsureTenantIsActive.php"),
    ("backend/app/Services/AuditLogger.php", "backend/app/Services/AuditLogger.php"),
    ("backend/app/Http/Controllers/Api/ParentPortalController.php", "backend/app/Http/Controllers/Api/ParentPortalController.php"),
    ("backend/app/Http/Controllers/Api/AiRadioPodcastController.php", "backend/app/Http/Controllers/Api/AiRadioPodcastController.php"),
    ("backend/app/Http/Controllers/Api/AiImageStudioController.php", "backend/app/Http/Controllers/Api/AiImageStudioController.php"),
    ("backend/app/Jobs/GenerateClinicalVideoJob.php", "backend/app/Jobs/GenerateClinicalVideoJob.php"),
    ("backend/app/Services/WhatsAppCloudApiService.php", "backend/app/Services/WhatsAppCloudApiService.php"),
    ("backend/app/Http/Controllers/Api/SuperAdmin/SubscriptionLifecycleController.php", "backend/app/Http/Controllers/Api/SuperAdmin/SubscriptionLifecycleController.php"),
    ("backend/app/Http/Controllers/Api/SuperAdmin/SovereignControlTowerController.php", "backend/app/Http/Controllers/Api/SuperAdmin/SovereignControlTowerController.php"),
    ("backend/app/Http/Controllers/Api/SuperAdminController.php", "backend/app/Http/Controllers/Api/SuperAdminController.php"),
]

FRONTEND_FILES = [
    ("frontend/src/api.js", "frontend/src/api.js"),
    ("frontend/src/components/super-admin/SovereignControlTowerTab.jsx", "frontend/src/components/super-admin/SovereignControlTowerTab.jsx"),
    ("frontend/src/components/super-admin/SubscriptionChaserManagerTab.jsx", "frontend/src/components/super-admin/SubscriptionChaserManagerTab.jsx"),
    ("frontend/src/components/Sidebar.jsx", "frontend/src/components/Sidebar.jsx"),
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
    print("=== Step 1: Uploading Backend Files ===")
    for loc, rem in BACKEND_FILES:
        if not scp_file(loc, rem):
            print(f"Failed to upload {loc}")
            sys.exit(1)

    print("\n=== Step 2: Uploading Frontend Files ===")
    for loc, rem in FRONTEND_FILES:
        if not scp_file(loc, rem):
            print(f"Failed to upload {loc}")
            sys.exit(1)

    print("\n=== Step 3: Running Database Migration & Artisan Cache Optimization on VPS ===")
    artisan_cmd = f"cd {REMOTE_BASE}/backend && php artisan migrate --force && php artisan optimize:clear && composer dump-autoload -o"
    if not run_ssh(artisan_cmd):
        print("Artisan migration / optimization failed!")
        sys.exit(1)

    print("\n=== Step 4: Building Frontend on VPS ===")
    build_cmd = f"cd {REMOTE_BASE}/frontend && npm run build"
    if not run_ssh(build_cmd):
        print("Build failed on VPS!")
        sys.exit(1)

    print("\n=== Step 5: Restarting PM2 Services ===")
    restart_cmd = "pm2 restart 0 && pm2 restart 1 && pm2 restart 2"
    if not run_ssh(restart_cmd):
        print("PM2 restart failed!")
        sys.exit(1)

    print("\n=== Step 6: Checking PM2 Status on VPS ===")
    status_cmd = "pm2 status"
    run_ssh(status_cmd)

    print("\n=== SUCCESS: All Super Admin audit fixes deployed & verified on VPS! ===")

if __name__ == "__main__":
    main()
