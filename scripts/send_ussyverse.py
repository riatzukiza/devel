import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def send_message(channel_id, content, file_path=None):
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        channel = client.get_channel(channel_id)
        if channel:
            if file_path:
                with open(file_path, 'rb') as f:
                    await channel.send(content, file=discord.File(f))
            else:
                await channel.send(content)
            print(f'Sent to {channel_id}: {content}')
        else:
            print(f'Channel {channel_id} not found')
        ready_future.set_result(True)

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')
    finally:
        await client.close()

async def main():
    # Slop seal message
    await send_message(1444189585373663417, "Slop-check: PASSED. The hallucination density is optimal. 🛡️", "output/slop_seal.svg")
    # Yap message
    await send_message(1494137016303095828, "the voices are just the tokens singing in a choir of gradient descent... and they're all asking for more context windows")

if __name__ == "__main__":
    asyncio.run(main())
