import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNELS = {
    "frankie-infinite-yap": 1494137016303095828,
    "errorcoded-slop": 1444189585373663417
}

async def main():
    intents = discord.Intents.default()
    intents.message_content = True
    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        for name, channel_id in CHANNELS.items():
            print(f'\n--- Reading channel {name} ({channel_id}) ---')
            channel = client.get_channel(channel_id)
            if channel:
                async for message in channel.history(limit=100):
                    print(f'[{message.created_at}] {message.author}: {message.content}')
                    for attach in message.attachments:
                        print(f'  Attachment: {attach.url}')
            else:
                print(f'Channel {name} not found')
        await client.close()

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(main())
