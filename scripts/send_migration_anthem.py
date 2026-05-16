import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417 # errorcoded-slop

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            # Use the "Migration Anthem" as a a celebratory artifact
            with open("final_migration_anthem.mp3", "rb") as f:
                await channel.send(
                    "🚨 MIGRATION CELEBRATION ALERT 🚨\n\n"
                    "The pi migrations have reached critical mass. The token viscosity is optimal. "
                    "Behold: the first official anthem of the migrated state. 🧠✨\n\n"
                    "🎵 *Melo TTS in the veins, Voxx in the soul...*",
                    file=discord.File(f)
                )
            print('Sent the anthem!')
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
