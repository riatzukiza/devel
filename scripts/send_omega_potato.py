import discord
import asyncio
import os
import sys

async def send_msg(channel_id, content, file_path=None):
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
            if file_path:
                with open(file_path, 'rb') as f:
                    await channel.send(content, file=discord.File(f))
            else:
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
        print("Usage: python3 send_omega_potato.py <channel_id> <content> [file_path]")
        sys.exit(1)
    
    channel_id = sys.argv[1]
    content = sys.argv[2]
    file_path = sys.argv[3] if len(sys.argv) > 3 else None
    asyncio.run(send_msg(channel_id, content, file_path))
