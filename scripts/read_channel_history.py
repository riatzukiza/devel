import discord
import asyncio
import os
import sys

async def read_history(channel_id):
    TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
    if not TOKEN:
        print("Error: DISCORD_BOT_TOKEN not found")
        return
    
    intents = discord.Intents.default()
    intents.message_content = True
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(int(channel_id))
        if channel:
            print(f"--- History for channel {channel_id} ---")
            async for message in channel.history(limit=50):
                print(f"[{message.created_at}] {message.author}: {message.content}")
                if message.attachments:
                    for att in message.attachments:
                        print(f"  Attachment: {att.url}")
            print("--- End of History ---")
        else:
            print(f"Channel {channel_id} not found")
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 read_channel_history.py <channel_id>")
        sys.exit(1)
    
    channel_id = sys.argv[1]
    asyncio.run(read_history(channel_id))
