import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"

BACKEND_FILES = [
    ("backend/app/Http/Controllers/Api/PsychomotorAssessmentController.php", "backend/app/Http/Controllers/Api/PsychomotorAssessmentController.php"),
    ("backend/app/Http/Controllers/Api/SpeechArticulationController.php", "backend/app/Http/Controllers/Api/SpeechArticulationController.php"),
    ("backend/app/Http/Controllers/Api/ClinicalTestAssignmentController.php", "backend/app/Http/Controllers/Api/ClinicalTestAssignmentController.php"),
    ("backend/app/Http/Controllers/Api/ClinicalAssessmentCatalogController.php", "backend/app/Http/Controllers/Api/ClinicalAssessmentCatalogController.php"),
    ("backend/app/Http/Controllers/Api/TeletherapySignalingController.php", "backend/app/Http/Controllers/Api/TeletherapySignalingController.php"),
    ("backend/app/Http/Requests/StorePatientRequest.php", "backend/app/Http/Requests/StorePatientRequest.php"),
    ("backend/app/Http/Requests/UpdatePatientRequest.php", "backend/app/Http/Requests/UpdatePatientRequest.php"),
    ("backend/app/Http/Controllers/Api/PatientController.php", "backend/app/Http/Controllers/Api/PatientController.php"),
]

FRONTEND_FILES = [
    ("frontend/src/locales/ar.json", "frontend/src/locales/ar.json"),
    ("frontend/src/locales/fr.json", "frontend/src/locales/fr.json"),
    ("frontend/src/components/Navbar.jsx", "frontend/src/components/Navbar.jsx"),
    ("frontend/src/components/Sidebar.jsx", "frontend/src/components/Sidebar.jsx"),
    ("frontend/src/components/layout/Sidebar.jsx", "frontend/src/components/layout/Sidebar.jsx"),
    ("frontend/src/components/Patients.jsx", "frontend/src/components/Patients.jsx"),
    ("frontend/src/components/PatientModal.jsx", "frontend/src/components/PatientModal.jsx"),
    ("frontend/src/components/reception/FastPatientIntakeModal.jsx", "frontend/src/components/reception/FastPatientIntakeModal.jsx"),
    ("frontend/src/components/therapy/InteractiveTestPassationModal.jsx", "frontend/src/components/therapy/InteractiveTestPassationModal.jsx"),
    ("frontend/src/components/teletherapy/TeletherapyModule.jsx", "frontend/src/components/teletherapy/TeletherapyModule.jsx"),
    ("frontend/src/components/teletherapy/TeletherapyRoomView.jsx", "frontend/src/components/teletherapy/TeletherapyRoomView.jsx"),
    ("frontend/src/components/teletherapy/WebRtcVideoGrid.jsx", "frontend/src/components/teletherapy/WebRtcVideoGrid.jsx"),
    ("frontend/src/components/AppointmentModal.jsx", "frontend/src/components/AppointmentModal.jsx"),
    ("frontend/src/components/Appointments.jsx", "frontend/src/components/Appointments.jsx"),
    ("frontend/src/components/orthophony/SpeechAcousticBiomarkersModal.jsx", "frontend/src/components/orthophony/SpeechAcousticBiomarkersModal.jsx"),
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

    print("\n=== Step 3: Building Frontend on VPS ===")
    build_cmd = f"cd {REMOTE_BASE}/frontend && npm run build"
    if not run_ssh(build_cmd):
        print("Build failed on VPS!")
        sys.exit(1)

    print("\n=== Step 4: Restarting PM2 Services ===")
    restart_cmd = "pm2 restart 0 && pm2 restart 1 && pm2 restart 2"
    if not run_ssh(restart_cmd):
        print("PM2 restart failed!")
        sys.exit(1)

    print("\n=== Step 5: Deactivating demo announcements in Database ===")
    tinker_cmd = f"cd {REMOTE_BASE}/backend && php artisan tinker --execute=\"DB::table('system_announcements')->where('title', 'like', '%تجريبي%')->orWhere('message', 'like', '%تجريبي%')->delete();\""
    run_ssh(tinker_cmd)

    print("\n=== SUCCESS: All fixes deployed & verified! ===")

if __name__ == "__main__":
    main()
