import subprocess
import base64
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

cmd = """
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$plans = Illuminate\\Support\\Facades\\DB::table('subscription_plans')->get(['id', 'name_ar', 'slug', 'price_monthly', 'price_yearly']);
echo 'Subscription plans: ' . json_encode($plans, JSON_UNESCAPED_UNICODE) . PHP_EOL;
"""

b64 = base64.b64encode(cmd.encode()).decode()
remote_eval = f"cd /var/www/clinic-saas/backend && php -r 'eval(base64_decode(\"{b64}\"));'"
ssh_cmd = ['C:\\Windows\\System32\\OpenSSH\\ssh.exe', '-i', r'C:\Users\Nassim\.ssh\id_ed25519_vps', '-o', 'StrictHostKeyChecking=no', 'root@145.223.116.54', remote_eval]
res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
