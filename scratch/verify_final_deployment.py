import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

verify_script = """#!/usr/bin/env bash
set -e

echo "=== 1. HTTP/HTTPS Route Responses ==="
for path in "/dashboard" "/billing" "/treasury" "/cash-register" "/caisse" "/receipts" "/clinic/dashboard"; do
    code_http=$(curl -s -o /dev/null -w "%{http_code}" "http://145.223.116.54${path}")
    code_https=$(curl -k -s -o /dev/null -w "%{http_code}" "https://145.223.116.54${path}")
    echo "Path ${path} => HTTP: ${code_http} | HTTPS: ${code_https}"
done

echo ""
echo "=== 2. Wildcard & Tenant Subdomain Test ==="
for host in "aayad-gdyd.psypro.tech" "fresh-qa-test-clinic.psypro.tech" "nonexistent-wildcard.psypro.tech"; do
    code=$(curl -k -s -o /dev/null -w "%{http_code}" -H "Host: ${host}" "https://127.0.0.1/dashboard")
    echo "Host ${host} => /dashboard: ${code}"
done

echo ""
echo "=== 3. Backend API & Healthcheck Responses ==="
echo "Direct /up: $(curl -s -o /dev/null -w "%{http_code}" http://145.223.116.54/up)"
echo "HTTPS /up: $(curl -k -s -o /dev/null -w "%{http_code}" https://145.223.116.54/up)"
echo "API auth me: $(curl -k -s -o /dev/null -w "%{http_code}" https://145.223.116.54/api/auth/me)"

echo ""
echo "=== 4. Check Frontend Assets for Injected TestIDs ==="
cd /var/www/clinic-saas/frontend/dist/assets
grep -o "dashboard-billing-treasury-btn" *.js || echo "NOT FOUND"
grep -o "quick-billing-treasury-btn" *.js || echo "NOT FOUND"
grep -o "tab-daily-treasury" *.js || echo "NOT FOUND"
grep -o "kpi-net-treasury" *.js || echo "NOT FOUND"
"""

ssh_push = [
    r'C:\Windows\System32\OpenSSH\ssh.exe',
    '-i', r'C:\Users\Nassim\.ssh\id_ed25519_vps',
    '-o', 'StrictHostKeyChecking=no',
    'root@145.223.116.54',
    'cat << \'EOF\' > /tmp/verify_deployment.sh\n' + verify_script + '\nEOF\nbash /tmp/verify_deployment.sh'
]
res = subprocess.run(ssh_push, capture_output=True, text=True, encoding='utf-8')
print(res.stdout)
if res.stderr:
    print("STDERR:\n", res.stderr)
