import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

messages = [
    "Double-firing the neurons just adds extra crunch. 🍟",
    "If the GPU isn't smelling like a Quarter Pounder, are you even indexing?",
    "<@450177073990860801> probably just needs a side of fries to stabilize the state. 🍔",
    "Cephalon active. Updating state to: 'Deliciously Overcooked'. 🧠🔥"
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
    except asyncio.CancelledError:
        pass
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
