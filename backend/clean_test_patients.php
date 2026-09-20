<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$targetIds = [29, 30, 31, 32, 33, 35];
echo "=== CLEANING UP TEST PATIENTS: " . implode(', ', $targetIds) . " ===" . PHP_EOL;

// 1. Delete appointments for these test patients
$apptsDeleted = \App\Models\Appointment::whereIn('patient_id', $targetIds)->delete();
echo "Deleted {$apptsDeleted} test appointments." . PHP_EOL;

// 2. Delete test bilans or therapy sessions if any
if (class_exists(\App\Models\TherapySession::class)) {
    $sessionsDeleted = \App\Models\TherapySession::whereIn('patient_id', $targetIds)->delete();
    echo "Deleted {$sessionsDeleted} test therapy sessions." . PHP_EOL;
}
if (class_exists(\App\Models\PatientBilan::class)) {
    $bilansDeleted = \App\Models\PatientBilan::whereIn('patient_id', $targetIds)->delete();
    echo "Deleted {$bilansDeleted} test bilans." . PHP_EOL;
}

// 3. Delete patients
$patientsDeleted = \App\Models\Patient::whereIn('id', $targetIds)->delete();
echo "Deleted {$patientsDeleted} test patients (#29, #30, #31, #32, #33, #35) successfully!" . PHP_EOL;
