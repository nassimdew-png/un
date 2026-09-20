import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')

token = '724|pJAfu4L1ykpYOOYaVHHii1HKqS3cqcsyDeVQrhID9c8c9303'
cmd = f"""curl -s -H 'Authorization: Bearer {token}' -H 'Accept: application/json' -H 'Host: psypro.tech' http://127.0.0.1/api/super-admin/stats"""

stdin, stdout, stderr = ssh.exec_command(cmd)
res = stdout.read().decode('utf-8', errors='replace')
print("Stats response:")
print(res[:600])
ssh.close()
