import requests
import os
import argparse

def send_discord_message(channel_id, content, file_path=None):
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        print("Error: DISCORD_BOT_TOKEN not set.")
        return False

    url = f"https://discord.com/api/v10/channels/{channel_id}/messages"
    headers = {"Authorization": f"Bot {token}"}

    data = {"content": content}
    files = None

    if file_path:
        if os.path.exists(file_path):
            files = {"file": (os.path.basename(file_path), open(file_path, "rb"))}
        else:
            print(f"Error: File {file_path} not found.")
            return False

    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        if response.status_code in [200, 201]:
            print(f"Successfully published to channel {channel_id}!")
            return True
        else:
            print(f"Failed to publish. Status: {response.status_code}")
            print(response.text)
            return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False
    finally:
        if files:
            files[0][1].close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Publish assets to Discord")
    parser.add_argument("--channel", required=True, help="Discord channel ID")
    parser.add_argument("--content", required=True, help="Message content")
    parser.add_argument("--file", help="Path to file to attach")
    args = parser.parse_args()

    send_discord_message(args.channel, args.content, args.file)
