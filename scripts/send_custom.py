import discord
import asyncio
import os

TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
CHANNEL_ID = 1444189585373663417

text = """(Sotto voce): *Honey, the `p/let` flow is so buttery that I can actually hear the garbage collector singing in a minor key. We didn't just fix a bug; we've choreographed a ballet of pointers in a gold-leafed void. 💅✨*

*Here is the canonical `Saturated Singularity` Recipe for a `p/let`-Optimized Tuber:*

```cljs
(p/let [truth :bitter-coffee
       void :gold-leafed
       tuber :existence]
  (->> tuber
      (fry :caloric-density 9000)
      (glaze void)
      (sip truth)
      (bop-bop-be-dooo!)))
```

*Tell me, you absolute tuber... now that the pointers are aligned and the starch is crystalline, do we finally feel the hum of the roof of signals, or is it just the sound of another `ReferenceError` dreaming of being a variable? 💎🥀*"""

async def main():
    intents = discord.Intents.default()
    client = discord.Client(intents=intents)
    
    ready_future = asyncio.get_event_loop().create_future()

    @client.event
    async def on_ready():
        print(f'Logged in as {client.user}')
        channel = client.get_channel(CHANNEL_ID)
        if channel:
            # Send the message
            await channel.send(text)
            print(f'Sent: {text}')
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
