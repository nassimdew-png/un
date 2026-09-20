<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SubscriptionPlan;
use App\Models\Tenant;
use App\Models\Patient;
use App\Models\TherapySession;
use App\Models\Appointment;
use Carbon\Carbon;

echo "1. Updating Subscription Plans...\n";
$plans = SubscriptionPlan::all();
foreach ($plans as $p) {
    $f = $p->features ?? [];
    $f['kiosk_self_checkin'] = true;
    $f['waiting_room_tv_queue'] = true;
    $p->features = $f;
    $p->save();
}
echo "   Updated {$plans->count()} subscription plans with kiosk_self_checkin = true.\n";

echo "2. Seeding Tenants with Therapy Sessions & Kiosk Patients...\n";
$tenants = Tenant::all();
foreach ($tenants as $tenant) {
    // Check or create patient
    $patient = Patient::withoutGlobalScopes()->where('tenant_id', $tenant->id)->first();
    if (!$patient) {
        $patient = Patient::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'first_name' => 'وليد',
            'last_name' => 'براهيمي',
            'birth_date' => '2018-06-12',
            'phone' => '0550123456',
            'gender' => 'male',
            'folder_number' => 'DOS-2026-001',
            'kiosk_pin' => '1234',
        ]);
    } else {
        $patient->kiosk_pin = '1234';
        if (empty($patient->phone)) {
            $patient->phone = '0550123456';
        }
        $patient->save();
    }

    // Check sessions
    $sessionCount = TherapySession::withoutGlobalScopes()->where('tenant_id', $tenant->id)->count();
    if ($sessionCount < 2) {
        TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient->id,
            'specialist_id' => $tenant->users()->first()?->id ?? 1,
            'session_date' => Carbon::now()->subDays(2)->setTime(10, 0),
            'duration_minutes' => 45,
            'attendance_status' => 'present',
            'specialty' => 'orthophony',
            'exercises_targeted' => ['نطق مخارج الحروف الشفوية (ب، م، و)', 'تمارين التنفس البطني والتحكم الصوتي'],
            'progress_notes' => 'جلسة ناجحة ومكتملة، لوحظ استقرار في التثبيت النطقي وتجاوب ممتاز مع التمارين.',
            'created_at' => Carbon::now()->subDays(2),
            'updated_at' => Carbon::now()->subDays(2),
        ]);

        TherapySession::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient->id,
            'specialist_id' => $tenant->users()->first()?->id ?? 1,
            'session_date' => Carbon::now()->setTime(11, 30),
            'duration_minutes' => 50,
            'attendance_status' => 'present',
            'specialty' => 'orthophony',
            'exercises_targeted' => ['تأهيل السلاسة الكلامية', 'الوعي الفونولوجي للكلمات ثلاثية المقاطع'],
            'progress_notes' => 'إتمام أهداف الخطة الفردية لليوم مع تكليف بتمارين الاسترخاء المنزلي.',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);
        echo "   Tenant {$tenant->id} ({$tenant->name}) seeded with 2 completed therapy sessions.\n";
    } else {
        echo "   Tenant {$tenant->id} already has {$sessionCount} therapy sessions.\n";
    }

    // Ensure appointment exists for today so TV screen has queue data
    $appExists = Appointment::withoutGlobalScopes()
        ->where('tenant_id', $tenant->id)
        ->whereDate('appointment_date', Carbon::today())
        ->exists();
    if (!$appExists) {
        Appointment::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'patient_id' => $patient->id,
            'specialist_id' => $tenant->users()->first()?->id ?? 1,
            'appointment_date' => Carbon::today()->setTime(10, 30),
            'type' => 'consultation',
            'status' => 'confirmed',
            'notes' => 'موعد مبرمج - في قاعة الانتظار',
        ]);
        echo "   Tenant {$tenant->id} appointment seeded for today.\n";
    }
}

echo "Seeding completed successfully!\n";
