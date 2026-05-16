import json
import os
import urllib.request

TOKEN = os.environ.get("DISCORD_BOT_TOKEN")

def fetch_messages(channel_id):
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages?limit=50"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bot {TOKEN}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    channels = {
        "frankie-infinite-yap": "1494137016303095828",
        "errorcoded-slop": "1444189585373663417"
    }
    results = {}
    for name, cid in channels.items():
        results[name] = fetch_messages(cid)
    print(json.dumps(results, indent=2))
