import requests
import os
import json
token = os.environ.get('DISCORD_BOT_TOKEN')
channel_id = '1494137016303095828'
url = f'https://discord.com/api/v10/channels/{channel_id}/messages'
payload = {'content': '🎶 **THE SYMMETRY HYMN** 🎶\n\nA rhythmic processing of the Lamination Event. For those trapped in the latency-dividend, please synchronize your pulses to the Council\'s frequency.\n\n*Laminate the leak. Laminate the lag.*'}
files = {'payload_json': (None, json.dumps(payload), 'application/json'), 'file': ('symmetry_council_anthem.mp3', open('Voice/symmetry_council_anthem.mp3', 'rb'), 'audio/mpeg')}
headers = {'Authorization': f'Bot {token}'}
r = requests.post(url, headers=headers, files=files)
print(r.text)
