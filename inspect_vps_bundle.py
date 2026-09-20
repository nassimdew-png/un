import subprocess

SSH_KEY = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
HOST = "root@145.223.116.54"
SSH_BIN = r"C:\Windows\System32\OpenSSH\ssh.exe"

script = """
import glob

for f in glob.glob('/var/www/clinic-saas/frontend/dist/assets/*.js'):
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        content = fp.read()
    if 'register?lang=fr' in content:
        print('Found match in:', f)
        idx = content.find('register?lang=fr')
        print(content[max(0, idx - 120):min(len(content), idx + 180)])
"""

cmd = [SSH_BIN, "-i", SSH_KEY, "-o", "StrictHostKeyChecking=no", HOST, "python3"]
res = subprocess.run(cmd, input=script, capture_output=True, text=True, encoding="utf-8", errors="replace")
print("STDOUT:")
print(res.stdout.encode('ascii', errors='replace').decode('ascii'))
if res.stderr:
    print("STDERR:")
    print(res.stderr)
