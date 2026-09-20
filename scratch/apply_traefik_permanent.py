import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

wildcard_yaml = """# ==============================================================================
# ClinicSaaS Pro - Dynamic Fallback, Wildcard & Direct IP Router Suite
# ==============================================================================
http:
  routers:
    # --------------------------------------------------------------------------
    # 1. Healthcheck (/up) Router - Direct to Laravel Backend
    # --------------------------------------------------------------------------
    clinic-health-http:
      entryPoints:
        - web
      priority: 300
      rule: "PathPrefix(`/up`)"
      service: clinic-api-service

    clinic-health-https:
      entryPoints:
        - websecure
      priority: 300
      rule: "PathPrefix(`/up`)"
      service: clinic-api-service

    # --------------------------------------------------------------------------
    # 2. Direct IP, Nip.io & Localhost Routing (Avoids Broken SSL on Raw IP)
    # --------------------------------------------------------------------------
    clinic-ip-api-http:
      entryPoints:
        - web
      priority: 250
      rule: "(Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))"
      service: clinic-api-service

    clinic-ip-frontend-http:
      entryPoints:
        - web
      priority: 240
      rule: "Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)"
      service: clinic-frontend-service

    clinic-ip-api-https:
      entryPoints:
        - websecure
      priority: 250
      rule: "(Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))"
      service: clinic-api-service

    clinic-ip-frontend-https:
      entryPoints:
        - websecure
      priority: 240
      rule: "Host(`145.223.116.54`) || Host(`145.223.116.54.nip.io`) || Host(`localhost`) || Host(`127.0.0.1`)"
      service: clinic-frontend-service

    # --------------------------------------------------------------------------
    # 3. Dynamic Wildcard Tenant Subdomains (*.psypro.tech) with LetsEncrypt
    # --------------------------------------------------------------------------
    clinic-wildcard-api-https:
      entryPoints:
        - websecure
      priority: 30
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`) && PathPrefix(`/api`)"
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    clinic-wildcard-storage-https:
      entryPoints:
        - websecure
      priority: 30
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`) && PathPrefix(`/storage`)"
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    clinic-wildcard-frontend-https:
      entryPoints:
        - websecure
      priority: 20
      rule: "HostRegexp(`^[a-zA-Z0-9-]+\\\\.psypro\\\\.tech$`)"
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt

    # --------------------------------------------------------------------------
    # 4. Universal Global Catch-All Fallback (Guarantees No "404 page not found")
    # --------------------------------------------------------------------------
    clinic-catchall-api-https:
      entryPoints:
        - websecure
      priority: 5
      rule: "PathPrefix(`/api`) || PathPrefix(`/storage`)"
      service: clinic-api-service

    clinic-catchall-frontend-https:
      entryPoints:
        - websecure
      priority: 2
      rule: "PathPrefix(`/`)"
      service: clinic-frontend-service

    clinic-catchall-api-http:
      entryPoints:
        - web
      priority: 5
      rule: "PathPrefix(`/api`) || PathPrefix(`/storage`)"
      service: clinic-api-service

    clinic-catchall-frontend-http:
      entryPoints:
        - web
      priority: 2
      rule: "PathPrefix(`/`)"
      service: clinic-frontend-service
"""

remote_cmd = f"""
cat << 'EOF' > /etc/dokploy/traefik/dynamic/clinic-wildcard.yml
{wildcard_yaml}
EOF
sleep 1
echo "=== Traefik Status ==="
docker exec dokploy-traefik wget -qO- http://127.0.0.1:8080/api/overview
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
