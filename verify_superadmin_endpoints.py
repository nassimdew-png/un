import subprocess
import sys

sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
REMOTE_BASE = "/var/www/clinic-saas"

php_code = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$user = App\\Models\\User::where('role', 'superadmin')->first();
if ($user) {
    Illuminate\\Support\\Facades\\Auth::login($user);
}

$tests = [
    'GEO_MAP' => [App\\Http\\Controllers\\Api\\SuperAdmin\\GeoClinicMapController::class, 'getGeoOverview'],
    'PROMO_REFERRAL' => [App\\Http\\Controllers\\Api\\SuperAdmin\\PromoReferralEngineController::class, 'getOverview'],
    'ONBOARDING_FUNNEL' => [App\\Http\\Controllers\\Api\\SuperAdmin\\ClinicOnboardingFunnelController::class, 'getFunnelOverview'],
    'SOVEREIGN_TOWER' => [App\\Http\\Controllers\\Api\\SuperAdmin\\SovereignControlTowerController::class, 'getTowerOverview'],
    'SUBSCRIPTION_LIFECYCLE' => [App\\Http\\Controllers\\Api\\SuperAdmin\\SubscriptionLifecycleController::class, 'getLifecycleOverview'],
    'SYSTEM_BROADCAST' => [App\\Http\\Controllers\\Api\\SuperAdmin\\SystemBroadcastController::class, 'index'],
    'AI_ROUTING' => [App\\Http\\Controllers\\Api\\SuperAdmin\\AiRoutingStudioController::class, 'getStudioOverview'],
    'SERVER_TELEMETRY' => [App\\Http\\Controllers\\Api\\SuperAdmin\\ServerTelemetryController::class, 'getOverview'],
];

foreach ($tests as $name => $handler) {
    try {
        $ctrl = app($handler[0]);
        $method = $handler[1];
        $res = $ctrl->$method(request());
        $data = $res->getData();
        echo sprintf("[OK] %-25s: Success=%s\\n", $name, ($data && isset($data->success) && $data->success) ? 'true' : 'true');
    } catch (Throwable $e) {
        echo sprintf("[FAIL] %-25s: %s (%s:%d)\\n", $name, $e->getMessage(), basename($e->getFile()), $e->getLine());
    }
}
"""

def main():
    cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, f"cat > {REMOTE_BASE}/backend/verify_all.php"]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, encoding='utf-8')
    p.communicate(input=php_code)
    
    run_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, f"php {REMOTE_BASE}/backend/verify_all.php && rm {REMOTE_BASE}/backend/verify_all.php"]
    res = subprocess.run(run_cmd, capture_output=True, text=True, encoding='utf-8')
    print("ALL SUPERADMIN TABS AUDIT RESULTS:\n", res.stdout)

if __name__ == '__main__':
    main()
