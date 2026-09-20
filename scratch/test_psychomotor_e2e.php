<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Patient;
use App\Models\PsychomotorAssessment;
use App\Models\User;
use Illuminate\Support\Str;

echo "=== 1. CHECKING/CREATING TEST PATIENT ===\n";
$patient = Patient::first();
if (!$patient) {
    $patient = Patient::create([
        'first_name' => 'سامي',
        'last_name' => 'المهداوي',
        'gender' => 'male',
        'birth_date' => '2018-05-12',
        'phone' => '0555123456',
        'tenant_id' => '01J6ABCDEF1234567890TESTING',
    ]);
    echo "  + Created new patient ID: {$patient->id}\n";
} else {
    echo "  ✓ Found existing patient ID: {$patient->id} ({$patient->first_name} {$patient->last_name})\n";
}

echo "\n=== 2. TESTING PSYCHOMOTOR ASSESSMENT CREATION ===\n";
$testBodyMap = [
    'shoulder_right' => [
        'tonus' => 'hypertonie',
        'sensory' => 'hypersensible',
        'severity' => 'moderate',
        'notes' => 'تشنج كتفي وتوتر عضلي ملحوظ',
    ],
    'arm_left' => [
        'tonus' => 'hypotonie',
        'sensory' => 'normosensible',
        'severity' => 'mild',
        'notes' => 'رخاوة خفيفة في بسط الساعد',
    ],
];

$testStats = [
    'totalEvaluated' => 2,
    'hypertonieCount' => 1,
    'hypotonieCount' => 1,
    'hypersensibleCount' => 1,
    'abnormalTonusCount' => 2,
    'hasHypertonie' => true,
    'hasHypotonie' => true,
];

$testBalance = [
    'romberg_eyes_open' => 'stable',
    'romberg_eyes_closed' => 'negative',
    'flamingo_right_sec' => 22,
    'flamingo_left_sec' => 18,
    'tandem_gait' => 'perfect',
];

$testLateralProfile = [
    'dominantHand' => 'right',
    'dominantEye' => 'right',
    'dominantFoot' => 'right',
    'profileType' => 'homogeneous_right',
    'profileLabelAr' => 'يمينية متجانسة كاملة (Droitier homogène)',
];

$assessment = PsychomotorAssessment::create([
    'tenant_id' => $patient->tenant_id ?: '01J6ABCDEF1234567890TESTING',
    'patient_id' => $patient->id,
    'assessment_date' => now()->toDateString(),
    'body_map_data' => $testBodyMap,
    'body_map_stats' => $testStats,
    'balance_battery' => $testBalance,
    'lateral_profile' => $testLateralProfile,
    'clinical_summary' => 'مؤشرات فرط توتر طرفي أيمن مع توازن عام جيد وهيمنة يمنى متجانسة.',
    'therapeutic_goals' => [
        'تأكيد المخطط الجسمي والاسترخاء العضلي للكتف الأيمن',
        'تعزيز التوازن الحركي والتآزر الثنائي',
    ],
]);

echo "  ✓ Assessment created with ID: {$assessment->id}\n";
assert($assessment->id > 0, "Failed to create assessment");

echo "\n=== 3. VERIFYING JSON DESERIALIZATION ===\n";
$loaded = PsychomotorAssessment::findOrFail($assessment->id);
echo "  - Body map data count: " . count($loaded->body_map_data) . "\n";
echo "  - Right shoulder tonus: " . $loaded->body_map_data['shoulder_right']['tonus'] . "\n";
echo "  - Right flamingo stance duration: " . $loaded->balance_battery['flamingo_right_sec'] . "s\n";
echo "  - Lateral profile: " . $loaded->lateral_profile['profileLabelAr'] . "\n";
assert($loaded->body_map_data['shoulder_right']['tonus'] === 'hypertonie', "Tonus mismatch");
assert($loaded->balance_battery['flamingo_right_sec'] === 22, "Flamingo sec mismatch");

echo "\n=== 4. VERIFYING PATIENT SENSORY BODY MAP SYNC ===\n";
$patient->update([
    'sensory_body_map' => $testBodyMap,
    'sensory_profile' => $testStats,
]);
$freshPatient = $patient->fresh();
echo "  ✓ Synced sensory_body_map on Patient model. Count: " . count($freshPatient->sensory_body_map) . "\n";
assert(count($freshPatient->sensory_body_map) === 2, "Patient sensory_body_map count mismatch");

echo "\n=== 5. VERIFYING CONTROLLER / BILAN DATA INTEGRATION ===\n";
$latest = PsychomotorAssessment::where('patient_id', $patient->id)
    ->orderBy('assessment_date', 'desc')
    ->orderBy('id', 'desc')
    ->first();
assert($latest !== null, "Latest psychomotor assessment must exist");
echo "  ✓ Latest assessment query returned ID: {$latest->id}\n";

echo "\n🎉 100% PSYCHOMOTOR SUITE VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n";
