import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_ai_therapy_audit_fixes.tar.gz"

FILES_TO_PACK = [
    "backend/app/Http/Controllers/Api/AiSpeechStudioController.php",
    "backend/app/Http/Controllers/Api/SpeechFluencyAnalyzerController.php",
    "backend/app/Http/Controllers/Api/AiTherapyHubController.php",
    "backend/app/Http/Controllers/Api/AiRadioPodcastController.php",
    "backend/app/Jobs/GenerateClinicalVideoJob.php",
    "backend/app/Http/Controllers/Api/AiImageStudioController.php",
    "frontend/src/components/ai-therapy/SocialStoriesStudio.jsx",
    "frontend/src/components/ai-therapy/AiTherapyHubView.jsx",
    "frontend/src/components/ai-therapy/AiClinicalSpeechStudio.jsx",
    "frontend/src/components/common/AiQuotaProgressBar.jsx",
    "frontend/src/api.js",
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

    print("\n3. Extracting, Checking PHP syntax, Building Vite, and Restarting PM2 on VPS...")
    remote_script = f"""
set -e
cd {REMOTE_BASE}
tar -xzf {ARCHIVE_NAME}
rm -f {ARCHIVE_NAME}

echo "--> Checking PHP syntax on modified backend files..."
php -l backend/app/Http/Controllers/Api/AiSpeechStudioController.php
php -l backend/app/Http/Controllers/Api/SpeechFluencyAnalyzerController.php
php -l backend/app/Http/Controllers/Api/AiTherapyHubController.php
php -l backend/app/Http/Controllers/Api/AiRadioPodcastController.php
php -l backend/app/Jobs/GenerateClinicalVideoJob.php
php -l backend/app/Http/Controllers/Api/AiImageStudioController.php

echo "--> Building Vite Frontend..."
cd frontend
npm run build

echo "--> Restarting PM2 Processes..."
pm2 restart 0
pm2 restart 1
pm2 restart 2

echo "--> PM2 Process List:"
pm2 status
echo "=== AI THERAPY AUDIT DEPLOYMENT COMPLETE ==="
"""
    ssh_cmd = [
        SSH_BIN,
        "-i", SSH_KEY,
        "-o", "StrictHostKeyChecking=no",
        "-o", "ConnectTimeout=45",
        "-o", "ServerAliveInterval=15",
        "-o", "ServerAliveCountMax=5",
        HOST,
        remote_script
    ]
    res = subprocess.run(ssh_cmd, capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("STDERR/Notice:", res.stderr)

    if res.returncode != 0:
        print("Deployment failed with error code:", res.returncode)
        sys.exit(1)

    print("\n=== ALL AI THERAPY AUDIT FIXES DEPLOYED SUCCESSFULLY! ===")

if __name__ == "__main__":
    main()
