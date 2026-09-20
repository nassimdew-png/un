import subprocess

cmd = """
php artisan tinker --execute="
\\$user = \\App\\Models\\User::whereHas('tenant', function(\\$q) { \\$q->where('subdomain', 'elbiar-ortho'); })->first();
if (!\\$user) {
    \\$user = \\App\\Models\\User::first();
}
\\Auth::login(\\$user);

\\$request = new \\Illuminate\\Http\\Request();
\\$controller = new \\App\\Http\\Controllers\\Api\\ClinicSubscriptionController();
\\$resp = \\$controller->getCurrentSubscription(\\$request);
\\$data = json_decode(\\$resp->getContent(), true);

echo 'User: ' . \\$user->email . PHP_EOL;
echo 'Clinic: ' . \\$data['clinic']['name'] . PHP_EOL;
echo 'Status: ' . \\$data['subscription']['status'] . PHP_EOL;
echo 'IsTrial: ' . (\\$data['subscription']['is_trial'] ? 'TRUE' : 'FALSE') . PHP_EOL;
echo 'DaysRemaining: ' . \\$data['subscription']['days_remaining'] . PHP_EOL;
echo 'Plan: ' . \\$data['subscription']['plan_name_ar'] . PHP_EOL;
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print(res.stdout)
