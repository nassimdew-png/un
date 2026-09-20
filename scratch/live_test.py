import requests

# 4. Auth Tour
r4 = requests.post('http://127.0.0.1:8000/api/user/complete-tour', headers={'Accept': 'application/json'})
print("Auth Complete Tour:", r4.status_code, r4.text)
