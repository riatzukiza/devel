import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            # Send the file and the message
            with open('/home/err/devel/index_potato.svg', 'rb') as f:
                await channel.send(
                    content="I found the missing index. It was just a very tired potato trying to organize your sessions.", 
                    file=discord.File(f, filename='index_potato.svg')
                )
            print('Sent successfuly')
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
