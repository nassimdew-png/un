import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

test_script = """#!/usr/bin/env bash
echo -n "1. http://145.223.116.54/dashboard: "
curl -s -o /dev/null -w "%{http_code}\\n" http://145.223.116.54/dashboard

echo -n "2. https://145.223.116.54/dashboard: "
curl -k -s -o /dev/null -w "%{http_code}\\n" https://145.223.116.54/dashboard

echo -n "3. http://145.223.116.54/up: "
curl -s -o /dev/null -w "%{http_code}\\n" http://145.223.116.54/up

echo -n "4. https://145.223.116.54/up: "
curl -k -s -o /dev/null -w "%{http_code}\\n" https://145.223.116.54/up

echo -n "5. http://145.223.116.54/api/auth/me: "
curl -s -o /dev/null -w "%{http_code}\\n" http://145.223.116.54/api/auth/me

echo -n "6. https://145.223.116.54/api/auth/me: "
curl -k -s -o /dev/null -w "%{http_code}\\n" https://145.223.116.54/api/auth/me

echo -n "7. Wildcard new tenant /dashboard: "
curl -k -s -o /dev/null -w "%{http_code}\\n" -H "Host: any-new-qa-tenant.psypro.tech" https://127.0.0.1/dashboard

echo -n "8. Wildcard new tenant /api/auth/me: "
curl -k -s -o /dev/null -w "%{http_code}\\n" -H "Host: any-new-qa-tenant.psypro.tech" https://127.0.0.1/api/auth/me

echo -n "9. Unknown host /dashboard: "
curl -k -s -o /dev/null -w "%{http_code}\\n" -H "Host: random-unknown.domain" https://127.0.0.1/dashboard
"""

ssh_push = [
    r'C:\Windows\System32\OpenSSH\ssh.exe',
    '-i', r'C:\Users\Nassim\.ssh\id_ed25519_vps',
    '-o', 'StrictHostKeyChecking=no',
    'root@145.223.116.54',
    'cat << \'EOF\' > /tmp/test_traefik.sh\n' + test_script + '\nEOF\nbash /tmp/test_traefik.sh'
]
res = subprocess.run(ssh_push, capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
if res.stderr:
    print("Stderr:", res.stderr)
