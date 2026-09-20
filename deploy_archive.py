import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_teletherapy_fixes.tar.gz"

FILES_TO_PACK = [
    "backend/app/Http/Controllers/Api/PsychomotorAssessmentController.php",
    "backend/app/Http/Controllers/Api/SpeechArticulationController.php",
    "backend/app/Http/Controllers/Api/ClinicalTestAssignmentController.php",
    "backend/app/Http/Controllers/Api/ClinicalAssessmentCatalogController.php",
    "backend/app/Http/Controllers/Api/TeletherapySignalingController.php",
    "backend/app/Http/Requests/StorePatientRequest.php",
    "backend/app/Http/Requests/UpdatePatientRequest.php",
    "backend/app/Http/Controllers/Api/PatientController.php",
    "frontend/src/locales/ar.json",
    "frontend/src/locales/fr.json",
    "frontend/src/components/Navbar.jsx",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/layout/Sidebar.jsx",
    "frontend/src/components/Patients.jsx",
    "frontend/src/components/PatientModal.jsx",
    "frontend/src/components/reception/FastPatientIntakeModal.jsx",
    "frontend/src/components/therapy/InteractiveTestPassationModal.jsx",
    "frontend/src/components/teletherapy/TeletherapyModule.jsx",
    "frontend/src/components/teletherapy/TeletherapyRoomView.jsx",
    "frontend/src/components/teletherapy/WebRtcVideoGrid.jsx",
    "frontend/src/components/AppointmentModal.jsx",
    "frontend/src/components/Appointments.jsx",
    "frontend/src/components/orthophony/SpeechAcousticBiomarkersModal.jsx",
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

    print("\n3. Extracting, Building and Restarting PM2 on VPS...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm -f {ARCHIVE_NAME}
cd frontend
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
        print("\n4. Cleaning demo announcements...")
        clean_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, f"cd {REMOTE_BASE}/backend && php artisan tinker --execute=\"DB::table('system_announcements')->where('title', 'like', '%تجريبي%')->orWhere('message', 'like', '%تجريبي%')->delete();\""]
        res2 = subprocess.run(clean_cmd, capture_output=True, text=True)
        print(res2.stdout)

    print("\n=== ALL TASKS COMPLETED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
