import discord
import asyncio
import os
import sys

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def send_message(channel_id, message):
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(int(channel_id))
        if channel:
            await channel.send(message)
            print(f'Sent to {channel_id}: {message}')
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
    if len(sys.argv) < 3:
        print("Usage: python discord_messenger.py <channel_id> <message>")
        sys.exit(1)
    
    channel_id = sys.argv[1]
    message = sys.argv[2]
    asyncio.run(send_message(channel_id, message))
