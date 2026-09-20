import tarfile
import subprocess
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_b2b_sessions_tv.tar.gz"

FILES_TO_PACK = [
    # Database Migration
    "backend/database/migrations/2026_09_14_000001_add_b2b_subscription_fields_to_invoices_table.php",

    # Backend Models & Controllers
    "backend/app/Models/Invoice.php",
    "backend/app/Http/Controllers/Api/InvoiceController.php",
    "backend/app/Http/Controllers/Api/TherapySessionController.php",
    "backend/app/Http/Controllers/Api/QueueController.php",
    "backend/app/Http/Controllers/Api/KioskController.php",
    "backend/routes/api.php",
    "backend/seed_tv_and_sessions.php",

    # PDF Templates
    "backend/resources/views/pdf/invoice_receipt.blade.php",

    # Frontend Core & Routes
    "frontend/src/api.js",
    "frontend/src/App.jsx",

    # Frontend Components - Finance / B2B Invoicing
    "frontend/src/components/Billing.jsx",
    "frontend/src/components/finance/CreateInvoiceModal.jsx",
    "frontend/src/components/finance/PrintReceiptModal.jsx",

    # Frontend Components - Therapy Sessions & Closure
    "frontend/src/components/TherapySessions.jsx",
    "frontend/src/components/sessions/SessionClosureSummaryModal.jsx",

    # Frontend Components - Public Landing & Waiting TV / Kiosk
    "frontend/src/components/public/LandingPageView.jsx",
    "frontend/src/components/WaitingRoomTvScreen.jsx",
    "frontend/src/components/KioskCheckIn.jsx",
]

def run_ssh(cmd):
    full_cmd = [
        SSH_BIN,
        "-i", SSH_KEY,
        "-o", "StrictHostKeyChecking=no",
        HOST,
        cmd
    ]
    res = subprocess.run(full_cmd, capture_output=True, encoding='utf-8', errors='replace')
    return res

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

    print("\n3. Extracting and running migration on VPS...")
    extract_cmd = (
        f"cd {REMOTE_BASE} && "
        f"tar -xzf {ARCHIVE_NAME} && "
        f"rm {ARCHIVE_NAME} && "
        f"cd backend && "
        f"php artisan optimize:clear && "
        f"php artisan config:clear && "
        f"php artisan route:clear && "
        f"php artisan migrate --force"
    )
    res = run_ssh(extract_cmd)
    print("Migration output:\n", res.stdout)
    if res.stderr:
        print("Migration stderr:\n", res.stderr)

    print("\n4. Running seed_tv_and_sessions.php on VPS...")
    seed_cmd = f"cd {REMOTE_BASE}/backend && php seed_tv_and_sessions.php && rm seed_tv_and_sessions.php"
    res = run_ssh(seed_cmd)
    print("Seed output:\n", res.stdout)
    if res.stderr:
        print("Seed stderr:\n", res.stderr)

    print("\n5. Building frontend on VPS...")
    build_cmd = f"cd {REMOTE_BASE}/frontend && npm run build"
    res = run_ssh(build_cmd)
    print("Build output:\n", res.stdout)
    if res.stderr:
        print("Build stderr:\n", res.stderr)

    print("\n6. Restarting PM2 processes on VPS...")
    restart_cmd = "pm2 restart 0 && pm2 restart 1 && pm2 restart 2 && pm2 status"
    res = run_ssh(restart_cmd)
    print("PM2 status:\n", res.stdout)

if __name__ == "__main__":
    main()
