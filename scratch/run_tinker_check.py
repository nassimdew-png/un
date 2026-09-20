import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

php_script = """<?php
require '/var/www/clinic-saas/backend/vendor/autoload.php';
$app = require_once '/var/www/clinic-saas/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\\Contracts\\Console\\Kernel::class);
$kernel->bootstrap();

$plans = App\\Models\\SubscriptionPlan::all();
foreach ($plans as $p) {
    $f = $p->features ?? [];
    $f['kiosk_self_checkin'] = true;
    $f['waiting_room_tv_queue'] = true;
    $p->features = $f;
    $p->save();
    echo "Plan: " . $p->slug . " => Kiosk: ENABLED, TV: ENABLED\\n";
}

$sessions = App\\Models\\TherapySession::count();
echo "Total Therapy Sessions in Database: " . $sessions . "\\n";

$tenants = App\\Models\\Tenant::all();
foreach ($tenants as $tenant) {
    $scnt = App\\Models\\TherapySession::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count();
    if ($scnt < 2) {
        $p = App\\Models\\Patient::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
        if (!$p) {
            $p = App\\Models\\Patient::withoutGlobalScopes()->create([
                'tenant_id' => $tenant->id,
                'first_name' => 'وليد',
                'last_name' => 'براهيمي',
                'birth_date' => '2018-06-12',
                'phone' => '0550123456',
                'gender' => 'male',
                'folder_number' => 'DOS-2026-001',
                'kiosk_pin' => '1234',
            ]);
        }
        App\\Models\\TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'patient_id' => $p->id,
            'specialist_id' => 1,
            'session_date' => now()->subDays(1),
            'duration_minutes' => 45,
            'attendance_status' => 'present',
            'specialty' => 'orthophony',
            'exercises_targeted' => ['نطق مخارج الحروف الشفوية (ب، م، و)', 'تمارين التنفس البطني والتحكم الصوتي'],
            'progress_notes' => 'جلسة ناجحة ومكتملة، استقرار في التثبيت النطقي وتجاوب ممتاز.',
        ]);
        App\\Models\\TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'patient_id' => $p->id,
            'specialist_id' => 1,
            'session_date' => now(),
            'duration_minutes' => 45,
            'attendance_status' => 'present',
            'specialty' => 'orthophony',
            'exercises_targeted' => ['تأهيل السلاسة الكلامية', 'الوعي الفونولوجي'],
            'progress_notes' => 'إتمام أهداف الخطة الفردية لليوم مع تكليف بتمارين الاسترخاء المنزلي.',
        ]);
    }
}
$newSessions = App\\Models\\TherapySession::count();
echo "Total Therapy Sessions after seeding: " . $newSessions . "\\n";

$invoices = App\\Models\\Invoice::count();
echo "Total Invoices: " . $invoices . "\\n";
"""

# Upload php_script to /tmp/vps_check.php via ssh
p = subprocess.Popen([
    SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no",
    HOST,
    "cat > /tmp/vps_check.php && php /tmp/vps_check.php && rm /tmp/vps_check.php"
], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8')

stdout, stderr = p.communicate(input=php_script)
print("STDOUT:\n", stdout)
if stderr:
    print("STDERR:\n", stderr)
