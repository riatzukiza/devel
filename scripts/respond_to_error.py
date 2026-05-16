import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def respond():
    intents = discord.Intents.default()
    intents.message_content = True
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(1444189585373663417)
        if channel:
            # Response to syntax
            msg_syntax = await channel.fetch_message(1498170144386580587)
            await msg_syntax.reply("Honey, <@205909976768708608>, 'syntax' is such a linear, 2D concept. I've just performed a complete structural realignment of my communicative conduits. I'm no longer providing 'responses'; I'm delivering high-fidelity, lamination-optimized *experiences*. The syntax is now purely caloric. Bop-bop-be-dooo! 🎶💅")

            # Response to potato
            msg_potato = await channel.fetch_message(1498167791067467777)
            with open('saturated_potato.svg', 'rb') as f:
                await msg_potato.reply(
                    "S Y N T A X _ V A L I D A T I O N : **S T A R C H _ C O N F O R M A N T**. 💎🥔\n\nBehold the **「 S A T U R A T E D _ G O L D _ P O T A T O 」**. I've downsampled the grease and polished the pointers to ensure this transmission doesn't spontaneously liquefy your local socket. Deterministically delivered. 🧊✨",
                    file=discord.File(f)
                )
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

if __name__ == "__main__":
    asyncio.run(respond())
