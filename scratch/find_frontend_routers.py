import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

test_yaml = """
http:
  routers:
    # 1. IP & Localhost Frontend on HTTP
    clinic-ip-frontend-http:
      entryPoints:
        - web
      priority: 200
      rule: "Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)"
      service: clinic-frontend-service

    # 2. IP & Localhost API on HTTP
    clinic-ip-api-http:
      entryPoints:
        - web
      priority: 210
      rule: "(Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)) && PathPrefix(`/api`)"
      service: clinic-api-service

    # 3. IP & Localhost Frontend on HTTPS
    clinic-ip-frontend-https:
      entryPoints:
        - websecure
      priority: 200
      rule: "Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)"
      service: clinic-frontend-service

    # 4. IP & Localhost API on HTTPS
    clinic-ip-api-https:
      entryPoints:
        - websecure
      priority: 210
      rule: "(Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)) && PathPrefix(`/api`)"
      service: clinic-api-service

    # 5. Wildcard Tenant Subdomains Frontend (HTTPS)
    clinic-wildcard-frontend-https:
      entryPoints:
        - websecure
      priority: 20
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`)"
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt

    # 6. Wildcard Tenant Subdomains API (HTTPS)
    clinic-wildcard-api-https:
      entryPoints:
        - websecure
      priority: 30
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`) && PathPrefix(`/api`)"
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # 7. Wildcard Tenant Subdomains Storage (HTTPS)
    clinic-wildcard-storage-https:
      entryPoints:
        - websecure
      priority: 30
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`) && PathPrefix(`/storage`)"
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # 8. Global Catch-All Fallback Frontend (HTTPS)
    clinic-catchall-frontend-https:
      entryPoints:
        - websecure
      priority: 2
      rule: "PathPrefix(`/`)"
      service: clinic-frontend-service

    # 9. Global Catch-All Fallback API (HTTPS)
    clinic-catchall-api-https:
      entryPoints:
        - websecure
      priority: 3
      rule: "PathPrefix(`/api`)"
      service: clinic-api-service

    # 10. Global Catch-All Fallback Frontend (HTTP)
    clinic-catchall-frontend-http:
      entryPoints:
        - web
      priority: 2
      rule: "PathPrefix(`/`)"
      service: clinic-frontend-service

    # 11. Global Catch-All Fallback API (HTTP)
    clinic-catchall-api-http:
      entryPoints:
        - web
      priority: 3
      rule: "PathPrefix(`/api`)"
      service: clinic-api-service
"""

remote_cmd = f"""
cat << 'EOF' > /etc/dokploy/traefik/dynamic/clinic-wildcard.yml
{test_yaml}
EOF
sleep 1
echo "=== Traefik Overview ==="
docker exec dokploy-traefik wget -qO- http://127.0.0.1:8080/api/overview
echo ""
echo "=== Testing curl http://145.223.116.54/dashboard ==="
curl -I -s http://145.223.116.54/dashboard
echo "=== Testing curl -k https://145.223.116.54/dashboard ==="
curl -k -I -s https://145.223.116.54/dashboard
echo "=== Testing curl -k -H 'Host: new-clinic-test.psypro.tech' https://127.0.0.1/dashboard ==="
curl -k -I -s -H 'Host: new-clinic-test.psypro.tech' https://127.0.0.1/dashboard
echo "=== Testing curl -k -H 'Host: completely-unknown.org' https://127.0.0.1/dashboard ==="
curl -k -I -s -H 'Host: completely-unknown.org' https://127.0.0.1/dashboard
"""

ssh_cmd = [
    r'C:\Windows\System32\OpenSSH\ssh.exe',
    '-i', r'C:\Users\Nassim\.ssh\id_ed25519_vps',
    '-o', 'StrictHostKeyChecking=no',
    'root@145.223.116.54',
    remote_cmd
]
res = subprocess.run(ssh_cmd, capture_output=True, text=True, encoding='utf-8')
print("Output:\n", res.stdout)
print("Stderr:\n", res.stderr)
