import tarfile
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_dashboard_routes_fix.tar.gz"

FILES_TO_PACK = [
    "frontend/src/App.jsx",
    "frontend/src/components/ProtectedRoute.jsx",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/Dashboard.jsx",
    "frontend/src/components/dashboard/DailyClinicalPulse.jsx",
    "frontend/src/components/Billing.jsx",
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
                print(f"  ! Warning: Missing file: {full_path}")

    print("\n2. Uploading archive to VPS...")
    scp_cmd = [SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", archive_path, f"{HOST}:{REMOTE_BASE}/"]
    res = subprocess.run(scp_cmd, capture_output=True, encoding='utf-8', errors='replace')
    if res.returncode != 0:
        print("SCP Error:", res.stderr)
        sys.exit(1)
    print("  Uploaded successfully!")

    print("\n3. Extracting and building frontend on VPS...")
    extract_cmd = (
        f"cd {REMOTE_BASE} && "
        f"tar -xzf {ARCHIVE_NAME} && "
        f"rm {ARCHIVE_NAME} && "
        f"cd frontend && "
        f"npm run build && "
        f"pm2 restart 0 && pm2 restart 1 && pm2 restart 2 && "
        f"pm2 status"
    )
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, extract_cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, encoding='utf-8', errors='replace')
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

    if os.path.exists(archive_path):
        os.remove(archive_path)

if __name__ == '__main__':
    main()
