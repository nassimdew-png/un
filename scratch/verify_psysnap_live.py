import urllib.request
import ssl
import sys

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    ("Homepage HTML", "https://psypro.tech"),
    ("PsySnap Logo", "https://psypro.tech/psysnap-logo.png"),
    ("Favicon ICO", "https://psypro.tech/favicon.ico"),
    ("Favicon 32x32", "https://psypro.tech/favicon-32x32.png"),
    ("Apple Touch Icon", "https://psypro.tech/apple-touch-icon.png"),
    ("PWA 192x192", "https://psypro.tech/pwa-192x192.png"),
]

print("=== VERIFYING PSYSNAP LIVE ASSETS ===")
all_pass = True

for label, url in urls:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            status = resp.status
            content = resp.read()
            size = len(content)
            print(f"[OK] {label} ({url}) -> Status {status}, Size: {size} bytes")
            if "Homepage" in label:
                text = content.decode('utf-8', errors='replace')
                if "PsySnap" in text:
                    print("     [+] Found 'PsySnap' in homepage title/meta!")
                else:
                    print("     [-] 'PsySnap' NOT found in homepage text!")
                    all_pass = False
    except Exception as e:
        print(f"[FAIL] {label} ({url}) -> Error: {e}")
        all_pass = False

print("\n=== SUMMARY ===")
if all_pass:
    print("ALL LIVE CHECKS PASSED SUCCESSFULLY!")
else:
    print("SOME CHECKS FAILED.")
