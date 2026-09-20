import paramiko
import sys
import os

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY)

sftp = ssh.open_sftp()

files_to_sync = [
    (r"e:\3\frontend\src\utils\subdomain.js", "/var/www/clinic-saas/frontend/src/utils/subdomain.js"),
    (r"e:\3\frontend\src\components\Navbar.jsx", "/var/www/clinic-saas/frontend/src/components/Navbar.jsx"),
    (r"e:\3\frontend\src\components\Sidebar.jsx", "/var/www/clinic-saas/frontend/src/components/Sidebar.jsx"),
    (r"e:\3\frontend\src\components\super-admin\SuperAdminDashboardView.jsx", "/var/www/clinic-saas/frontend/src/components/super-admin/SuperAdminDashboardView.jsx"),
    (r"e:\3\backend\app\Http\Controllers\Api\PatientController.php", "/var/www/clinic-saas/backend/app/Http/Controllers/Api/PatientController.php"),
    (r"e:\3\backend\app\Http\Controllers\Api\PublicAuthController.php", "/var/www/clinic-saas/backend/app/Http/Controllers/Api/PublicAuthController.php"),
    (r"e:\3\backend\app\Services\DomainManagerService.php", "/var/www/clinic-saas/backend/app/Services/DomainManagerService.php"),
]

print("Uploading updated code files to production...")
for local, remote in files_to_sync:
    sftp.put(local, remote)
    print(f"Uploaded: {remote}")

sftp.close()

# Update Traefik dynamic YAML to handle psysnap.com and *.psysnap.com
traefik_yaml = """http:
  services:
    clinic-api-service:
      loadBalancer:
        servers:
        - url: http://172.17.0.1:8000
    clinic-frontend-service:
      loadBalancer:
        servers:
        - url: http://172.17.0.1:3001

  routers:
    clinic-health-http:
      entryPoints:
      - web
      priority: 300
      rule: PathPrefix(`/up`)
      service: clinic-api-service
    clinic-health-https:
      entryPoints:
      - websecure
      priority: 300
      rule: PathPrefix(`/up`)
      service: clinic-api-service

    # Main domain psysnap.com and psypro.tech API
    clinic-main-api-http:
      entryPoints:
      - web
      priority: 150
      rule: (Host(`psysnap.com`) || Host(`www.psysnap.com`) || Host(`psypro.tech`) || Host(`www.psypro.tech`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
    clinic-main-api-https:
      entryPoints:
      - websecure
      priority: 150
      rule: (Host(`psysnap.com`) || Host(`www.psysnap.com`) || Host(`psypro.tech`) || Host(`www.psypro.tech`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # Main domain psysnap.com and psypro.tech Frontend
    clinic-main-frontend-http:
      entryPoints:
      - web
      priority: 140
      rule: Host(`psysnap.com`) || Host(`www.psysnap.com`) || Host(`psypro.tech`) || Host(`www.psypro.tech`)
      service: clinic-frontend-service
    clinic-main-frontend-https:
      entryPoints:
      - websecure
      priority: 140
      rule: Host(`psysnap.com`) || Host(`www.psysnap.com`) || Host(`psypro.tech`) || Host(`www.psypro.tech`)
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt

    # Subdomains *.psysnap.com and *.psypro.tech API
    clinic-wildcard-api-http:
      entryPoints:
      - web
      priority: 50
      rule: (HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)) && PathPrefix(`/api`)
      service: clinic-api-service
    clinic-wildcard-api-https:
      entryPoints:
      - websecure
      priority: 50
      rule: (HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)) && PathPrefix(`/api`)
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # Subdomains *.psysnap.com and *.psypro.tech Storage
    clinic-wildcard-storage-http:
      entryPoints:
      - web
      priority: 50
      rule: (HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)) && PathPrefix(`/storage`)
      service: clinic-api-service
    clinic-wildcard-storage-https:
      entryPoints:
      - websecure
      priority: 50
      rule: (HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)) && PathPrefix(`/storage`)
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # Subdomains *.psysnap.com and *.psypro.tech Frontend
    clinic-wildcard-frontend-http:
      entryPoints:
      - web
      priority: 40
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)
      service: clinic-frontend-service
    clinic-wildcard-frontend-https:
      entryPoints:
      - websecure
      priority: 40
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) || HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psypro.tech`)
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt

    # Catchall for direct IP & fallback
    clinic-catchall-api-http:
      entryPoints:
      - web
      priority: 5
      rule: PathPrefix(`/api`) || PathPrefix(`/storage`)
      service: clinic-api-service
    clinic-catchall-api-https:
      entryPoints:
      - websecure
      priority: 5
      rule: PathPrefix(`/api`) || PathPrefix(`/storage`)
      service: clinic-api-service
    clinic-catchall-frontend-http:
      entryPoints:
      - web
      priority: 2
      rule: PathPrefix(`/`)
      service: clinic-frontend-service
    clinic-catchall-frontend-https:
      entryPoints:
      - websecure
      priority: 2
      rule: PathPrefix(`/`)
      service: clinic-frontend-service
"""

cmd = f"""
cat << 'EOF' > /etc/dokploy/traefik/dynamic/clinic-wildcard.yml
{traefik_yaml}
EOF

# Update .env
sed -i 's|^APP_URL=.*|APP_URL=https://psysnap.com|' /var/www/clinic-saas/backend/.env
sed -i 's|^SESSION_DOMAIN=.*|SESSION_DOMAIN=.psysnap.com|' /var/www/clinic-saas/backend/.env
sed -i 's|^SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS="psysnap.com,www.psysnap.com,psypro.tech,www.psypro.tech,197.140.142.48,localhost,127.0.0.1"|' /var/www/clinic-saas/backend/.env

# Clear backend cache
cd /var/www/clinic-saas/backend
php artisan config:clear
php artisan route:clear
php artisan optimize:clear

# Rebuild frontend
cd /var/www/clinic-saas/frontend
npm run build

# Restart PM2
pm2 restart all
sleep 3
pm2 list

echo "=== Testing psysnap.com Traefik Frontend ==="
curl -sI -H "Host: psysnap.com" http://127.0.0.1/ | head -n 6

echo "=== Testing oran-psy.psysnap.com Traefik Frontend ==="
curl -sI -H "Host: oran-psy.psysnap.com" http://127.0.0.1/ | head -n 6

echo "=== Testing psysnap.com Traefik /up Backend ==="
curl -sI -H "Host: psysnap.com" http://127.0.0.1/up | head -n 6
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
