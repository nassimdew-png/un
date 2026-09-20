import subprocess

cmd = """ssh -i C:/Users/Nassim/.ssh/id_ed25519_vps -o StrictHostKeyChecking=no root@145.223.116.54 "cd /var/www/clinic-saas/backend && php -r \\\"
require 'vendor/autoload.php';
\\$app = require_once 'bootstrap/app.php';
\\$kernel = \\$app->make(Illuminate\\\\Contracts\\\\Console\\\\Kernel::class);
\\$kernel->bootstrap();

echo 'TENANTS:' . PHP_EOL;
\\$tenants = App\\\\Models\\\\Tenant::where('subdomain', 'like', '%alger%')
    ->orWhere('subdomain', 'like', '%cabinet%')
    ->select(['id', 'name', 'subdomain', 'status'])
    ->get();
print_r(\\$tenants->toArray());

\\$users = App\\\\Models\\\\User::select(['id', 'name', 'email', 'role', 'tenant_id'])->limit(15)->get();
echo 'USERS:' . PHP_EOL;
print_r(\\$users->toArray());
\\\"" """

p = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(p.stdout)
print(p.stderr)
