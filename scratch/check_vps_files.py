import subprocess

script = """
import os
missing = [
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
base = '/var/www/clinic-saas/'
for m in missing:
    p = os.path.join(base, m)
    print(m, 'EXISTS' if os.path.exists(p) else 'MISSING')
"""

cmd = [
    r"C:\Windows\System32\OpenSSH\ssh.exe",
    "-i", r"C:\Users\Nassim\.ssh\id_ed25519_vps",
    "-o", "StrictHostKeyChecking=no",
    "root@145.223.116.54",
    f"python3 -c \"{script}\""
]

res = subprocess.run(cmd, capture_output=True, text=True)
print(res.stdout)
