import subprocess
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"

remote_cmd = """
cd /var/www/clinic-saas/backend
php artisan tinker --execute="
\\$ctrl = new App\\Http\\Controllers\\Api\\ClinicalAssessmentCatalogController();
\\$r1 = \\$ctrl->index(request()->merge(['specialty' => 'orthophonie']));
\\$r2 = \\$ctrl->index(request()->merge(['specialty' => 'psychologie_clinique']));
\\$r3 = \\$ctrl->index(request()->merge(['specialty' => 'psychomotricite']));
echo 'Orthophonie: ' . count(\\$r1->getData()->tests) . PHP_EOL;
echo 'Psychologie: ' . count(\\$r2->getData()->tests) . PHP_EOL;
echo 'Psychomotricite: ' . count(\\$r3->getData()->tests) . PHP_EOL;
"
"""

res = subprocess.run([
    r"C:\Windows\System32\OpenSSH\ssh.exe",
    "-i", SSH_KEY,
    "-o", "StrictHostKeyChecking=no",
    HOST,
    remote_cmd
], capture_output=True, text=True, encoding='utf-8')

sys.stdout.buffer.write(res.stdout.encode('utf-8'))
