
import json
import os
import time
import urllib.request
from pathlib import Path

# Try direct Blaze
BLAZE_KEY = os.environ.get('BLAZE_API_KEY') or os.environ.get('BLAZEAI_API_KEY')
if not BLAZE_KEY:
    env_path = Path('/home/err/devel/services/proxx/.env')
    if env_path.exists():
        for line in env_path.read_text(errors='ignore').splitlines():
            if line.startswith('BLAZE_API_KEY=') or line.startswith('BLAZEAI_API_KEY='):
                BLAZE_KEY = line.split('=', 1)[1].strip().strip('"').strip("'")
                break

if not BLAZE_KEY:
    raise SystemExit('No Blaze API key found')

payload = {
    'model': 'MiniMax-music-2.6-highspeed',
    'prompt': 'A minor, 120 BPM. Simple ambient test.',
    'is_instrumental': True,
    'lyrics_optimizer': False,
    'sample_rate': 44100,
    'bitrate': 256000,
    'audio_format': 'mp3',
}

req = urllib.request.Request(
    'https://blazeai.boxu.dev/api/music/generations',
    data=json.dumps(payload).encode('utf-8'),
    method='POST',
    headers={
        'Authorization': 'Bearer ' + BLAZE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
)

start = time.time()
try:
    with urllib.request.urlopen(req, timeout=120) as r:
        raw = r.read()
        status = r.status
except Exception as e:
    print(json.dumps({
        'ok': False,
        'error': str(e),
        'elapsed_s': round(time.time()-start, 1)
    }, ensure_ascii=False))
    raise SystemExit(1)

text = raw.decode('utf-8', 'ignore')
try:
    data = json.loads(text)
except:
    data = {'raw': text}

print(json.dumps({
    'ok': 200 <= status < 300,
    'status': status,
    'elapsed_s': round(time.time()-start, 1),
    'blaze_status': data.get('status'),
    'blaze_error': data.get('error'),
    'preview': text[:200],
}, ensure_ascii=False))
