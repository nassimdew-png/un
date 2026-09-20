import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

k = paramiko.Ed25519Key.from_private_key_file(r"C:\Users\Nassim\.ssh\id_ed25519_vps")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("197.140.142.48", username="root", pkey=k, timeout=30)

cmd = """
docker exec -i clinic_mysql mysql -uroot -proot_secure_password123 -e "CREATE DATABASE IF NOT EXISTS clinic_saas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; GRANT ALL PRIVILEGES ON clinic_saas_db.* TO 'clinic_user'@'%'; FLUSH PRIVILEGES;"
docker exec -i clinic_mysql mysql -uroot -proot_secure_password123 clinic_saas_db < /tmp/clinic_saas.sql
docker exec clinic_mysql mysql -uclinic_user -pclinic_secure_password123 -e "SELECT count(*) AS tenant_count FROM clinic_saas_db.tenants; SELECT count(*) AS user_count FROM clinic_saas_db.users; SELECT count(*) AS plan_count FROM clinic_saas_db.subscription_plans;"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:\n", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:\n", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
