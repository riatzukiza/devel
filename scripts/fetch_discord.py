import json
import os
import urllib.request
import urllib.parse

TOKEN = os.environ.get("DISCORD_BOT_TOKEN")
CHANNEL_ID = "1444189585373663417"

def fetch_messages(channel_id):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=50"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))

if __name__ == "__main__":
    print(json.dumps(fetch_messages(CHANNEL_ID), indent=2))
