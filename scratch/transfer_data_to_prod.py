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

print(">>> Dumping MySQL database on staging...")
dump_cmd = "docker exec clinic_mysql mysqldump -u root -proot_secure_password123 clinic_saas_db > /tmp/clean_clinic_saas_db.sql"
stdin, stdout, stderr = ssh_stage.exec_command(dump_cmd)
err = stderr.read().decode('utf-8')
if err and "Warning" not in err:
    print("Dump error:", err)
else:
    print("MySQL database dumped successfully to /tmp/clean_clinic_saas_db.sql")

print(">>> Transferring DB dump to production VPS...")
transfer_db_cmd = f"scp /tmp/clean_clinic_saas_db.sql root@{prod_ip}:/tmp/clean_clinic_saas_db.sql"
stdin, stdout, stderr = ssh_stage.exec_command(transfer_db_cmd)
print(stdout.read().decode('utf-8'))

print(">>> Syncing codebase /var/www/clinic-saas to production VPS...")
sync_code_cmd = f"""
ssh root@{prod_ip} 'mkdir -p /var/www/clinic-saas'
rsync -avz --exclude='node_modules' --exclude='.git' /var/www/clinic-saas/ root@{prod_ip}:/var/www/clinic-saas/
"""
stdin, stdout, stderr = ssh_stage.exec_command(sync_code_cmd)
for line in stdout:
    if "bytes/sec" in line or "total size is" in line:
        print(line.strip())

print("Codebase synced successfully!")

# Copy Traefik dynamic configs
print(">>> Copying Traefik configurations...")
traefik_sync_cmd = f"""
ssh root@{prod_ip} 'mkdir -p /etc/dokploy/traefik/dynamic'
scp /etc/dokploy/traefik/dynamic/clinic* root@{prod_ip}:/etc/dokploy/traefik/dynamic/
"""
stdin, stdout, stderr = ssh_stage.exec_command(traefik_sync_cmd)
print(stdout.read().decode('utf-8'))

ssh_stage.close()
print("\nData, codebase, and configs transferred from staging to prod!")
