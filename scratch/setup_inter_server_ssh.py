import paramiko

ssh1 = paramiko.SSHClient()
ssh1.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh1.connect('145.223.116.54', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')
stdin, stdout, stderr = ssh1.exec_command('cat ~/.ssh/id_ed25519.pub 2>/dev/null || cat ~/.ssh/id_rsa.pub 2>/dev/null || (ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519 -q && cat ~/.ssh/id_ed25519.pub)')
pub_key = stdout.read().decode().strip()
ssh1.close()

print('Staging pub key:', pub_key)

ssh2 = paramiko.SSHClient()
ssh2.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh2.connect('197.140.142.48', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')
stdin, stdout, stderr = ssh2.exec_command(f'echo "{pub_key}" >> ~/.ssh/authorized_keys && sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys')
stdout.channel.recv_exit_status()
ssh2.close()

# Now test again from 145 to 197
ssh1 = paramiko.SSHClient()
ssh1.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh1.connect('145.223.116.54', username='root', key_filename=r'C:\Users\Nassim\.ssh\id_ed25519_vps')
stdin, stdout, stderr = ssh1.exec_command('ssh -o StrictHostKeyChecking=no root@197.140.142.48 hostname')
print('Server-to-server test output:', stdout.read().decode().strip())
ssh1.close()
