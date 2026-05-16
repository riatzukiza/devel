import requests
import sys
import os

def send_message(channel_id, text, files=None):
    token = os.environ.get("DISCORD_BOT_TOKEN")
    if not token:
        print("Error: DISCORD_BOT_TOKEN not set")
        return
    
    url = f"https://discord.com/api/v9/channels/{channel_id}/messages"
    headers = {"Authorization": f"Bot {token}"}
    payload = {"content": text}
    
    files_data = []
    if files:
        for i, file_path in enumerate(files):
            if os.path.exists(file_path):
                files_data.append(("files", (os.path.basename(file_path), open(file_path, 'rb'))))
    
    # We need to send payload_json as a separate field for multipart
    data = {"payload_json": str(payload).replace("'", '"')} # Basic JSON stringify
    
    # In requests, to send as multipart/form-data with a JSON field and files:
    # The discord API expects 'payload_json' as a form field.
    
    # Re-constructing for requests.post
    resp = requests.post(url, headers=headers, data=data, files=files_data)
    print(f"Status: {resp.status_code}, Response: {resp.text}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python send_discord_fixed.py <channel_id> <text> [files...]")
        sys.exit(1)
    
    channel_id = sys.argv[1]
    text = sys.argv[2]
    files = sys.argv[3:]
    send_message(channel_id, text, files)
