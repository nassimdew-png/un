<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== PATIENTS MATCHING 0555123456 OR يوسف ===" . PHP_EOL;
$patients = \App\Models\Patient::where('phone', 'like', '%0555123456%')
    ->orWhere('first_name', 'يوسف')
    ->get(['id', 'tenant_id', 'first_name', 'last_name', 'phone', 'birth_date', 'commune_name', 'wilaya_code', 'created_at']);

foreach ($patients as $p) {
    echo "ID: #{$p->id} | Tenant: {$p->tenant_id} | Name: {$p->first_name} {$p->last_name} | Phone: {$p->phone} | DOB: {$p->birth_date} | Commune: {$p->commune_name} (Wilaya {$p->wilaya_code}) | Created: {$p->created_at}" . PHP_EOL;
}

echo PHP_EOL . "=== APPOINTMENTS FOR THESE PATIENTS ===" . PHP_EOL;
$appts = \App\Models\Appointment::whereIn('patient_id', $patients->pluck('id'))
    ->get(['id', 'patient_id', 'appointment_date', 'status', 'type', 'notes', 'created_at']);
foreach ($appts as $a) {
    echo "Appt ID: #{$a->id} | Patient ID: #{$a->patient_id} | Date: {$a->appointment_date} | Status: {$a->status} | Type: {$a->type} | Notes: {$a->notes}" . PHP_EOL;
}
