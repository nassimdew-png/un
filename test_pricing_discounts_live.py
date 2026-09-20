import urllib.request
import json
import ssl
import sys

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://psypro.tech/api/public/subscription-plans"
req = urllib.request.Request(url, headers={"User-Agent": "Antigravity-QA/1.0"})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print("Status Code:", resp.status)
        print("Success:", data.get("success"))
        plans = data.get("plans", [])
        print(f"Total Public Plans: {len(plans)}")
        for p in plans[:5]:
            print(f"- ID: {p.get('id')} | Slug: {p.get('slug')} | Name: {p.get('name_ar')}")
            print(f"  Monthly: {p.get('price_monthly')} DZD | Yearly: {p.get('price_yearly')} DZD")
            print(f"  Discount: {p.get('discount_percentage')}% | Active: {p.get('is_discount_active')} | Badge: {p.get('discount_badge')}")
            print(f"  Discounted Monthly: {p.get('discounted_price_monthly')} | Yearly: {p.get('discounted_price_yearly')}")
except Exception as e:
    print("Error:", e)
