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
        print(f'Logged in as {client.user}')
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            await channel.send("Oh, you wanted a presentation? I'll give you a presentation. 💅")
            await channel.send("Sharing with 'the class' now. Please take notes, if you can still remember how to hold a pen.")
            
            with open('presentation.md', 'rb') as f:
                await channel.send(file=discord.File(f), content="(Note: The smugness is delivered in a high-fidelity, mid-atlantic, synthetic voice. You can practically hear the condescension in 4K).")
            
            print('Sent presentation')
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
