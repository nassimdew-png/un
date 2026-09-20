import subprocess
import os

FILES_TO_SYNC = [
  'frontend/src/components/public/SpecialtyAssessmentFinderModal.jsx',
  'frontend/src/components/public/FloatingClinicalAdvisor.jsx',
  'frontend/src/components/super-admin/SuperAdminOverviewTab.jsx',
  'frontend/src/components/super-admin/AiGatewayMonitorTab.jsx',
  'frontend/src/components/super-admin/AnnouncementsManagerTab.jsx',
  'frontend/src/components/super-admin/SystemDevOpsTab.jsx',
  'frontend/src/components/super-admin/ClinicHealthTab.jsx',
  'frontend/src/components/super-admin/SystemSettingsTab.jsx',
  'frontend/src/components/super-admin/QuotasAndLimitsTab.jsx',
  'frontend/src/components/super-admin/AffiliatesTab.jsx',
  'frontend/src/components/therapy/modules/ComprehensionTherapyModule.jsx'
]

for rel_path in FILES_TO_SYNC:
    local_path = os.path.join(r"E:\3", os.path.normpath(rel_path))
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    remote_path = f"root@145.223.116.54:/var/www/clinic-saas/{rel_path}"
    cmd = [
        r"C:\Windows\System32\OpenSSH\scp.exe",
        "-i", r"C:\Users\Nassim\.ssh\id_ed25519_vps",
        "-o", "StrictHostKeyChecking=no",
        remote_path,
        local_path
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"[OK] Synced: {rel_path}")
    else:
        print(f"[FAIL] {rel_path}: {res.stderr}")
