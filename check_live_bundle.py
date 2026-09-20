import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request("https://145.223.116.54/", headers={"Host": "psypro.tech"})
html = urllib.request.urlopen(req, context=ctx).read().decode('utf-8', errors='ignore')

js_files = re.findall(r'src="(/assets/[^"]+\.js)"', html)
print("Found JS assets:", js_files)

for js in js_files:
    req_js = urllib.request.Request(f"https://145.223.116.54{js}", headers={"Host": "psypro.tech"})
    content = urllib.request.urlopen(req_js, context=ctx).read().decode('utf-8', errors='ignore')
    if "روابط وبوابات العيادة" in content or "Booking Portal" in content or "clinicPortals" in content:
        print(f"Verified: Found clinic links in bundle {js}!")
        break
