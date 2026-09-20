import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

def run_ssh(remote_cmd):
    res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, remote_cmd], capture_output=True, text=True)
    print("STDOUT:\n", res.stdout)
    if res.stderr:
        print("STDERR:\n", res.stderr)

print("=== Subscription Plans ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(App\\Models\\SubscriptionPlan::all()->toArray());\"")

print("\n=== Tenants and their plan_id ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(App\\Models\\Tenant::select('id', 'name', 'plan_id', 'custom_plan_name', 'status')->get()->toArray());\"")

print("\n=== AI Providers table or settings ===")
run_ssh("cd /var/www/clinic-saas/backend && php artisan tinker --execute=\"dump(Schema::getColumnListing('ai_providers')); dump(App\\Models\\AiProvider::all()->toArray());\"")
