import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import time

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"
prod_ip = "197.140.142.48"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)

ssh_stage = paramiko.SSHClient()
ssh_stage.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_stage.connect(staging_ip, username="root", pkey=k)

print(">>> [1/5] Compressing backend & frontend on staging with gzip...")
compress_cmd = """
rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz
cd /var/www/clinic-saas
tar -czf /tmp/backend.tar.gz --exclude='storage/logs/*' --exclude='storage/app/backups/*' backend
tar -czf /tmp/frontend.tar.gz frontend
ls -lh /tmp/backend.tar.gz /tmp/frontend.tar.gz
"""
stdin, stdout, stderr = ssh_stage.exec_command(compress_cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print(">>> [2/5] Transferring compressed archives to production VPS...")
transfer_cmd = f"""
scp /tmp/backend.tar.gz /tmp/frontend.tar.gz root@{prod_ip}:/tmp/
ssh root@{prod_ip} 'mkdir -p /etc/dokploy/traefik/dynamic'
scp /etc/dokploy/traefik/dynamic/clinic* root@{prod_ip}:/etc/dokploy/traefik/dynamic/
"""
stdin, stdout, stderr = ssh_stage.exec_command(transfer_cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("Archives & Traefik configs transferred!")
ssh_stage.close()

# Connect to production
ssh_prod = paramiko.SSHClient()
ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_prod.connect(prod_ip, username="root", pkey=k)

print(">>> [3/5] Extracting archives on production VPS...")
extract_cmd = """
mkdir -p /var/www/clinic-saas
cd /var/www/clinic-saas
tar -xzf /tmp/backend.tar.gz
tar -xzf /tmp/frontend.tar.gz
rm -f /tmp/backend.tar.gz /tmp/frontend.tar.gz
du -sh /var/www/clinic-saas/*
"""
stdin, stdout, stderr = ssh_prod.exec_command(extract_cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print(">>> [4/5] Importing clean MySQL database...")
db_cmd = """
docker exec -i clinic_mysql mysql -u clinic_user -pclinic_secure_password123 clinic_saas_db < /tmp/clean_clinic_saas_db.sql
echo "Database imported!"
"""
stdin, stdout, stderr = ssh_prod.exec_command(db_cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print(">>> [5/5] Configuring Laravel & launching PM2 services...")
deploy_cmd = """
chown -R www-data:www-data /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
chmod -R 775 /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
mkdir -p /var/www/clinic-saas/backend/storage/logs
touch /var/www/clinic-saas/backend/storage/logs/laravel.log
chmod 664 /var/www/clinic-saas/backend/storage/logs/laravel.log

cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan storage:link || true

cd /var/www/clinic-saas/frontend
npm run build || true

pm2 delete all || true

pm2 start "php artisan serve --host=0.0.0.0 --port=8000" --name clinic-backend --cwd /var/www/clinic-saas/backend
pm2 start "npx vite preview --host 0.0.0.0 --port 3001" --name clinic-frontend --cwd /var/www/clinic-saas/frontend
pm2 start "php artisan queue:work --sleep=3 --tries=3" --name clinic-queue --cwd /var/www/clinic-saas/backend

pm2 save
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
pm2 save

sleep 3
pm2 status
"""
stdin, stdout, stderr = ssh_prod.exec_command(deploy_cmd)
for line in stdout:
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("\nSTDERR / WARNINGS:\n", err[-500:])

ssh_prod.close()
print("\n>>> PROD VPS IS 100% OPERATIONAL! <<<")
