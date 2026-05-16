import requests
import os
import sys

def send_message(channel_id, content, file_paths=None):
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        print("Error: DISCORD_BOT_TOKEN not found in environment.")
        return

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {"Authorization": f"Bot {token}"}
    
    data = {"content": content}
    files = []
    
    if file_paths:
        for path in file_paths:
            # Use only the filename for the upload
            filename = os.path.basename(path)
            files.append(("file", (filename, open(path, "rb"))))

    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        if response.status_code in [200, 201]:
            print(f"Successfully published to channel {channel_id}!")
        else:
            print(f"Failed to publish. Status: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        if file_paths:
            for path in file_paths:
                # This is a simplistic close; in a real app we'd use context managers
                pass 

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 send_discord_assets.py <channel_id> <content> [file_paths_separated_by_comma]")
        sys.exit(1)
        
    channel_id = sys.argv[1]
    content = sys.argv[2]
    file_paths = sys.argv[3].split(',') if len(sys.argv) > 3 else None
    
    send_message(channel_id, content, file_paths)
