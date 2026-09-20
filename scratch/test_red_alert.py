import subprocess

cmd = """
php artisan tinker --execute="
\\$patient = \\App\\Models\\Patient::first();
\\$user = \\App\\Models\\User::first();
\\Auth::login(\\$user);

\\$request = new \\Illuminate\\Http\\Request();
\\$request->replace([
    'test_code' => 'BDI_II',
    'calculated_total_score' => 35,
    'subscale_scores' => [
        'total_bdi' => ['name' => 'Score Total', 'raw' => 35],
        'suicide_item' => ['name' => 'Suicide item 9', 'raw' => 2]
    ],
    'raw_responses' => ['9' => 2],
    'notes' => 'Severe depression screening'
]);

\\$controller = new \\App\\Http\\Controllers\\Api\\ClinicalAssessmentCatalogController();
\\$resp = \\$controller->saveAssessmentSession(\\$request, \\$patient->id);
\\$data = json_decode(\\$resp->getContent(), true);
echo 'Red Alert Triggered: ' . (\\$data['has_critical_alert'] ? 'YES' : 'NO') . PHP_EOL;
echo 'Recommendations: ' . \\$data['assessment']['recommendations'] . PHP_EOL;
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print("OUT:", res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
