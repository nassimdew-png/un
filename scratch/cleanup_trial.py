import subprocess

cmd = """
php artisan tinker --execute="
\\$affected = \\App\\Models\\Tenant::where('status', 'active')->whereNotNull('trial_ends_at')->update(['trial_ends_at' => null]);
echo 'Cleaned active tenants with trial_ends_at: ' . \\$affected . PHP_EOL;

\\$elbiar = \\App\\Models\\Tenant::where('subdomain', 'elbiar-ortho')->first();
echo 'elbiar status: ' . \\$elbiar->status . ' | Trial: ' . (\\$elbiar->trial_ends_at ?: 'NULL') . ' | Sub: ' . \\$elbiar->subscription_ends_at . PHP_EOL;
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print(res.stdout)
