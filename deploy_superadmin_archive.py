import tarfile
import subprocess
import os
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"
SCP_BIN = r"C:\Windows\System32\OpenSSH\scp.exe"
REMOTE_BASE = "/var/www/clinic-saas"
ARCHIVE_NAME = "patch_superadmin_geo_promos.tar.gz"

FILES_TO_PACK = [
    # Models
    "backend/app/Models/Tenant.php",
    "backend/app/Models/SubscriptionPlan.php",
    "backend/app/Models/DiscountCoupon.php",
    "backend/app/Models/AffiliateReferral.php",
    "backend/app/Models/CouponRedemption.php",
    "backend/app/Models/SaasPaymentRequest.php",
    "backend/app/Models/SaasInvoice.php",
    "backend/app/Models/ClinicSubscription.php",
    "backend/app/Models/ClinicAiQuota.php",
    "backend/app/Models/PlatformFeatureFlag.php",
    "backend/app/Models/SystemAnnouncement.php",
    "backend/app/Models/AuditLog.php",
    "backend/app/Models/BlockedIp.php",
    "backend/app/Models/AiTaskRoute.php",
    "backend/app/Models/AiProvider.php",
    "backend/app/Models/AiCostLog.php",
    "backend/app/Models/TenantDataSnapshot.php",
    "backend/app/Models/TeletherapyRoom.php",
    "backend/app/Models/CommunicationGateway.php",
    "backend/app/Models/PatientRecallLog.php",
    
    # Migrations
    "backend/database/migrations/2026_09_13_200000_add_features_to_subscription_plans_table.php",

    # Controllers
    "backend/app/Http/Controllers/Api/AuthController.php",
    "backend/app/Http/Controllers/Api/ClinicSubscriptionController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/SubscriptionPlanManagerController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/FeatureFlagController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/GeoClinicMapController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/PromoReferralEngineController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/ClinicOnboardingFunnelController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/SovereignControlTowerController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/SubscriptionLifecycleController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/SystemBroadcastController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/AiRoutingStudioController.php",
    "backend/app/Http/Controllers/Api/SuperAdmin/ServerTelemetryController.php",
    "backend/app/Http/Controllers/Api/SuperAdminController.php",
    "backend/app/Http/Controllers/Api/ClinicalAssessmentCatalogController.php",
    "backend/app/Http/Controllers/Api/PsychomotorAssessmentController.php",
    "backend/app/Http/Controllers/Api/KioskController.php",
    "backend/app/Http/Controllers/Api/ParentPortalController.php",
    "backend/app/Http/Controllers/Api/AttachmentController.php",
    "backend/app/Http/Controllers/Api/BackupController.php",
    "backend/app/Http/Controllers/Api/ClinicalAssessmentController.php",
    "backend/app/Http/Controllers/Api/ExerciseController.php",
    "backend/app/Http/Controllers/Api/DigitalTherapyController.php",
    "backend/app/Models/Invoice.php",
    "backend/app/Models/FinancialDocument.php",
    "backend/app/Http/Controllers/Api/InvoiceController.php",
    "backend/app/Http/Controllers/Api/DocumentProcessorController.php",
    "backend/resources/views/pdf/saas_invoice.blade.php",
    "backend/app/Http/Middleware/AddSecurityHeaders.php",
    "backend/bootstrap/app.php",
    "backend/routes/api.php",

    # Frontend
    "frontend/src/api.js",
    "frontend/src/i18n.js",
    "frontend/src/components/KioskCheckIn.jsx",

    "frontend/src/App.jsx",
    "frontend/src/components/Sidebar.jsx",
    "frontend/src/components/Login.jsx",
    "frontend/src/components/auth/TenantLoginView.jsx",
    "frontend/src/components/public/RegisterView.jsx",
    "frontend/src/components/assessments/ClinicalTestsCatalogHub.jsx",
    "frontend/src/components/assessments/InteractiveAssessmentRunner.jsx",
    "frontend/src/components/therapy/ExercisesBankView.jsx",
    "frontend/src/components/therapy/ExercisesCatalogData.js",
    "frontend/src/components/reception/FrontDeskReceptionCockpit.jsx",
    "frontend/src/components/teletherapy/TeletherapyModule.jsx",
    "frontend/src/components/teletherapy/TeletherapyRoomView.jsx",
    "frontend/src/components/teletherapy/PublicPatientTeletherapyRoom.jsx",
    "frontend/src/components/teletherapy/ClinicalInteractiveCanvas.jsx",
    "frontend/src/components/teletherapy/ClinicalCanvasData.js",
    "frontend/src/components/teletherapy/WebRtcVideoGrid.jsx",
    "frontend/src/components/ai-therapy/AiTherapyHubView.jsx",
    "frontend/src/components/analytics/AiDataAnalystView.jsx",
    "frontend/src/components/help/HelpCenterView.jsx",
    "frontend/src/components/settings/AiReceptionistSettingsView.jsx",
    "frontend/src/components/subscription/RenewSubscriptionModal.jsx",
    "frontend/src/components/subscription/SubscriptionStatusBanner.jsx",
    "frontend/src/components/subscription/SubscriptionManagerTab.jsx",
    "frontend/src/components/super-admin/SuperAdminDashboardView.jsx",
    "frontend/src/components/super-admin/SubscriptionPlansManagerView.jsx",
    "frontend/src/components/super-admin/ClinicManageModal.jsx",
    "frontend/src/components/super-admin/GeoClinicMapTab.jsx",
    "frontend/src/components/super-admin/PromosAndReferralsHubTab.jsx",
    "frontend/src/components/super-admin/SovereignControlTowerTab.jsx",
    "frontend/src/components/super-admin/SubscriptionChaserManagerTab.jsx",
    "frontend/src/components/public/LandingPageView.jsx",
    "backend/app/Http/Controllers/Api/SuperAdmin/LandingPageStudioController.php",
    "frontend/src/components/super-admin/LandingPageStudioTab.jsx",
    "frontend/src/components/ProtectedRoute.jsx",
    "frontend/src/components/Billing.jsx",
    "frontend/src/components/finance/CcpReconciliationModal.jsx",
    "frontend/src/components/finance/RecordPaymentModal.jsx",
    "frontend/src/components/finance/PrintReceiptModal.jsx",
    "frontend/src/components/finance/CreateInvoiceModal.jsx",
    "frontend/src/components/finance/DocumentProcessorView.jsx",
    "backend/app/Http/Controllers/Api/AppointmentController.php",
    "frontend/src/components/Appointments.jsx",
    "frontend/src/components/appointments/WhatsAppReminderModal.jsx",
    "backend/app/Http/Controllers/Api/PatientController.php",
    "frontend/src/components/portal/ParentPreIntakePortalView.jsx",
    "frontend/src/components/portal/PublicClinicBookingLandingView.jsx",
    "PRD.md",
    "PRD_EN.md",
]

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

    print("\n3. Extracting and clearing caches on VPS...")
    extract_cmd = (
        f"cd {REMOTE_BASE} && "
        f"tar -xzf {ARCHIVE_NAME} && "
        f"rm {ARCHIVE_NAME} && "
        f"cd backend && "
        f"php artisan optimize:clear && "
        f"php artisan config:clear && "
        f"php artisan cache:clear && "
        f"php artisan route:clear && "
        f"php artisan migrate --force && "
        f"cd ../frontend && "
        f"npm run build && "
        f"pm2 restart 0 && pm2 restart 1 && pm2 restart 2"
    )
    ssh_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, extract_cmd]
    res = subprocess.run(ssh_cmd, capture_output=True, encoding='utf-8', errors='replace')
    try:
        print(res.stdout)
    except UnicodeEncodeError:
        print(res.stdout.encode('ascii', 'replace').decode('ascii'))
    if res.stderr:
        try:
            print("STDERR:", res.stderr)
        except UnicodeEncodeError:
            print("STDERR:", res.stderr.encode('ascii', 'replace').decode('ascii'))

    print("\n4. Running Direct Endpoint Verification...")
    verify_script = """
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$user = App\\Models\\User::where('role', 'superadmin')->first();
if ($user) {
    Illuminate\\Support\\Facades\\Auth::login($user);
}

try {
    $geo = app(App\\Http\\Controllers\\Api\\SuperAdmin\\GeoClinicMapController::class);
    $res = $geo->getGeoOverview(request());
    echo '>>> GEO_MAP STATUS: OK (success=' . json_encode($res->getData()->success) . ', wilayas=' . count($res->getData()->wilayas) . ')\n';
} catch (Throwable $e) {
    echo '>>> GEO_MAP ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $promo = app(App\\Http\\Controllers\\Api\\SuperAdmin\\PromoReferralEngineController::class);
    $res = $promo->getOverview(request());
    echo '>>> PROMO_REFERRAL STATUS: OK (success=' . json_encode($res->getData()->success) . ', coupons=' . count($res->getData()->coupons) . ')\n';
} catch (Throwable $e) {
    echo '>>> PROMO_REFERRAL ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $funnel = app(App\\Http\\Controllers\\Api\\SuperAdmin\\ClinicOnboardingFunnelController::class);
    $res = $funnel->getFunnelOverview(request());
    echo '>>> ONBOARDING_FUNNEL STATUS: OK (success=' . json_encode($res->getData()->success) . ')\n';
} catch (Throwable $e) {
    echo '>>> ONBOARDING_FUNNEL ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $subCtrl = app(App\\Http\\Controllers\\Api\\ClinicSubscriptionController::class);
    $res = $subCtrl->getCurrentSubscription(request());
    $data = $res->getData();
    $plansCount = count($data->plans ?? []);
    $firstPlan = $data->plans[0] ?? null;
    $firstPrice = $firstPlan ? $firstPlan->price_yearly : 0;
    echo '>>> SUBSCRIPTION_CURRENT STATUS: OK (success=' . json_encode($data->success) . ', plans=' . $plansCount . ', first_plan=' . ($firstPlan->name_ar ?? 'none') . ', yearly_price=' . $firstPrice . ' DZD)\n';
} catch (Throwable $e) {
    echo '>>> SUBSCRIPTION_CURRENT ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}

try {
    $landingCtrl = app(App\\Http\\Controllers\\Api\\SuperAdmin\\LandingPageStudioController::class);
    $pubRes = $landingCtrl->getPublicConfig(request());
    $pubData = $pubRes->getData();
    echo '>>> LANDING_PAGE_STUDIO PUBLIC CONFIG: OK (success=' . json_encode($pubData->success) . ', brand=' . ($pubData->config->appearance->brandName ?? 'none') . ', faqs=' . count($pubData->config->faqs ?? []) . ')\n';
} catch (Throwable $e) {
    echo '>>> LANDING_PAGE_STUDIO ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() . '\n';
}
"""
    # Write local check script and upload via SCP
    local_test_file = os.path.join(r"E:\3", "test_check.php")
    with open(local_test_file, "w", encoding="utf-8") as tf:
        tf.write("<?php\n" + verify_script)
    
    subprocess.run([SCP_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", local_test_file, f"{HOST}:{REMOTE_BASE}/backend/test_check.php"], capture_output=True)
    if os.path.exists(local_test_file):
        os.remove(local_test_file)

    run_verify = f"cd {REMOTE_BASE}/backend && php test_check.php && rm test_check.php"
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, run_verify], capture_output=True, text=True)
    print(res.stdout)
    if res.stderr:
        print("VERIFY STDERR:", res.stderr)

if __name__ == '__main__':
    main()
