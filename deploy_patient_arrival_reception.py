import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_patient_arrival_reception.tar.gz"

FILES_TO_PACK = [
    "frontend/src/components/reception/PatientArrivalCheckInModal.jsx",
    "frontend/src/components/reception/FrontDeskReceptionCockpit.jsx",
    "frontend/src/components/dashboard/DailyClinicalPulse.jsx",
    "frontend/src/components/Dashboard.jsx",
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

    print("\n3. Extracting, Building Frontend, and Restarting PM2 on VPS...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm -f {ARCHIVE_NAME}
cd backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
cd ../frontend
npm run build
pm2 restart 0
pm2 restart 1
pm2 restart 2
echo "=== DEPLOYMENT COMPLETE ==="
"""
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_script]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("STDERR/Notice:", res.stderr)

    if res.returncode == 0:
        print("\n=== ALL TASKS COMPLETED SUCCESSFULLY! ===")
    else:
        print("\nDeployment failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()
