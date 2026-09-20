import subprocess
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

remote_cmd = r"""
cd /var/www/clinic-saas/backend
php -r '
require "vendor/autoload.php";
$app = require_once "bootstrap/app.php";
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$ctrl = new \App\Http\Controllers\Api\SuperAdmin\StudentOfferController();

// 1. Test getConfig
$req1 = new \Illuminate\Http\Request();
$resp1 = $ctrl->getConfig($req1);
$data1 = json_decode($resp1->getContent(), true);
echo "1. getConfig Success: " . ($data1["success"] ? "YES" : "NO") . PHP_EOL;
echo "   Config Duration: " . $data1["config"]["duration_months"] . " months" . PHP_EOL;
echo "   Total Applications: " . $data1["stats"]["total_applications"] . PHP_EOL;
echo "   Active Students: " . $data1["stats"]["active_students"] . PHP_EOL;

// 2. Test getApplications
$resp2 = $ctrl->getApplications($req1);
$data2 = json_decode($resp2->getContent(), true);
echo "2. getApplications Success: " . ($data2["success"] ? "YES" : "NO") . PHP_EOL;
echo "   Applications Count: " . count($data2["applications"]) . PHP_EOL;
echo "   First Applicant: " . $data2["applications"][0]["student_name"] . PHP_EOL;

// 3. Test extendApplication (add 3 months)
$v = \App\Models\AcademicVerification::first();
$req3 = \Illuminate\Http\Request::create("/dummy", "POST", ["months" => 3]);
$resp3 = $ctrl->extendApplication($req3, $v->id);
$data3 = json_decode($resp3->getContent(), true);
echo "3. extendApplication Success: " . ($data3["success"] ? "YES" : "NO") . PHP_EOL;
echo "   New Expiry: " . $data3["application"]["expires_at"] . PHP_EOL;
echo "   Message: " . $data3["message"] . PHP_EOL;
'
"""

res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True, encoding="utf-8")
print(res.stdout)
if res.stderr:
    print("Errors:", res.stderr)
