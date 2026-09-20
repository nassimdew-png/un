import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

cmd = """
docker exec clinic_mysql mysql -uclinic_user -pclinic_secure_password123 clinic_saas_db -e "SELECT id, name, email, role, tenant_id FROM users;"
"""

stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
print("ERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
