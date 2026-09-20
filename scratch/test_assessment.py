import subprocess

cmd = """
php artisan tinker --execute="
\\$patient = \\App\\Models\\Patient::first();
\\$user = \\App\\Models\\User::first();
\\Auth::login(\\$user);

\\$request = new \\Illuminate\\Http\\Request();
\\$request->replace([
    'test_code' => 'BDI_II',
    'calculated_total_score' => 24,
    'subscale_scores' => [
        'total_bdi' => ['name' => 'Score Total', 'raw' => 24],
        'suicide_item' => ['name' => 'Suicide item 9', 'raw' => 0]
    ],
    'raw_responses' => ['9' => 0],
    'notes' => 'Test observation for verification'
]);

\\$controller = new \\App\\Http\\Controllers\\Api\\ClinicalAssessmentCatalogController();
\\$resp = \\$controller->saveAssessmentSession(\\$request, \\$patient->id);
echo 'Response Status: ' . \\$resp->getStatusCode() . ' Content: ' . \\$resp->getContent();
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print("OUT:", res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
