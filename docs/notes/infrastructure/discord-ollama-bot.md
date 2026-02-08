## Minimal Discord bot: `!start` / `!stop` + Ollama reply every minute

This bot:

* listens for `!start` and `!stop`
* when started, **fetches the last 100 messages** from the current channel
* sends that log to **Ollama** (`POST /api/generate`)
* posts the model’s response
* repeats roughly **once per minute**

Notes:

* To actually *read message text*, your bot will typically need **Message Content Intent** enabled; otherwise `content` can be empty for most messages. ([Discord Support][1])
* Fetching messages is done via `channel.messages.fetch({ limit: 100 })`. ([discord.js][2])
* Ollama generation uses `POST /api/generate` and you can disable streaming with `"stream": false`. ([Ollama Docs][3])

---

## Files

### `package.json`

```json
{
  "name": "discord-ollama-loop-bot",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.19.3",
    "dotenv": "^16.4.5"
  }
}
```

### `.env.example`

```bash
DISCORD_TOKEN=your_bot_token_here

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Bot behavior
COMMAND_PREFIX=!
LOOP_MS=60000
HISTORY_LIMIT=100
MAX_CONTEXT_CHARS=12000
MAX_REPLY_CHARS=1500
```

### `index.js`

```js
import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  Partials,
  PermissionsBitField,
} from "discord.js";

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) throw new Error("Missing DISCORD_TOKEN in env");

const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";

const COMMAND_PREFIX = process.env.COMMAND_PREFIX ?? "!";
const LOOP_MS = Number(process.env.LOOP_MS ?? 60_000);
const HISTORY_LIMIT = Number(process.env.HISTORY_LIMIT ?? 100);
const MAX_CONTEXT_CHARS = Number(process.env.MAX_CONTEXT_CHARS ?? 12_000);
const MAX_REPLY_CHARS = Number(process.env.MAX_REPLY_CHARS ?? 1_500);

// Per-channel runners
// channelId -> { stop: boolean, timer: NodeJS.Timeout | null, inFlight: boolean }
const runners = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // needed to read message text in many cases
  ],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`[ready] Logged in as ${client.user?.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (!message.guild) return; // keep it simple: guild channels only
    if (message.author.bot) return;
    if (!message.content.startsWith(COMMAND_PREFIX)) return;

    const [cmdRaw] = message.content
      .slice(COMMAND_PREFIX.length)
      .trim()
      .split(/\s+/);

    const cmd = (cmdRaw ?? "").toLowerCase();
    if (cmd !== "start" && cmd !== "stop") return;

    // Optional: restrict who can control it
    // (comment out if you want everyone to be able to start/stop)
    const member = message.member;
    const allowed =
      member?.permissions?.has(PermissionsBitField.Flags.ManageGuild) ||
      member?.permissions?.has(PermissionsBitField.Flags.ManageMessages);

    if (!allowed) {
      await message.reply("You don’t have permission to control this bot here.");
      return;
    }

    if (cmd === "start") {
      await startLoop(message.channel);
      await message.reply(
        `Started. I’ll read the last ${HISTORY_LIMIT} messages and post a reply about every ~${Math.round(
          LOOP_MS / 1000
        )}s.`
      );
    } else if (cmd === "stop") {
      const stopped = stopLoop(message.channel.id);
      await message.reply(stopped ? "Stopped." : "Not running in this channel.");
    }
  } catch (err) {
    console.error("[messageCreate] error:", err);
    try {
      await message.reply("Error handling command (check bot logs).");
    } catch {}
  }
});

async function startLoop(channel) {
  const existing = runners.get(channel.id);
  if (existing && !existing.stop) return; // already running

  const state = { stop: false, timer: null, inFlight: false };
  runners.set(channel.id, state);

  const tick = async () => {
    if (state.stop) return;

    // avoid overlapping calls if Ollama is slow
    if (state.inFlight) {
      state.timer = setTimeout(tick, LOOP_MS);
      return;
    }

    state.inFlight = true;
    try {
      const reply = await generateChannelReply(channel);
      if (reply) {
        await sendChunked(channel, reply, MAX_REPLY_CHARS);
      }
    } catch (err) {
      console.error(`[tick] channel=${channel.id} error:`, err);
      // you can optionally message the channel on errors; keeping quiet is usually nicer
    } finally {
      state.inFlight = false;
      state.timer = setTimeout(tick, LOOP_MS);
    }
  };

  // kick off immediately
  void tick();
}

function stopLoop(channelId) {
  const state = runners.get(channelId);
  if (!state || state.stop) return false;
  state.stop = true;
  if (state.timer) clearTimeout(state.timer);
  runners.delete(channelId);
  return true;
}

async function generateChannelReply(channel) {
  // Fetch recent messages
  const collection = await channel.messages.fetch({ limit: HISTORY_LIMIT });
  const messages = Array.from(collection.values())
    .filter((m) => !m.author?.bot)
    .filter((m) => typeof m.content === "string" && m.content.trim().length > 0)
    .filter((m) => !m.content.startsWith(COMMAND_PREFIX)) // don't feed commands back
    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  if (messages.length === 0) return null;

  // Build context text (trim to avoid huge prompts)
  const lines = messages.map((m) => {
    const name = m.member?.displayName ?? m.author.username;
    const content = m.content.replace(/\s+/g, " ").trim();
    return `${name}: ${content}`;
  });

  let context = lines.join("\n");
  if (context.length > MAX_CONTEXT_CHARS) {
    context = context.slice(context.length - MAX_CONTEXT_CHARS);
    // make it clear it's truncated
    context = `...(truncated)\n${context}`;
  }

  const prompt = [
    "You are a helpful participant in a Discord channel.",
    `Write ONE message (max ${MAX_REPLY_CHARS} characters) responding to the recent conversation.`,
    "Be concise. Do not quote the entire log. No preambles.",
    "",
    "Recent messages:",
    context,
    "",
    "Your message:",
  ].join("\n");

  const res = await fetch(`${OLLAMA_URL}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama error ${res.status}: ${text.slice(0, 500)}`);
  }

  const data = await res.json();
  const out = String(data?.response ?? "").trim();
  return out.length ? out : null;
}

async function sendChunked(channel, text, maxLen) {
  // Discord hard limit is 2000 chars; keep a safety margin
  const hardMax = Math.min(1900, maxLen);

  let remaining = text;
  while (remaining.length > 0) {
    const chunk = remaining.slice(0, hardMax);
    remaining = remaining.slice(hardMax);

    await channel.send({
      content: chunk,
      allowedMentions: { parse: [] }, // avoid accidental mass-mentions
    });
  }
}

await client.login(TOKEN);
```

---

## Setup

1. Create a bot in the Discord Developer Portal, invite it to your server, and copy the bot token.
2. **Enable Message Content Intent** (Developer Portal → Bot → Privileged Gateway Intents). Without it, message `content` may be empty for most channel history. ([Discord Support][1])

   * If you ever scale to 100+ servers, approval rules apply. ([Discord Support][4])
3. Ensure Ollama is running locally and the model exists.
4. Install + run:

```bash
npm i
cp .env.example .env
# edit .env
npm run start
```

In a channel where the bot can read/send messages:

* `!start`
* `!stop`

---

## Practical gotchas (so it doesn’t get annoying fast)

* If the channel is active, posting every minute can feel spammy; consider gating (only respond if new messages appeared since last tick).
* Filter out the bot’s own messages (already done) so it doesn’t “talk to itself”.
* If Ollama sometimes takes >60s, this implementation won’t overlap calls (it schedules the next tick after finishing).

If you want, I can tweak this into:

* **slash commands** (`/start` `/stop`)
* **per-channel config** (model, interval, system prompt)
* “respond only when there’s new activity” mode

[1]: https://support-dev.discord.com/hc/en-us/articles/6383579033751-Message-Content-Intent-Alternatives?utm_source=chatgpt.com "Message Content Intent Alternatives - Developers - Discord"
[2]: https://discord.js.org/docs/packages/discord.js/main/MessageManager%3Aclass?utm_source=chatgpt.com "MessageManager (discord.js - main)"
[3]: https://docs.ollama.com/api/generate?utm_source=chatgpt.com "Generate a response"
[4]: https://support-dev.discord.com/hc/en-us/articles/5324827539479-Message-Content-Intent-Review-Policy?utm_source=chatgpt.com "Message Content Intent Review Policy - Developers"
