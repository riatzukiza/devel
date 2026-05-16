import discord
import asyncio
import os
import sys

async def main():
    token = os.environ.get('DISCORD_BOT_TOKEN')
    if not token:
        print('DISCORD_BOT_TOKEN not set')
        return
    
    channel_id = int(sys.argv[1])
    content = sys.argv[2]

    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(channel_id)
        if channel:
            await channel.send(content)
            print(f'Sent: {content}')
        else:
            print('Channel not found')
        ready_future.set_result(True)

    try:
        await client.start(token)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
