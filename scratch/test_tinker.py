import subprocess
import os

SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'
HOST = 'root@145.223.116.54'
SSH_BIN = r'C:\Windows\System32\OpenSSH\ssh.exe'
SCP_BIN = r'C:\Windows\System32\OpenSSH\scp.exe'

php_code = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap();

$ctrl = app(App\\Http\\Controllers\\Api\\SuperAdmin\\LandingPageStudioController::class);

// Test 1: Get public config
$res = $ctrl->getPublicConfig(request());
$data = $res->getData();
echo '>>> 1. PUBLIC_CONFIG: success=' . json_encode($data->success) . ', brand=' . $data->config->appearance->brandName . PHP_EOL;

// Test 2: Update config as SuperAdmin
$user = App\\Models\\User::where('role', 'superadmin')->first();
if ($user) {
    Illuminate\\Support\\Facades\\Auth::login($user);
}

$newCfg = json_decode(json_encode($data->config), true);
$newCfg['appearance']['brandName'] = 'PsyPro E2E Test';
$newCfg['announcement']['enabled'] = true;
$newCfg['announcement']['text'] = 'عرض استثنائي للعيادات في 58 ولاية';

$req = Illuminate\\Http\\Request::create('/api/superadmin/landing-page-config', 'PUT', ['config' => $newCfg]);
$updRes = $ctrl->updateConfig($req);
echo '>>> 2. UPDATE_CONFIG: success=' . json_encode($updRes->getData()->success) . PHP_EOL;

// Test 3: Verify updated public config
$resAfter = $ctrl->getPublicConfig(request());
$dataAfter = $resAfter->getData();
echo '>>> 3. AFTER_UPDATE: brand=' . $dataAfter->config->appearance->brandName . ', announcement=' . $dataAfter->config->announcement->text . PHP_EOL;

// Test 4: Reset back to default
$resetRes = $ctrl->resetConfig(request());
echo '>>> 4. RESET_CONFIG: success=' . json_encode($resetRes->getData()->success) . PHP_EOL;

// Test 5: Verify default restored
$resFinal = $ctrl->getPublicConfig(request());
$dataFinal = $resFinal->getData();
echo '>>> 5. AFTER_RESET: brand=' . $dataFinal->config->appearance->brandName . ', announcement_enabled=' . json_encode($dataFinal->config->announcement->enabled) . PHP_EOL;
"""

local_path = os.path.join(r"E:\3", "test_runner.php")
with open(local_path, "w", encoding="utf-8") as f:
    f.write(php_code)

subprocess.run([SCP_BIN, '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', local_path, f'{HOST}:/var/www/clinic-saas/backend/test_runner.php'], capture_output=True)
if os.path.exists(local_path):
    os.remove(local_path)

cmd = "cd /var/www/clinic-saas/backend && php test_runner.php && rm test_runner.php"
res = subprocess.run([SSH_BIN, '-i', SSH_KEY, '-o', 'StrictHostKeyChecking=no', HOST, cmd], capture_output=True, encoding='utf-8', errors='replace')
try:
    print(res.stdout)
except UnicodeEncodeError:
    print(res.stdout.encode('ascii', 'replace').decode('ascii'))

if res.stderr:
    try:
        print('STDERR:', res.stderr)
    except UnicodeEncodeError:
        print('STDERR:', res.stderr.encode('ascii', 'replace').decode('ascii'))

