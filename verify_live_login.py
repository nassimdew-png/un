import urllib.request
import re

url = 'https://psypro.tech/login'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8')
    print("=== HTML OUTPUT ===")
    print(html[:600])
    scripts = re.findall(r'src="(/assets/[^"]+)"', html)
    print("Found scripts:", scripts)

for script in scripts:
    script_url = f"https://psypro.tech{script}"
    sreq = urllib.request.Request(script_url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(sreq) as sresp:
        content = sresp.read().decode('utf-8')
        print(f"Script {script}: length {len(content)}")
