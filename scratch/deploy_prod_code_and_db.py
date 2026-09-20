import paramiko
import time
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
STAGING_IP = '145.223.116.54'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

def run_cmd(ssh, cmd, title=None, timeout=600):
    if title:
        print(f"\n{'='*50}\n>> {title}\n{'='*50}")
    print(f"RUN: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    while not stdout.channel.exit_status_ready():
        if stdout.channel.recv_ready():
            chunk = stdout.channel.recv(1024).decode('utf-8', errors='replace')
            sys.stdout.write(chunk)
            sys.stdout.flush()
        if stderr.channel.recv_stderr_ready():
            chunk = stderr.channel.recv_stderr(1024).decode('utf-8', errors='replace')
            sys.stderr.write(chunk)
            sys.stderr.flush()
        time.sleep(0.1)
        
    exit_code = stdout.channel.recv_exit_status()
    chunk = stdout.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stdout.write(chunk)
    chunk = stderr.read().decode('utf-8', errors='replace')
    if chunk:
        sys.stderr.write(chunk)
        
    print(f"\n[EXIT CODE: {exit_code}]")
    return exit_code

def main():
    print(f"Connecting to Staging ({STAGING_IP}) and Production ({PROD_IP})...")
    ssh_staging = paramiko.SSHClient()
    ssh_staging.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_staging.connect(STAGING_IP, username='root', key_filename=SSH_KEY)

    ssh_prod = paramiko.SSHClient()
    ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_prod.connect(PROD_IP, username='root', key_filename=SSH_KEY)

    # 1. Dump database on staging
    dump_cmd = """
docker exec clinic_mysql mysqldump --no-tablespaces -uclinic_user -pclinic_secure_password123 clinic_saas_db > /tmp/clean_production_dump.sql
ls -lh /tmp/clean_production_dump.sql
"""
    run_cmd(ssh_staging, dump_cmd, "Step 1: Dumping Clean Database from Staging")

    # 2. Transfer dump from staging to prod
    transfer_dump_cmd = f"""
scp -o StrictHostKeyChecking=no /tmp/clean_production_dump.sql root@{PROD_IP}:/tmp/clean_production_dump.sql
"""
    run_cmd(ssh_staging, transfer_dump_cmd, "Step 2: Transferring SQL Dump to Production VPS")

    # 3. Wait for MySQL container on prod to be ready and import DB
    import_db_cmd = """
echo "Checking MySQL container readiness..."
for i in {1..30}; do
    if docker exec clinic_mysql mysqladmin ping -uclinic_user -pclinic_secure_password123 --silent; then
        echo "MySQL is ready!"
        break
    fi
    echo "Waiting for MySQL... ($i/30)"
    sleep 2
done

echo "Importing database dump..."
docker exec -i clinic_mysql mysql -uclinic_user -pclinic_secure_password123 clinic_saas_db < /tmp/clean_production_dump.sql
echo "Verifying tables and benchmark clinics..."
docker exec clinic_mysql mysql -uclinic_user -pclinic_secure_password123 clinic_saas_db -e "SELECT count(*) as total_tenants FROM tenants; SELECT id, name, domain_slug FROM tenants;"
"""
    run_cmd(ssh_prod, import_db_cmd, "Step 3: Importing Clean Database into Production MySQL")

    # 4. Rsync /var/www/clinic-saas from staging to prod
    rsync_code_cmd = f"""
mkdir -p /var/www/clinic-saas
rsync -avz --delete \
    --exclude='.git' \
    /var/www/clinic-saas/ root@{PROD_IP}:/var/www/clinic-saas/
"""
    run_cmd(ssh_staging, rsync_code_cmd, "Step 4: Syncing Codebase Server-to-Server")

    # 5. Configure Traefik dynamic routing & SSL on Prod
    print(f"\n{'='*50}\n>> Step 5: Transferring and Configuring Traefik Dynamic Routing\n{'='*50}")
    # Read from staging
    sftp_staging = ssh_staging.open_sftp()
    with sftp_staging.file('/etc/dokploy/traefik/dynamic/clinic-saas.yml', 'r') as f:
        saas_yml = f.read().decode('utf-8')
    with sftp_staging.file('/etc/dokploy/traefik/dynamic/clinic-wildcard.yml', 'r') as f:
        wildcard_yml = f.read().decode('utf-8')
    sftp_staging.close()

    # Adapt gateway and IP
    saas_yml = saas_yml.replace('172.16.0.1', '172.17.0.1')
    wildcard_yml = wildcard_yml.replace('172.16.0.1', '172.17.0.1')
    wildcard_yml = wildcard_yml.replace('145.223.116.54', '197.140.142.48')

    # Ensure dynamic dir exists
    run_cmd(ssh_prod, "mkdir -p /etc/dokploy/traefik/dynamic")

    # Write to prod
    sftp_prod = ssh_prod.open_sftp()
    with sftp_prod.file('/etc/dokploy/traefik/dynamic/clinic-saas.yml', 'w') as f:
        f.write(saas_yml)
    with sftp_prod.file('/etc/dokploy/traefik/dynamic/clinic-wildcard.yml', 'w') as f:
        f.write(wildcard_yml)
    sftp_prod.close()

    traefik_restart_cmd = """
if [ -f /etc/dokploy/traefik/traefik.yml ]; then
    sed -i 's/email:.*/email: admin@psypro.tech/g' /etc/dokploy/traefik/traefik.yml
fi
echo "Restarting dokploy-traefik container..."
docker restart dokploy-traefik
"""
    run_cmd(ssh_prod, traefik_restart_cmd, "Restarting Traefik on Prod")

    # 6. Build frontend, clear backend cache, launch PM2
    start_services_cmd = """
cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link

cd /var/www/clinic-saas/frontend
npm run build

pm2 delete all || true

pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name "clinic-backend" --cwd /var/www/clinic-saas/backend
pm2 start "npm run preview -- --host 0.0.0.0 --port 3001" --name "clinic-frontend" --cwd /var/www/clinic-saas/frontend
pm2 start "php artisan queue:work --sleep=3 --tries=3" --name "clinic-queue" --cwd /var/www/clinic-saas/backend

pm2 save
pm2 startup systemd -u root --hp /root || true
pm2 list
"""
    run_cmd(ssh_prod, start_services_cmd, "Step 6: Building Frontend and Starting PM2 Services")

    # 7. Smoke Testing
    smoke_test_cmd = """
sleep 5
echo "--- Testing Backend direct ---"
curl -sI http://127.0.0.1:8000/up | head -n 5

echo "--- Testing Frontend direct ---"
curl -sI http://127.0.0.1:3001 | head -n 5

echo "--- Testing Traefik HTTP Routing ---"
curl -sI http://127.0.0.1/up | head -n 5
curl -sI -H "Host: psypro.tech" http://127.0.0.1/ | head -n 5
curl -sI -H "Host: oran-psy.psypro.tech" http://127.0.0.1/ | head -n 5
"""
    run_cmd(ssh_prod, smoke_test_cmd, "Step 7: Smoke Testing Production Services")

    ssh_staging.close()
    ssh_prod.close()
    print("\nPhase 2 Complete!")

if __name__ == '__main__':
    main()
