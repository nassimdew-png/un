import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

script = r"""
import subprocess

php_code = r'''
$tenant = \\App\\Models\\Tenant::find("c4e72bc0-c41c-47c7-8009-d8e6642fcd41");
echo "Tenant: " . ($tenant ? $tenant->name : "NOT FOUND") . " | Subdomain: " . ($tenant ? $tenant->subdomain : "") . "\\n";

$users = \\App\\Models\\User::withoutGlobalScopes()->where("tenant_id", "c4e72bc0-c41c-47c7-8009-d8e6642fcd41")->get();
foreach ($users as $u) {
    echo "User: {$u->id} | {$u->email} | {$u->role} | is_super_admin: {$u->is_super_admin}\\n";
}

$logsForTenant = \\App\\Models\\AuditLog::where("tenant_id", "c4e72bc0-c41c-47c7-8009-d8e6642fcd41")->get();
echo "Logs for this tenant count: " . $logsForTenant->count() . "\\n";
foreach ($logsForTenant as $l) {
    echo "Log {$l->id}: User={$l->user_email}, Action={$l->action}, Event={$l->event_type}, Date={$l->created_at}\\n";
}

// Now simulate AuditLogController::index request as this tenant's user!
$targetUser = $users->first();
if ($targetUser) {
    \\Illuminate\\Support\\Facades\\Auth::setUser($targetUser);
    $request = \\Illuminate\\Http\\Request::create("/api/audit-logs", "GET");
    $ctrl = new \\App\\Http\\Controllers\\Api\\AuditLogController();
    $resp = $ctrl->index($request);
    $data = json_decode($resp->getContent(), true);
    echo "Simulated /api/audit-logs count: " . count($data["data"] ?? []) . "\\n";
    foreach ($data["data"] ?? [] as $row) {
        echo "Row: {$row['id']} | {$row['user_email']} | {$row['action']} | {$row['created_at']}\\n";
    }

    // Also simulate with date filter '2026-09-13'
    $requestDate = \\Illuminate\\Http\\Request::create("/api/audit-logs?start_date=2026-09-13", "GET");
    $respDate = $ctrl->index($requestDate);
    $dataDate = json_decode($respDate->getContent(), true);
    echo "Simulated with start_date=2026-09-13 count: " . count($dataDate["data"] ?? []) . "\\n";

    // Also simulate with search 'superadmin'
    $requestSearch = \\Illuminate\\Http\\Request::create("/api/audit-logs?search=superadmin", "GET");
    $respSearch = $ctrl->index($requestSearch);
    $dataSearch = json_decode($respSearch->getContent(), true);
    echo "Simulated with search=superadmin count: " . count($dataSearch["data"] ?? []) . "\\n";
}
'''

res = subprocess.run(['php', 'artisan', 'tinker', '--execute', php_code], cwd='/var/www/clinic-saas/backend', capture_output=True, text=True)
with open('/tmp/test_audit_out.txt', 'w', encoding='utf-8') as f:
    f.write(res.stdout)
    if res.stderr:
        f.write("\\nSTDERR:\\n" + res.stderr)
print("WROTE OUTPUT TO /tmp/test_audit_out.txt")
"""

cmd = [
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST,
    "python3"
]

res = subprocess.run(cmd, input=script, capture_output=True, text=True, encoding="utf-8", errors="replace")
print("CODE:", res.returncode)
print("STDOUT:", res.stdout)
print("STDERR:", res.stderr)

# Now cat /tmp/test_audit_out.txt
cat_cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "cat /tmp/test_audit_out.txt"]
cat_res = subprocess.run(cat_cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
import sys
sys.stdout.buffer.write(cat_res.stdout.encode('utf-8', errors='replace'))
