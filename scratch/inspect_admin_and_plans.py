import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_ssh(remote_cmd):
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True)
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

print("=== User: admin@elbiar-ortho.dz ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(App\\Models\\User::where('email', 'admin@elbiar-ortho.dz')->first()?->only(['id', 'name', 'email', 'role', 'is_super_admin', 'admin_role', 'tenant_id', 'clinic_id']));\"")

print("\n=== Subscription Plans and Tenant counts ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(App\\Models\\SubscriptionPlan::all(['id', 'slug', 'name_ar', 'name_en'])->toArray()); dump(App\\Models\\Tenant::select('id', 'name', 'plan_id', 'custom_plan_name', 'status')->get()->toArray());\"")

print("\n=== AI Providers in database ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(App\\Models\\AiProvider::all(['id', 'provider_key', 'name', 'status', 'is_active', 'has_custom_key'])->toArray());\"")
