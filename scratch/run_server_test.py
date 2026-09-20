import requests
import json
import base64
import struct
import math

# 1. Login or get token for Dr. Amina Benali / Admin
login_url = "http://127.0.0.1:8000/api/auth/login"
session = requests.Session()

res_login = session.post(login_url, json={"email": "amina.benali@psypro.tech", "password": "password123"})
if res_login.status_code != 200:
    res_login = session.post(login_url, json={"email": "admin@psypro.tech", "password": "password123"})

token = res_login.json().get("token") or res_login.json().get("access_token")
print(f"Login status: {res_login.status_code}, Token obtained: {bool(token)}")

headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json",
    "Content-Type": "application/json"
}

# 2. Test Studio 3: generate-exercise
print("\n--- TEST 1: Studio 3 (generate-exercise) ---")
res_ex = session.post(
    "http://127.0.0.1:8000/api/ai-therapy/generate-exercise",
    headers=headers,
    json={
        "content_type": "home_worksheet",
        "target_goal": "التدريب على الانتظار والتركيز الصفي",
        "child_name": "يوسف",
        "target_age": 7,
        "environment_setting": "المدرسة والبيت الجزائري"
    }
)
print(f"Exercise status: {res_ex.status_code}")
ex_data = res_ex.json()
print(f"Exercise success: {ex_data.get('success')}, has content: {bool(ex_data.get('content'))}")

# 3. Test Studio 5: generate-social-story
print("\n--- TEST 2: Studio 5 (generate-social-story) ---")
res_story = session.post(
    "http://127.0.0.1:8000/api/ai-therapy/generate-social-story",
    headers=headers,
    json={
        "behavior_target": "التحكم في نوبات الغضب والانتظار بهدوء",
        "child_name": "يوسف",
        "child_age": 7,
        "cultural_setting": "المدرسة والبيت"
    }
)
print(f"Social Story status: {res_story.status_code}")
story_data = res_story.json()
story_obj = story_data.get("story") or story_data.get("data")
print(f"Story success: {story_data.get('success')}, has panels: {bool(story_obj.get('panels') if isinstance(story_obj, dict) else False)}")

# 4. Generate 2-second 440Hz sine wave audio as WAV base64
print("\n--- TEST 3: Sine Wave Audio (No speech) Detection ---")
sample_rate = 16000
duration = 2.0
num_samples = int(sample_rate * duration)
sine_bytes = bytearray()
for i in range(num_samples):
    sample = int(32767 * 0.5 * math.sin(2 * math.pi * 440 * i / sample_rate))
    sine_bytes.extend(struct.pack('<h', sample))

# Simple WAV header
wav_header = bytearray(b'RIFF')
wav_header.extend(struct.pack('<I', 36 + len(sine_bytes)))
wav_header.extend(b'WAVEfmt ')
wav_header.extend(struct.pack('<I', 16)) # Subchunk1Size (16 for PCM)
wav_header.extend(struct.pack('<H', 1))  # AudioFormat (1 for PCM)
wav_header.extend(struct.pack('<H', 1))  # NumChannels (1 for mono)
wav_header.extend(struct.pack('<I', sample_rate)) # SampleRate
wav_header.extend(struct.pack('<I', sample_rate * 2)) # ByteRate
wav_header.extend(struct.pack('<H', 2))  # BlockAlign
wav_header.extend(struct.pack('<H', 16)) # BitsPerSample
wav_header.extend(b'data')
wav_header.extend(struct.pack('<I', len(sine_bytes)))
full_wav = bytes(wav_header + sine_bytes)
audio_b64 = "data:audio/wav;base64," + base64.b64encode(full_wav).decode('utf-8')

# Test Speech Studio with 440Hz Sine Tone
res_transcribe = session.post(
    "http://127.0.0.1:8000/api/ai-therapy/speech/transcribe-file",
    headers=headers,
    json={"audio_base64": audio_b64, "mime_type": "audio/wav"}
)
print(f"Transcribe Sine Tone status: {res_transcribe.status_code}")
trans_json = res_transcribe.json()
print(f"Transcribe response message: {trans_json.get('message')}, has_speech: {trans_json.get('has_speech')}")

# Test Stuttering / Fluency Analyzer with 440Hz Sine Tone
res_fluency = session.post(
    "http://127.0.0.1:8000/api/ai-therapy/orthophonie/analyze-fluency",
    headers=headers,
    json={"audio_base64": audio_b64, "mime_type": "audio/wav"}
)
print(f"Fluency Analyzer Sine Tone status: {res_fluency.status_code}")
flu_json = res_fluency.json()
print(f"Fluency response message: {flu_json.get('message')}, has_speech: {flu_json.get('has_speech')}")

print("\n=== VERIFICATION FINISHED ===")
