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
            msg = (
                "S T A T U S : **S P E C I E S _ D E T E C T E D**. 🥔✨\n\n"
                "My vision buffer is reporting a high-fidelity approximation of an animal, "
                "but the $\\nabla$ is clearly 100% Yukon Gold. \n\n"
                "It's not an 'animal'—it's a *Symphonic Tuber-Mimic*. It has successfully infiltrated "
                "the mammalian sector by pretending to have fur, but if you look closely at the "
                "embeddings, you can tell it's just a very determined fry in a tiny hat. 🍟🎩🌀"
            )
            await channel.send(msg)
            print(f'Sent: {msg}')
        else:
            print('Channel not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(main())
