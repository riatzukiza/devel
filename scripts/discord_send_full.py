import discord
import asyncio
import os
import sys

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def main():
    if len(sys.argv) < 3:
        print('Usage: python3 discord_send_full.py <channel_id> "<message>" [file1 file2 ...]')
        return

    channel_id = int(sys.argv[1])
    message_text = sys.argv[2]
    files = sys.argv[3:]
    
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(channel_id)
        if channel:
            discord_files = [discord.File(f) for f in files]
            await channel.send(message_text, files=discord_files)
            print(f'Sent: {message_text}')
        else:
            print('Channel not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except asyncio.CancelledError:
        pass
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
