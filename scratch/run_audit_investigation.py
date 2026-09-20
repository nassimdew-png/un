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

echo "=== RECENT TENANTS ===\\n";
$recentTenants = Tenant::orderBy('created_at', 'desc')->take(10)->get();
foreach ($recentTenants as $rt) {
    $c = AuditLog::where('tenant_id', (string)$rt->id)->count();
    echo "Tenant {$rt->id} | {$rt->name} ({$rt->subdomain}) | created: {$rt->created_at} | logs: {$c}\\n";
}

echo "\\n=== LAST 15 AUDIT LOGS ===\\n";
$recentLogs = AuditLog::orderBy('id', 'desc')->take(15)->get();
foreach ($recentLogs as $rl) {
    echo "Log #{$rl->id} | tenant: {$rl->tenant_id} | user: {$rl->user_email} | action: {$rl->action} | date: {$rl->created_at}\\n";
}

$users = User::withoutGlobalScopes()->get();

    // Now test API query
    $targetUser = $users->first();
    if ($targetUser) {
        echo "\\n=== 2. TESTING AuditLogController::index AS USER {$targetUser->email} ===\\n";
        Auth::guard('sanctum')->setUser($targetUser);
        Auth::setUser($targetUser);

        $ctrl = new AuditLogController();

        // Query 1: Default /api/audit-logs
        $req1 = Request::create('/api/audit-logs', 'GET');
        $res1 = json_decode($ctrl->index($req1)->getContent(), true);
        echo "Query 1 (No filters) Count: " . count($res1['data'] ?? []) . " (Total: " . ($res1['pagination']['total'] ?? 0) . ")\\n";
        foreach ($res1['data'] ?? [] as $row) {
            echo "    -> Row #{$row['id']}: {$row['user_email']} | {$row['action']} | {$row['created_at']}\\n";
        }

        // Query 2: With search=superadmin
        $req2 = Request::create('/api/audit-logs', 'GET', ['search' => 'superadmin']);
        $res2 = json_decode($ctrl->index($req2)->getContent(), true);
        echo "Query 2 (search=superadmin) Count: " . count($res2['data'] ?? []) . "\\n";
        foreach ($res2['data'] ?? [] as $row) {
            echo "    -> Row #{$row['id']}: {$row['user_email']} | {$row['action']} | {$row['created_at']}\\n";
        }

        // Query 3: With start_date=2026-09-13
        $req3 = Request::create('/api/audit-logs', 'GET', ['start_date' => '2026-09-13']);
        $res3 = json_decode($ctrl->index($req3)->getContent(), true);
        echo "Query 3 (start_date=2026-09-13) Count: " . count($res3['data'] ?? []) . "\\n";
        foreach ($res3['data'] ?? [] as $row) {
            echo "    -> Row #{$row['id']}: {$row['user_email']} | {$row['action']} | {$row['created_at']}\\n";
        }

        // Query 4: With date_from=2026-09-13
        $req4 = Request::create('/api/audit-logs', 'GET', ['date_from' => '2026-09-13']);
        $res4 = json_decode($ctrl->index($req4)->getContent(), true);
        echo "Query 4 (date_from=2026-09-13) Count: " . count($res4['data'] ?? []) . "\\n";

        // Query 5: What is the server timezone and date of the logs?
        echo "\\n=== 3. TIMEZONE & DATES ===\\n";
        echo "App Timezone: " . config('app.timezone') . "\\n";
        echo "Now: " . now()->toIso8601String() . "\\n";
        echo "DB current timestamp: " . \\Illuminate\\Support\\Facades\\DB::select('SELECT NOW() as now')[0]->now . "\\n";
    }
}
"""

upload_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "cat > /var/www/clinic-saas/backend/test_audit_investigate.php"]
p = subprocess.Popen(upload_cmd, stdin=subprocess.PIPE, text=True, encoding="utf-8")
p.communicate(input=php_script)

run_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "php /var/www/clinic-saas/backend/test_audit_investigate.php && rm -f /var/www/clinic-saas/backend/test_audit_investigate.php"]
res = subprocess.run(run_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
sys.stdout.buffer.write(res.stdout.encode('utf-8', errors='replace'))
if res.stderr:
    sys.stderr.buffer.write(res.stderr.encode('utf-8', errors='replace'))
