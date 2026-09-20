import os
import shutil
from PIL import Image

src_dir = r"C:\Users\Nassim\.gemini\antigravity-ide\brain\f91e6f7f-6330-4485-934e-ca0d9b5b1269\.user_uploaded"
public_dir = r"E:\3\frontend\public"
assets_dir = r"E:\3\frontend\src\assets"

os.makedirs(public_dir, exist_ok=True)
os.makedirs(assets_dir, exist_ok=True)

img_16 = Image.open(os.path.join(src_dir, "media_1789859824065.png"))
img_32 = Image.open(os.path.join(src_dir, "media_1789859824083.png"))
img_48 = Image.open(os.path.join(src_dir, "media_1789859824701.png"))
img_180 = Image.open(os.path.join(src_dir, "media_1789859824114.png"))
img_192 = Image.open(os.path.join(src_dir, "media_1789859824728.png"))

# 1. Favicons
img_16.save(os.path.join(public_dir, "favicon-16x16.png"))
img_32.save(os.path.join(public_dir, "favicon-32x32.png"))
img_32.save(os.path.join(public_dir, "favicon.png"))

# Save multi-size .ico
img_ico = img_192.resize((48, 48), Image.Resampling.LANCZOS)
img_ico.save(os.path.join(public_dir, "favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

# 2. Touch & PWA icons
img_180.save(os.path.join(public_dir, "apple-touch-icon.png"))
img_192.save(os.path.join(public_dir, "pwa-192x192.png"))

img_512 = img_192.resize((512, 512), Image.Resampling.LANCZOS)
img_512.save(os.path.join(public_dir, "pwa-512x512.png"))

# 3. App / Web Logo
img_192.save(os.path.join(public_dir, "psysnap-logo.png"))
img_192.save(os.path.join(public_dir, "psysnap-icon.png"))
img_192.save(os.path.join(public_dir, "logo.png"))

img_192.save(os.path.join(assets_dir, "psysnap-logo.png"))
img_192.save(os.path.join(assets_dir, "logo.png"))

print("✅ Successfully generated and copied all PsySnap branding and logo files!")
