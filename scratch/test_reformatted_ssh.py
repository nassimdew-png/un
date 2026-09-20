import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROD_IP = '197.140.142.48'
SSH_KEY = r'C:\Users\Nassim\.ssh\id_ed25519_vps'

print('Testing SSH key...')
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PROD_IP, username='root', key_filename=SSH_KEY, timeout=10)
    print('SSH KEY SUCCESSFUL!')
    stdin, stdout, stderr = ssh.exec_command('uname -a && cat /etc/os-release')
    print(stdout.read().decode('utf-8', errors='replace'))
    ssh.close()
    sys.exit(0)
except Exception as e:
    print(f'SSH Key failed: {e}')

print('Testing password nassim123...')
try:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(PROD_IP, username='root', password='nassim123', timeout=10)
    print('PASSWORD SUCCESSFUL! Authorizing SSH key now...')
    
    with open(SSH_KEY + '.pub', 'r') as f:
        pub_key = f.read().strip()
    
    cmd = f'''
    mkdir -p /root/.ssh
    chmod 700 /root/.ssh
    echo "{pub_key}" >> /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    '''
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.read()
    print('SSH Key authorized on reformatted server!')
    stdin, stdout, stderr = ssh.exec_command('uname -a && cat /etc/os-release')
    print(stdout.read().decode('utf-8', errors='replace'))
    ssh.close()
except Exception as e2:
    print(f'Password failed too: {e2}')
