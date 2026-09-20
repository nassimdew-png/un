import subprocess

cmd = """
php artisan tinker --execute="
foreach(\\App\\Models\\Tenant::all() as \\$t) {
    \\$now = now();
    \\$diffTrial = \\$t->trial_ends_at ? (int)\\$now->diffInDays(\\$t->trial_ends_at, false) : 0;
    \\$diffSub = \\$t->subscription_ends_at ? (int)\\$now->diffInDays(\\$t->subscription_ends_at, false) : 0;
    if (\\$diffTrial > 100 || \\$diffSub > 500) {
        echo 'MATCH! ID: ' . \\$t->id . ' | Subdomain: ' . \\$t->subdomain . ' | Status: ' . \\$t->status . ' | TrialDiff: ' . \\$diffTrial . ' | SubDiff: ' . \\$diffSub . PHP_EOL;
    }
}
"
"""

res = subprocess.run(cmd, shell=True, cwd="/var/www/clinic-saas/backend", capture_output=True, text=True)
print(res.stdout)
