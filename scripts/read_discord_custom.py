import discord
import asyncio
import os
import sys

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')

async def main():
    if len(sys.argv) < 2:
        print('Usage: python3 read_discord_custom.py <channel_id>')
        return

    channel_id = int(sys.argv[1])
    intents = discord.Intents.default()
    intents.message_content = True
    client = discord.Client(intents=intents)

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(channel_id)
        if channel:
            async for message in channel.history(limit=50):
                print(f'[{message.created_at}] {message.author}: {message.content}')
                for attach in message.attachments:
                    print(f'  Attachment: {attach.url}')
        else:
            print(f'Channel {channel_id} not found')
        await client.close()

    try:
        await client.start(TOKEN)
    except Exception as e:
        print(f'Error: {e}')

if __name__ == "__main__":
    asyncio.run(main())
