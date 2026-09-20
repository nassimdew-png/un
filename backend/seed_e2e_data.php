<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    Illuminate\Support\Facades\DB::statement("ALTER TABLE `appointments` MODIFY COLUMN `status` VARCHAR(50) NOT NULL DEFAULT 'scheduled'");
    echo "Appointments status column widened to VARCHAR(50) successfully." . PHP_EOL;
} catch (\Throwable $e) {
    echo "Notice on alter appointments: " . $e->getMessage() . PHP_EOL;
}

$tenants = App\Models\Tenant::all();
echo "Found " . $tenants->count() . " tenants." . PHP_EOL;
$today = date('Y-m-d');

foreach ($tenants as $t) {
    // 1. Patient Chaimae Touati for Kiosk tests
    $p = App\Models\Patient::firstOrCreate(
        ['tenant_id' => $t->id, 'first_name' => 'شيماء', 'last_name' => 'تواتي'],
        [
            'gender' => 'female',
            'birth_date' => '2018-09-12',
            'phone' => '0550998877',
            'kiosk_pin' => '8877',
            'guardian_name' => 'تواتي الأخضر',
            'emergency_contact' => '0550998877',
            'commune_name' => 'الجزائر',
            'folder_number' => 'PAT-2026-099',
        ]
    );

    // 2. Today Appointment for Kiosk Check-In test
    $appt = App\Models\Appointment::where('tenant_id', $t->id)
        ->where('patient_id', $p->id)
        ->whereDate('appointment_date', $today)
        ->first();
    if (!$appt) {
        $appt = App\Models\Appointment::create([
            'tenant_id' => $t->id,
            'patient_id' => $p->id,
            'appointment_date' => $today,
            'start_time' => '10:00:00',
            'end_time' => '10:45:00',
            'status' => 'scheduled',
            'type' => 'consultation',
        ]);
        echo "Created today appointment: " . $appt->id . PHP_EOL;
    }

    // 3. Treasury bank transfer invoice FAC-2026-0032
    $inv = App\Models\Invoice::firstOrCreate(
        ['tenant_id' => $t->id, 'invoice_number' => 'FAC-2026-0032'],
        [
            'patient_id' => $p->id,
            'total_amount' => 4500.00,
            'paid_amount' => 4500.00,
            'payment_status' => 'paid',
            'payment_method' => 'bank_transfer',
            'issued_date' => $today,
        ]
    );
    echo "Tenant " . $t->id . " (" . $t->name . "): Seeded Chaimae Touati & Invoice FAC-2026-0032" . PHP_EOL;
}
echo "Seeding completed successfully!" . PHP_EOL;
