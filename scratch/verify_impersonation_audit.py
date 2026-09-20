import subprocess
import sys

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_script = """<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

use App\\Models\\AuditLog;
use App\\Models\\Tenant;
use App\\Models\\User;
use Illuminate\\Support\\Facades\\Auth;
use Illuminate\\Http\\Request;
use App\\Http\\Controllers\\Api\\AuditLogController;
use App\\Http\\Controllers\\Api\\SuperAdminController;

echo "=== 1. PICKING TARGET CLINIC ===\\n";
$tenant = Tenant::first();
echo "Target Tenant: {$tenant->id} | {$tenant->name} ({$tenant->subdomain})\\n";

// 2. Perform Impersonation
echo "\\n=== 2. CALLING impersonateClinic() ===\\n";
$superAdmin = User::withoutGlobalScopes()->where('role', 'superadmin')->orWhere('is_super_admin', true)->first();
Auth::guard('sanctum')->setUser($superAdmin);
Auth::setUser($superAdmin);

$superCtrl = new SuperAdminController();
$impReq = Request::create("/api/super-admin/clinics/{$tenant->id}/impersonate", "POST");
$impRes = $superCtrl->impersonateClinic($impReq, (string)$tenant->id);
$impData = json_decode($impRes->getContent(), true);

echo "impersonateClinic response status: " . ($impData['status'] ?? 'unknown') . "\\n";
echo "Issued Token: " . (substr($impData['token'] ?? '', 0, 15)) . "...\\n";
echo "Target User: " . ($impData['user']['email'] ?? '') . "\\n";

// 3. Verify latest audit log in database
echo "\\n=== 3. VERIFYING AUDIT LOG IN DB ===\\n";
$latestLog = AuditLog::where('tenant_id', (string)$tenant->id)
    ->where('event_type', 'like', '%impersonat%')
    ->orderBy('id', 'desc')
    ->first();

if ($latestLog) {
    echo "SUCCESS: Found Log #{$latestLog->id}!\\n";
    echo "  - tenant_id: {$latestLog->tenant_id}\\n";
    echo "  - user_email: {$latestLog->user_email}\\n";
    echo "  - user_name: {$latestLog->user_name}\\n";
    echo "  - user_role: {$latestLog->user_role}\\n";
    echo "  - event_type: {$latestLog->event_type}\\n";
    echo "  - action: {$latestLog->action}\\n";
    echo "  - auditable_type: {$latestLog->auditable_type}\\n";
    echo "  - created_at: {$latestLog->created_at}\\n";
} else {
    echo "FAILED: No impersonation audit log found for tenant!\\n";
}

// 4. Test querying from Clinic Workspace as the Clinic Admin!
echo "\\n=== 4. QUERYING AS CLINIC ADMIN (Active Impersonation Context) ===\\n";
$clinicAdmin = User::withoutGlobalScopes()->find($impData['user']['id']);
Auth::guard('sanctum')->setUser($clinicAdmin);
Auth::setUser($clinicAdmin);

$auditCtrl = new AuditLogController();

// Test A: No filters
$reqA = Request::create("/api/audit-logs", "GET");
$resA = json_decode($auditCtrl->index($reqA)->getContent(), true);
echo "Test A (No filters) Count: " . count($resA['data'] ?? []) . "\\n";

// Test B: Searching for SuperAdmin Email (the exact test case!)
$reqB = Request::create("/api/audit-logs?search=superadmin", "GET");
$resB = json_decode($auditCtrl->index($reqB)->getContent(), true);
echo "Test B (search=superadmin) Count: " . count($resB['data'] ?? []) . "\\n";
if (!empty($resB['data'])) {
    echo "  -> Found: ID {$resB['data'][0]['id']} | User: {$resB['data'][0]['user_email']} | Action: {$resB['data'][0]['action']}\\n";
}

// Test C: Date filter = 2026-09-13 (the exact test case that failed previously due to date exact match!)
$reqC = Request::create("/api/audit-logs?start_date=2026-09-13", "GET");
$resC = json_decode($auditCtrl->index($reqC)->getContent(), true);
echo "Test C (start_date=2026-09-13) Count: " . count($resC['data'] ?? []) . "\\n";
if (!empty($resC['data'])) {
    echo "  -> Found: ID {$resC['data'][0]['id']} | User: {$resC['data'][0]['user_email']} | Action: {$resC['data'][0]['action']}\\n";
}

// Test D: Both search=superadmin AND start_date=2026-09-13
$reqD = Request::create("/api/audit-logs?search=superadmin&start_date=2026-09-13", "GET");
$resD = json_decode($auditCtrl->index($reqD)->getContent(), true);
echo "Test D (search=superadmin & start_date=2026-09-13) Count: " . count($resD['data'] ?? []) . "\\n";
if (!empty($resD['data'])) {
    echo "  -> Found: ID {$resD['data'][0]['id']} | User: {$resD['data'][0]['user_email']} | Action: {$resD['data'][0]['action']}\\n";
}

// 5. Test stopImpersonation()
echo "\\n=== 5. CALLING stopImpersonation() ===\\n";
$stopReq = Request::create("/api/impersonate/stop", "POST", ['tenant_id' => (string)$tenant->id]);
$stopRes = $superCtrl->stopImpersonation($stopReq);
$stopData = json_decode($stopRes->getContent(), true);
echo "stopImpersonation response status: " . ($stopData['status'] ?? 'unknown') . "\\n";

$stopLog = AuditLog::where('tenant_id', (string)$tenant->id)
    ->where('event_type', 'auth.impersonation_end')
    ->orderBy('id', 'desc')
    ->first();
if ($stopLog) {
    echo "SUCCESS: Found stop log #{$stopLog->id}! user: {$stopLog->user_email}\\n";
}
"""

upload_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "cat > /var/www/clinic-saas/backend/verify_impersonation_test.php"]
p = subprocess.Popen(upload_cmd, stdin=subprocess.PIPE, text=True, encoding="utf-8")
p.communicate(input=php_script)

run_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "php /var/www/clinic-saas/backend/verify_impersonation_test.php && rm -f /var/www/clinic-saas/backend/verify_impersonation_test.php"]
res = subprocess.run(run_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
sys.stdout.buffer.write(res.stdout.encode('utf-8', errors='replace'))
if res.stderr:
    sys.stderr.buffer.write(res.stderr.encode('utf-8', errors='replace'))
