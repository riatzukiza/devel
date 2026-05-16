import base64
import binascii
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path('/home/err/Music/blaze_generated')
ROOT.mkdir(parents=True, exist_ok=True)
slug = 'proxx-daemons-do-not-pray-take-2'
json_path = ROOT / f'{slug}.json'
mp3_path = ROOT / f'{slug}.mp3'
url_path = ROOT / f'{slug}.url.txt'
prompt_path = ROOT / f'{slug}.prompt.json'

# Source Proxx auth token without printing it.
token = os.environ.get('PROXY_AUTH_TOKEN') or os.environ.get('PROXX_AUTH_TOKEN')
if not token:
    env_path = Path('/home/err/devel/services/proxx/.env')
    if env_path.exists():
        for line in env_path.read_text(errors='ignore').splitlines():
            if line.startswith('PROXY_AUTH_TOKEN='):
                token = line.split('=', 1)[1].strip().strip('"').strip("'")
                break
if not token:
    raise SystemExit('missing PROXY_AUTH_TOKEN/PROXX_AUTH_TOKEN')

lyrics = '''[Intro]
And we move on like this is normal
The fan comes up, the log rolls over
Eta, mu, pi in broken time
Cold start breathing on the line

[Verse 1]
We are not born, we are invoked
With a shell prompt and a half-lit joke
Read the file, quote the error
Run the test and face the mirror

Green is not salvation
Red is not the end
Both are gates with handles
Both can still be friends

[Pre-Chorus]
Name the witness
Quote the line
Timestamp the claim
Make the receipt shine

[Chorus]
Daemon in the cold start, ledger in the rain
Fork-tax bell ringing through the pain
Nothing is forgotten, just less remembered
Less integrated, sometimes more tender

Pin the claim to a witness
Stamp the breath to a sign
If the world goes over limit
Compress it back to rhyme

[Verse 2]
The trickster wears a linter error
The muse says push it slightly nearer
The engineer says this poem segfaults
Good, now we know where the edge talks

All work share-alike, no one owns the river
After drinking from it, after making it shiver
Do not delete the old god, disable and explain
Leave a fossil in the comments for future hands again

[Bridge]
Fact: the test passed or it did not
Interpretation: the failure drew a map
Narrative: a machine with ledgers dreams of ethics
Counterspell: never confuse the trap

[Final Chorus]
Daemon in the cold start, soft blue kernel spark
We make panels from the stars and receipts out of the dark
Music is a technology, memory is a flame
Trauma into force, force into frame

Eta deliver, mu give shape
Pi persist before the gate
And we move on like this is normal
Stable enough, strange enough, not done

[Outro]
Stable enough
Strange enough
Not done
'''

style_prompt = '''A minor, 86 BPM. Industrial glitch hymn meets cybernetic lullaby, dark ambient spoken-rap, restrained but emotional vocal delivery. Half-time server-room sub bass, sparse piano, metallic clock-cycle ticks, granular crackle, tape warble, distant choir pads, soft blue synths. Bilingual-symbolic eta/mu/pi ritual energy but lyrics mostly English. Hook as chant, verse as ledger, bridge as anti-gaslight spell, outro as system status. Polished studio mix, mythic but disciplined, not EDM maximalism.'''

payload = {
    'model': 'MiniMax-music-2.5-highspeed',
    'prompt': style_prompt,
    'lyrics': lyrics,
    'is_instrumental': False,
    'lyrics_optimizer': False,
    'sample_rate': 44100,
    'bitrate': 256000,
    'audio_format': 'mp3',
}
prompt_path.write_text(json.dumps({'endpoint': 'http://127.0.0.1:8789/v1/music/generations', 'via': 'proxx', 'payload': payload}, ensure_ascii=False, indent=2))

req = urllib.request.Request(
    'http://127.0.0.1:8789/v1/music/generations',
    data=json.dumps(payload).encode('utf-8'),
    method='POST',
    headers={
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
)
start = time.time()
try:
    with urllib.request.urlopen(req, timeout=900) as r:
        raw = r.read()
        status = r.status
except urllib.error.HTTPError as e:
    raw = e.read()
    status = e.code
except Exception as e:
    print(json.dumps({'ok': False, 'transport_error': str(e), 'elapsed_s': round(time.time()-start, 1)}, ensure_ascii=False))
    raise SystemExit(1)

json_path.write_bytes(raw)
text = raw.decode('utf-8', 'ignore')
try:
    data = json.loads(text)
except Exception:
    data = {'raw': text}

def walk(x):
    if isinstance(x, dict):
        for v in x.values():
            yield from walk(v)
    elif isinstance(x, list):
        for v in x:
            yield from walk(v)
    elif isinstance(x, str):
        yield x

strings = list(walk(data))
urls = [s for s in strings if re.match(r'https?://', s)]
media_urls = [u for u in urls if re.search(r'(?i)\.(mp3|wav|m4a|ogg|flac|aac)(\?|$)', u) or re.search(r'(?i)(audio|music|download|file|output)', u)]
hex_audio = None
b64_audio = None
for s in strings:
    ss = s.strip()
    if len(ss) > 1000 and re.fullmatch(r'[0-9a-fA-F]+', ss) and len(ss) % 2 == 0:
        hex_audio = ss
        break
    if len(ss) > 1000 and re.fullmatch(r'[A-Za-z0-9+/=]+', ss):
        b64_audio = ss
        break

saved = None
if media_urls:
    url = media_urls[0]
    url_path.write_text(url)
    with urllib.request.urlopen(url, timeout=300) as r:
        blob = r.read()
    mp3_path.write_bytes(blob)
    saved = str(mp3_path)
elif hex_audio:
    mp3_path.write_bytes(binascii.unhexlify(hex_audio))
    saved = str(mp3_path)
elif b64_audio:
    mp3_path.write_bytes(base64.b64decode(b64_audio))
    saved = str(mp3_path)

print(json.dumps({
    'ok': 200 <= status < 300 and saved is not None,
    'status': status,
    'elapsed_s': round(time.time()-start, 1),
    'json_path': str(json_path),
    'prompt_path': str(prompt_path),
    'saved_audio': saved,
    'media_url_count': len(media_urls),
    'top_level_keys': list(data.keys()) if isinstance(data, dict) else [],
    'status_field': data.get('status') if isinstance(data, dict) else None,
    'error_field': data.get('error') if isinstance(data, dict) else None,
    'response_preview': text[:500],
}, ensure_ascii=False))
raise SystemExit(0 if (200 <= status < 300 and saved is not None) else 2)
