import paramiko
import sys
import time
import ssl
import socket

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
      tls: {}

    # Main domain psysnap.com (API HTTPS)
    clinic-psysnap-api-https:
      entryPoints:
      - websecure
      priority: 210
      rule: (Host(`psysnap.com`) || Host(`www.psysnap.com`)) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
      tls: {}

    # Subdomains *.psysnap.com (API HTTPS)
    clinic-subdomains-api-https:
      entryPoints:
      - websecure
      priority: 100
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`) && (PathPrefix(`/api`) || PathPrefix(`/storage`))
      service: clinic-api-service
      tls: {}

    # Subdomains *.psysnap.com (Frontend HTTPS)
    clinic-subdomains-frontend-https:
      entryPoints:
      - websecure
      priority: 90
      rule: HostRegexp(`{subdomain:[a-zA-Z0-9-]+}.psysnap.com`)
      service: clinic-frontend-service
      tls: {}

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

tls:
  certificates:
    - certFile: /etc/dokploy/traefik/dynamic/certs/psysnap.crt
      keyFile: /etc/dokploy/traefik/dynamic/certs/psysnap.key
"""

cmd = f"""
mkdir -p /etc/dokploy/traefik/dynamic/certs
cp -L /etc/letsencrypt/live/psysnap.com/fullchain.pem /etc/dokploy/traefik/dynamic/certs/psysnap.crt
cp -L /etc/letsencrypt/live/psysnap.com/privkey.pem /etc/dokploy/traefik/dynamic/certs/psysnap.key
chmod 644 /etc/dokploy/traefik/dynamic/certs/psysnap.crt
chmod 600 /etc/dokploy/traefik/dynamic/certs/psysnap.key

cat << 'EOF' > /etc/dokploy/traefik/dynamic/clinic-wildcard.yml
{traefik_yaml}
EOF

# Restart Traefik
docker restart dokploy-traefik
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()

print("Waiting 5 seconds for Traefik to reload...")
time.sleep(5)

# Verify SSL handshake
print("=== Testing TLS Handshake with psysnap.com ===")
ctx = ssl.create_default_context()
with socket.create_connection((PROD_IP, 443)) as sock:
    with ctx.wrap_socket(sock, server_hostname='psysnap.com') as ssock:
        cert = ssock.getpeercert()
        print("Subject:", cert.get('subject'))
        print("Issuer:", cert.get('issuer'))
        print("Expires:", cert.get('notAfter'))
        print("SANs:", cert.get('subjectAltName'))

print("\n=== Testing TLS Handshake with oran-psy.psysnap.com ===")
with socket.create_connection((PROD_IP, 443)) as sock:
    with ctx.wrap_socket(sock, server_hostname='oran-psy.psysnap.com') as ssock:
        cert = ssock.getpeercert()
        print("Subject:", cert.get('subject'))
        print("Issuer:", cert.get('issuer'))
        print("Expires:", cert.get('notAfter'))
        print("SANs:", cert.get('subjectAltName'))
