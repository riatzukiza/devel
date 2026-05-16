import requests
import os
import sys

def send_message(channel_id, content, file_path=None):
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        print("Error: DISCORD_BOT_TOKEN not set")
        return False
    
    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {"Authorization": f"Bot {token}"}
    
    if file_path:
        with open(file_path, "rb") as f:
            files = {"file": (os.path.basename(file_path), f)}
            data = {"content": content}
            response = requests.post(url, headers=headers, data=data, files=files)
    else:
        data = {"content": content}
        response = requests.post(url, headers=headers, json=data)

    if response.status_code in [200, 201]:
        print("Successfully published!")
        return True
    else:
        print(f"Failed. Status: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 send_discord_dynamic.py <channel_id> <message> [file_path]")
        sys.exit(1)
    channel = sys.argv[1]
    msg = sys.argv[2]
    path = sys.argv[3] if len(sys.argv) > 3 else None
    send_message(channel, msg, path)
