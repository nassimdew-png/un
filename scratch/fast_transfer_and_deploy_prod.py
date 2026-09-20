import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko
import time

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
staging_ip = "145.223.116.54"
prod_ip = "197.140.142.48"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)

# Connect to staging
ssh_stage = paramiko.SSHClient()
ssh_stage.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_stage.connect(staging_ip, username="root", pkey=k)

print(">>> [1/5] Streaming tar transfer of /var/www/clinic-saas to production VPS...")
stream_cmd = f"""
tar --exclude='.git' --exclude='backend/storage/logs/*.log' -cf - -C /var/www clinic-saas | ssh root@{prod_ip} 'mkdir -p /var/www && tar -xf - -C /var/www'
"""
stdin, stdout, stderr = ssh_stage.exec_command(stream_cmd)
err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("Tar stream info:", err)
print("Codebase transferred successfully!")

# Copy Traefik configs
print(">>> [2/5] Copying Traefik configurations...")
traefik_cmd = f"""
ssh root@{prod_ip} 'mkdir -p /etc/dokploy/traefik/dynamic'
scp /etc/dokploy/traefik/dynamic/clinic* root@{prod_ip}:/etc/dokploy/traefik/dynamic/
"""
stdin, stdout, stderr = ssh_stage.exec_command(traefik_cmd)
print("Traefik configs copied!")

ssh_stage.close()

# Now connect to production to setup DB, build frontend, and launch PM2
ssh_prod = paramiko.SSHClient()
ssh_prod.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh_prod.connect(prod_ip, username="root", pkey=k)

print(">>> [3/5] Importing clean database on production VPS...")
db_cmd = """
docker exec -i clinic_mysql mysql -u clinic_user -pclinic_secure_password123 clinic_saas_db < /tmp/clean_clinic_saas_db.sql
echo "Database imported successfully!"
"""
stdin, stdout, stderr = ssh_prod.exec_command(db_cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print(">>> [4/5] Setting permissions and optimizing Laravel...")
laravel_cmd = """
chown -R www-data:www-data /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
chmod -R 775 /var/www/clinic-saas/backend/storage /var/www/clinic-saas/backend/bootstrap/cache
cd /var/www/clinic-saas/backend
php artisan optimize:clear
php artisan storage:link || true
echo "Laravel ready!"
"""
stdin, stdout, stderr = ssh_prod.exec_command(laravel_cmd)
print(stdout.read().decode('utf-8', errors='replace'))

print(">>> [5/5] Building Frontend and Launching PM2...")
pm2_cmd = """
cd /var/www/clinic-saas/frontend
npm run build

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
stdin, stdout, stderr = ssh_prod.exec_command(pm2_cmd)
for line in stdout:
    print(line, end="")

err = stderr.read().decode('utf-8', errors='replace')
if err:
    print("\nSTDERR:\n", err[-500:])

ssh_prod.close()
print("\n>>> FULL DEPLOYMENT ON 197.140.142.48 COMPLETED! <<<")
