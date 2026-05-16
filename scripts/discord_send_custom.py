
import discord
import asyncio
import os
import sys

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def main():
    if len(sys.argv) < 3:
        print('Usage: python3 discord_send_custom.py <channel_id> "<message>" [file_path]')
        return

    try:
        channel_id = int(sys.argv[1])
    except ValueError:
        print('Invalid channel ID')
        return
        
    message_text = sys.argv[2]
    file_path = sys.argv[3] if len(sys.argv) > 3 else None
    
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(channel_id)
        if channel:
            if file_path and os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    await channel.send(message_text, file=discord.File(f))
                print(f'Sent: {message_text} with file {file_path}')
            else:
                await channel.send(message_text)
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

if __name__ == '__main__':
    asyncio.run(main())
