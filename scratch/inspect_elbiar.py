import subprocess

cmd = """
php artisan tinker --execute="
\\$t = \\App\\Models\\Tenant::where('subdomain', 'elbiar-ortho')->first();
echo 'Name: ' . \\$t->name . PHP_EOL;
echo 'Status: ' . \\$t->status . PHP_EOL;
echo 'Plan ID: ' . \\$t->plan_id . PHP_EOL;
echo 'Trial ends: ' . \\$t->trial_ends_at . PHP_EOL;
echo 'Sub ends: ' . \\$t->subscription_ends_at . PHP_EOL;
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print(res.stdout)
