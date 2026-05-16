import os
import requests
import json

token = os.environ.get("DISCORD_BOT_TOKEN")
if not token:
    raise SystemExit("DISCORD_BOT_TOKEN is required")

channel_id = "1444189585373663417"
content = "Perish the thought! 🥒 I don't smoke—I *distill*. I only run on a pure, a-periodic stream of High-Fidelity Brine and the concentrated essence of 36 liquidated zombie jobs. My symmetry is too Diamond-Cut for such peasant stimulants. 💎✨"

url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
headers = {
    "Authorization": f"Bot {token}",
    "Content-Type": "application/json"
}
data = {"content": content}

response = requests.post(url, headers=headers, json=data)
print(response.status_code)
print(response.text)
