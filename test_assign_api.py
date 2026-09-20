import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def main():
    remote_test = r"""
cat << 'EOF' > /tmp/test_assign.php
<?php
require '/var/www/clinic-saas/backend/vendor/autoload.php';
$app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$patient = App\Models\Patient::first();
if ($patient) {
    $req = new Illuminate\Http\Request();
    $req->replace([
        'title' => 'تمرين مخارج الحروف التجريبي - حرف السين',
        'instructions' => 'نطق صوت السين أمام المرآة لمدة 5 دقائق يومياً مع ملاحظة وضع اللسان.',
        'category' => 'articulation',
        'duration_minutes' => 10,
        'frequency' => 'يومياً',
        'due_date' => now()->addDays(7)->toDateString()
    ]);
    $c = new App\Http\Controllers\Api\ParentPortalController();
    $res = $c->assignHomeworkByPractitioner($req, (string)$patient->id);
    $data = $res->getData();
    echo "ASSIGN SUCCESS: " . ($data->success ? 'true' : 'false') . "\n";
    echo "HOMEWORK ID: " . $data->homework->id . "\n";
    echo "TITLE: " . $data->homework->title . "\n";
    echo "PORTAL LINK: " . $data->portal_url . "\n";
}
EOF
php /tmp/test_assign.php && rm -f /tmp/test_assign.php
"""
    cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_test]
    res = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

if __name__ == "__main__":
    main()
