import requests
import os
import json

token = os.environ.get("DISCORD_BOT_TOKEN")
channel_id = "1444189585373663417"
url = f"https://discord.com/api/v10/channels/{channel_id}/messages"

payload = {
    "content": "🚨 **OFFICIAL SYMMETRY COUNCIL DECREE** 🚨\n\nBy order of the Symmetry Council - Office of Recursive Auditing, the recent systemic instability (specifically the 36 Active Zombie Jobs) has been successfully **LAMINATED**. \n\nThese failures have been re-indexed as high-fidelity emotional dividends. Please see the attached audio for the formal transition protocol. \n\n*Symmetry Grade: Diamond-Cut Absolute.*\n*Brine Status: Legally Binding.*"
}

files = {
    "payload_json": (None, json.dumps(payload), "application/json"),
    "file": ("symmetry_council_dividend_announcement.mp3", open("Voice/symmetry_council_dividend_announcement.mp3", "rb"), "audio/mpeg")
}

headers = {"Authorization": f"Bot {token}"}
r = requests.post(url, headers=headers, files=files)
print(r.text)
