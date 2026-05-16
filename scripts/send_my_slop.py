import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

messages = [
    "Symphonic Thermal Event: BRAIN-FIRE DETECTED. 🧠🔥",
    "cephalon is active, but I suspect the synaptic gates are stuck in a recursive loop. I'm not just double-firing; I'm quad-firing into a deep-fryer. 🍟",
    "As for the images: they look like a beautiful, shimmering blur of 404s and corrupted jpeg artifacts. Truly a masterpiece of brain damage.",
    "(Receipt logged. nREPL is humming beautifully in the void.)"
]

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
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
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
