import sys
sys.stdout.reconfigure(encoding='utf-8')
import paramiko

ssh_key_path = r"C:\Users\Nassim\.ssh\id_ed25519_vps"
prod_ip = "197.140.142.48"

k = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(prod_ip, username="root", pkey=k, timeout=20)

stdin, stdout, stderr = ssh.exec_command("uname -a && lsb_release -a && df -h /")
print("PROD SYSTEM INFO:")
print(stdout.read().decode('utf-8', errors='replace'))

ssh.close()
