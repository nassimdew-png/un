import subprocess

cmd = """
php artisan tinker --execute="
foreach(\\App\\Models\\Tenant::all() as \\$t) {
    echo 'ID: ' . \\$t->id . ' | Sub: ' . \\$t->subdomain . ' | Status: ' . \\$t->status . ' | TrialEnds: ' . (\\$t->trial_ends_at ? \\$t->trial_ends_at->toDateTimeString() : 'NULL') . ' | SubEnds: ' . (\\$t->subscription_ends_at ? \\$t->subscription_ends_at->toDateTimeString() : 'NULL') . PHP_EOL;
}
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print(res.stdout)
if res.stderr:
    print("ERR:", res.stderr)
