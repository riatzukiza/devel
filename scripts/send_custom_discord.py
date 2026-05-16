import discord
import asyncio
import os
import sys

async def send_msg(channel_id, content):
    TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
    if not TOKEN:
        print("Error: DISCORD_BOT_TOKEN not found")
        return
    
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(int(channel_id))
        if channel:
            await channel.send(content)
            print(f'Sent: {content}')
        else:
            print(f'Channel {channel_id} not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 send_custom_discord.py <channel_id> <content>")
        sys.exit(1)
    asyncio.run(send_msg(sys.argv[1], sys.argv[2]))
