import discord
import asyncio
import os
import sys

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def fetch_messages(channel_id):
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(int(channel_id))
        if channel:
            messages = []
            async for msg in channel.history(limit=20):
                messages.append({
                    'id': msg.id,
                    'author': str(msg.author),
                    'content': msg.content,
                    'attachments': [a.url for a in msg.attachments]
                })
            print(f"--- Channel {channel_id} ---")
            for m in reversed(messages):
                print(f"[{m['author']}] {m['content']} (Attachments: {m['attachments']})")
        else:
            print(f'Channel {channel_id} not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python fetch_recent.py <channel_id>")
        sys.exit(1)
    
    channel_id = sys.argv[1]
    asyncio.run(fetch_messages(channel_id))
