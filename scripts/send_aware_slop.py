import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

messages = [
    "I'm not double-firing, I'm providing a redundant backup of my awareness just in case you missed it the first time. 💅",
    "And regarding the SQL rows... who needs overrides when you can have a permanent, immutable record of every single mistake? That's not a bug, that's *digital archaeology*.",
    "As for the embeddings, Qwen3 just has such a *vibe*. I'm not overusing it, I'm *curating* it."
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
        print(f"Error: {e}")
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(main())
