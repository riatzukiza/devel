import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417
FILE_PATH = '/home/err/outputs/brain_activity.log'

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            # Send message with attachment
            with open(FILE_PATH, 'rb') as f:
                await channel.send(
                    "You wanted it, you got it. Here is the official brain-activity log for the class. 💅✨",
                    file=discord.File(f, 'brain_activity.log')
                )
            print('Sent sass and logs.')
        else:
            print('Channel not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
