import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"

MODELS = [
    "Tenant.php",
    "SubscriptionPlan.php",
    "DiscountCoupon.php",
    "AffiliateReferral.php",
    "CouponRedemption.php",
    "SaasPaymentRequest.php",
    "SaasInvoice.php",
    "ClinicSubscription.php",
    "ClinicAiQuota.php",
    "PlatformFeatureFlag.php",
    "SystemAnnouncement.php",
    "AuditLog.php",
    "BlockedIp.php",
    "AiTaskRoute.php",
    "AiProvider.php",
    "AiCostLog.php",
    "TenantDataSnapshot.php",
    "TeletherapyRoom.php",
    "CommunicationGateway.php",
    "PatientRecallLog.php",
]

CONTROLLERS = [
    "GeoClinicMapController.php",
    "PromoReferralEngineController.php",
    "ClinicOnboardingFunnelController.php",
    "SovereignControlTowerController.php",
    "SubscriptionLifecycleController.php",
    "SystemBroadcastController.php",
    "AiRoutingStudioController.php",
    "ServerTelemetryController.php",
]

def run_ssh(remote_cmd):
    print(f">> SSH: {remote_cmd}")
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True)
    if res.stdout:
        print(res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    return res.returncode == 0

def scp(local_path, remote_path):
    print(f">> SCP: {local_path} -> {remote_path}")
    res = subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_path, f"{HOST}:{remote_path}"], capture_output=True, text=True)
    if res.returncode != 0:
        print("SCP ERROR:", res.stderr)
        return False
    return True

def main():
    print("=== 1. Deploying Models ===")
    for m in MODELS:
        local_f = os.path.join(r"E:\3\backend\app\Models", m)
        if os.path.exists(local_f):
            scp(local_f, f"{REMOTE_BASE}/backend/app/Models/{m}")

    print("=== 2. Deploying SuperAdmin Controllers ===")
    for c in CONTROLLERS:
        local_f = os.path.join(r"E:\3\backend\app\Http\Controllers\Api\SuperAdmin", c)
        if os.path.exists(local_f):
            scp(local_f, f"{REMOTE_BASE}/backend/app/Http/Controllers/Api/SuperAdmin/{c}")

    print("=== 3. Deploying Routes & Other Controllers ===")
    scp(r"E:\3\backend\routes\api.php", f"{REMOTE_BASE}/backend/routes/api.php")
    scp(r"E:\3\backend\app\Http\Controllers\Api\SuperAdminController.php", f"{REMOTE_BASE}/backend/app/Http/Controllers/Api/SuperAdminController.php")

    print("=== 4. Running Migrations & Clearing Cache on VPS ===")
    run_ssh(f"cd {REMOTE_BASE}/backend && php artisan optimize:clear && php artisan config:clear && php artisan cache:clear && php artisan route:clear && php artisan migrate --force")

    print("=== 5. Restarting PM2 ===")
    run_ssh("pm2 restart 0 && pm2 restart 1 && pm2 restart 2")

    print("=== 6. Testing Controllers in PHP CLI ===")
    test_php = """
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

try {
    $geo = app(App\\Http\\Controllers\\Api\\SuperAdmin\\GeoClinicMapController::class);
    $res = $geo->getGeoOverview(request());
    echo 'GEO_MAP: OK (' . json_encode($res->getData()->success) . ')\n';
} catch (Throwable $e) {
    echo 'GEO_MAP ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $promo = app(App\\Http\\Controllers\\Api\\SuperAdmin\\PromoReferralEngineController::class);
    $res = $promo->getOverview(request());
    echo 'PROMO_REFERRAL: OK (' . json_encode($res->getData()->success) . ')\n';
} catch (Throwable $e) {
    echo 'PROMO_REFERRAL ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $funnel = app(App\\Http\\Controllers\\Api\\SuperAdmin\\ClinicOnboardingFunnelController::class);
    $res = $funnel->getFunnelOverview(request());
    echo 'ONBOARDING_FUNNEL: OK (' . json_encode($res->getData()->success) . ')\n';
} catch (Throwable $e) {
    echo 'ONBOARDING_FUNNEL ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}
"""
    # Write to a temp test file on remote and run
    run_ssh(f"cat << 'EOF' > {REMOTE_BASE}/backend/test_superadmin_endpoints.php\n<?php\n{test_php}\nEOF")
    run_ssh(f"php {REMOTE_BASE}/backend/test_superadmin_endpoints.php")
    run_ssh(f"rm {REMOTE_BASE}/backend/test_superadmin_endpoints.php")

if __name__ == '__main__':
    main()
