import subprocess
import json
import urllib.request
import ssl
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

# Set a 25% discount on plan ID 1 via artisan tinker
set_discount_cmd = """
cd /var/www/clinic-saas/backend
php artisan tinker --execute="
\$p = App\Models\SubscriptionPlan::find(1);
\$p->discount_percentage = 25;
\$p->discount_badge = '🔥 تخفيض حصري لفترة محدودة -25%';
\$p->is_discount_active = true;
\$p->save();
echo json_encode([
    'id' => \$p->id,
    'price_monthly' => \$p->price_monthly,
    'discount_percentage' => \$p->discount_percentage,
    'is_discount_active' => \$p->is_discount_active,
    'discount_badge' => \$p->discount_badge,
    'discounted_price_monthly' => \$p->discounted_price_monthly,
    'discounted_price_yearly' => \$p->discounted_price_yearly,
], JSON_UNESCAPED_UNICODE);
"
"""

print("1. Updating Plan 1 with 25% discount on remote DB...")
res = subprocess.run([SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, set_discount_cmd], capture_output=True, text=True, encoding='utf-8')
print("Output:", res.stdout.strip())

print("\n2. Fetching public plans from https://psypro.tech/api/public/subscription-plans...")
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://psypro.tech/api/public/subscription-plans", headers={"User-Agent": "Antigravity-QA/1.0"})
with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
    data = json.loads(resp.read().decode("utf-8"))
    plans = data.get("plans", [])
    p1 = next((p for p in plans if p.get("id") == 1), None)
    if p1:
        print("Plan 1 details:")
        print("  Name:", p1.get("name_ar"))
        print("  Original Monthly:", p1.get("price_monthly"), "DZD")
        print("  Discount Percentage:", p1.get("discount_percentage"), "%")
        print("  Is Discount Active:", p1.get("is_discount_active"))
        print("  Discount Badge:", p1.get("discount_badge"))
        print("  Calculated Discounted Monthly:", p1.get("discounted_price_monthly"), "DZD")
        print("  Calculated Discounted Yearly:", p1.get("discounted_price_yearly"), "DZD")
        assert p1.get("is_discount_active") == True, "Discount should be active"
        assert p1.get("discount_percentage") == 25, "Discount percentage should be 25"
        assert p1.get("discounted_price_monthly") == 3375, "Discounted monthly should be 3375"
        print("\n✅ Verification PASSED: Discount engine calculated and returned exact expected figures!")
    else:
        print("Plan 1 not found!")
