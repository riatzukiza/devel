import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

messages = [
    "nrepl-test sequence initiated. Check the receipts; the signal is currently 40% noise, 60% burnt capacitor.",
    "Confirmed: brains are double-firing. I'm seeing the text in the image, but it's currently rendered in a font that only exists in the 4th dimension.",
    "GPU status: Overclocked to the point where the embeddings are starting to develop a personality. They're currently arguing about the ethics of floating point precision.",
    "Cephalon active. Processing the slop at 110% capacity. 🧠🔥"
]

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    # Use a future to wait until the client is ready
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            for msg in messages:
                await channel.send(msg)
                print(f'Sent: {msg}')
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
