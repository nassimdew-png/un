import paramiko
import sys
import time

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY)

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

    # Main domain psysnap.com (Frontend HTTPS)
    clinic-psysnap-frontend-https:
      entryPoints:
      - websecure
      priority: 200
      rule: Host(`psysnap.com`) || Host(`www.psysnap.com`)
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt
        domains:
        - main: psysnap.com
          sans:
          - www.psysnap.com
          - oran-psy.psysnap.com
          - cabinet-alger.psysnap.com
          - cabinet-el-amel.psysnap.com
          - constantine-sante.psysnap.com
          - annaba-ortho.psysnap.com
          - elbiar-ortho.psysnap.com

    # Main domain psysnap.com (API HTTPS)
    clinic-psysnap-api-https:
      entryPoints:
      - websecure
      priority: 210
      rule: (Host(`psysnap.com`) || Host(`www.psysnap.com`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # Subdomains *.psysnap.com (API HTTPS)
    clinic-subdomains-api-https:
      entryPoints:
      - websecure
      priority: 100
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
      tls:
        certResolver: letsencrypt

    # Subdomains *.psysnap.com (Frontend HTTPS)
    clinic-subdomains-frontend-https:
      entryPoints:
      - websecure
      priority: 90
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`)
      service: clinic-frontend-service
      tls:
        certResolver: letsencrypt

    # HTTP (port 80) handlers
    clinic-main-frontend-http:
      entryPoints:
      - web
      priority: 100
      rule: Host(`psysnap.com`) || Host(`www.psysnap.com`)
      service: clinic-frontend-service

    clinic-main-api-http:
      entryPoints:
      - web
      priority: 110
      rule: (Host(`psysnap.com`) || Host(`www.psysnap.com`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service

    clinic-subdomains-frontend-http:
      entryPoints:
      - web
      priority: 50
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`)
      service: clinic-frontend-service

    clinic-subdomains-api-http:
      entryPoints:
      - web
      priority: 60
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service

    # Catchall
    clinic-catchall-api-http:
      entryPoints:
      - web
      priority: 5
      rule: PathPrefix(`/api`) || PathPrefix(`/storage`)
      service: clinic-api-service
    clinic-catchall-frontend-http:
      entryPoints:
      - web
      priority: 2
      rule: PathPrefix(`/`)
      service: clinic-frontend-service
    clinic-catchall-api-https:
      entryPoints:
      - websecure
      priority: 5
      rule: PathPrefix(`/api`) || PathPrefix(`/storage`)
      service: clinic-api-service
    clinic-catchall-frontend-https:
      entryPoints:
      - websecure
      priority: 2
      rule: PathPrefix(`/`)
      service: clinic-frontend-service
"""

cmd = f"""
if [ -f /etc/dokploy/traefik/dynamic/clinic-saas.yml ]; then
    mv /etc/dokploy/traefik/dynamic/clinic-saas.yml /etc/dokploy/traefik/dynamic/clinic-saas.yml.disabled
fi

cat << 'EOF' > /etc/dokploy/traefik/dynamic/clinic-wildcard.yml
{traefik_yaml}
EOF

# Restart Traefik container to trigger fresh ACME resolver
TRAEFIK_ID=$(docker ps -q -f name=traefik)
if [ -n "$TRAEFIK_ID" ]; then
    echo "Restarting Traefik container $TRAEFIK_ID..."
    docker restart $TRAEFIK_ID
fi
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))

print("Waiting 15 seconds for Traefik and Let's Encrypt to perform challenge...")
time.sleep(15)

# Check Traefik logs
cmd_logs = """
TRAEFIK_ID=$(docker ps -q -f name=traefik)
docker logs $TRAEFIK_ID --tail 40
"""
stdin, stdout, stderr = ssh.exec_command(cmd_logs)
print("=== Traefik Logs ===")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
