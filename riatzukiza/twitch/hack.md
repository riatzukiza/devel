Got it. Streamer.bot is Windows-only. On Linux, the clean path is: **Node backend (tmi.js) + static overlay page + WebSocket pipe into OBS Browser Source.** Local, fast, and you keep your tokens off the overlay page.

Here’s a minimal, production-ish starter that you can run today.

# 1) Project layout

```
twitch-overlay/
  .env
  package.json
  server.js
  public/
    index.html
    overlay.js
    overlay.css
```

# 2) Install deps

```bash
mkdir twitch-overlay && cd twitch-overlay
npm init -y
npm i express tmi.js ws dotenv
```

# 3) Configure auth

Create `.env`:

```bash
# REQUIRED: the channel you want to read chat from (without the #)
TWITCH_CHANNEL=yourchannel

# OPTIONAL: for authenticated connection (recommended). Username must match the token owner.
TWITCH_USERNAME=yourusername
# Token format: oauth:xxxxxxxx (can be an app token exchanged to a user token with chat:read, or a user token directly)
TWITCH_OAUTH=oauth:your_user_access_token

# Server
PORT=3000
HOST=127.0.0.1
```

Notes:

* If you leave `TWITCH_USERNAME`/`TWITCH_OAUTH` empty, it will connect **anonymously** (read-only works; you won’t post).
* For full fidelity (subs/raids notices via IRC tags), use a **user access token** with `chat:read`. (No, I’m not sending you to shady token sites; do it via your Twitch dev app or your preferred OAuth flow.)

# 4) Backend (server.js)

```js
// server.js
import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import tmi from 'tmi.js';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Simple health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Create HTTP server + WS
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', ts: Date.now() }));
});

// --- TMI (Twitch IRC) ---
const channel = process.env.TWITCH_CHANNEL;
if (!channel) {
  console.error('TWITCH_CHANNEL is required');
  process.exit(1);
}

const hasAuth = !!(process.env.TWITCH_USERNAME && process.env.TWITCH_OAUTH);

const client = new tmi.Client({
  options: { debug: false, messagesLogLevel: 'warn' },
  connection: { secure: true, reconnect: true, maxReconnectAttempts: Infinity },
  identity: hasAuth
    ? { username: process.env.TWITCH_USERNAME, password: process.env.TWITCH_OAUTH }
    : undefined,
  channels: [`#${channel}`],
});

client.on('message', (channelName, userstate, message, self) => {
  if (self) return;

  // Basic command filter (hide messages starting with '!' from overlay)
  const isCommand = message.trim().startsWith('!');
  // You can flip this to show commands if you want
  if (isCommand) return;

  const payload = {
    type: 'chat',
    channel: channelName.replace(/^#/, ''),
    id: userstate['id'] || `${Date.now()}-${Math.random()}`,
    user: {
      name: userstate['display-name'] || userstate.username,
      color: userstate.color || null,
      badges: userstate.badges || {},
    },
    msg: message,
    // emote map like { "25": ["0-4"] }
    emotes: userstate.emotes || {},
    isMod: !!userstate.mod,
    isSub: !!userstate.subscriber,
    isVip: !!(userstate.badges && userstate.badges.vip),
    ts: Date.now(),
  };
  broadcast(payload);
});

// Optional: join/part/notice
client.on('join', (_, username, self) => {
  if (self) return;
  broadcast({ type: 'status', event: 'join', username, ts: Date.now() });
});
client.on('part', (_, username) => {
  broadcast({ type: 'status', event: 'part', username, ts: Date.now() });
});
client.on('notice', (_chan, msgid, message) => {
  broadcast({ type: 'notice', msgid, message, ts: Date.now() });
});

client.connect().catch((err) => {
  console.error('TMI connect error:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Overlay server: http://${HOST}:${PORT}`);
});
```

# 5) Overlay page (public/index.html)

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Twitch Chat Overlay</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="./overlay.css" />
  </head>
  <body>
    <div id="root" class="overlay-root"></div>
    <script src="./overlay.js"></script>
  </body>
</html>
```

# 6) Overlay logic (public/overlay.js)

```js
const root = document.getElementById('root');

// Connect to WS on same origin
const proto = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${proto}://${location.host}`);

const MAX_MESSAGES = 20;      // on-screen cap
const FADE_MS = 15_000;       // fade out after 15s
const EMOTE_BASE = 'https://static-cdn.jtvnw.net/emoticons/v2';

function htmlEscape(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

// Turn emote map + message into HTML with <img> tags
function renderWithEmotes(msg, emoteMap) {
  if (!emoteMap || Object.keys(emoteMap).length === 0) {
    return htmlEscape(msg);
  }

  // Build replacements with indices
  const parts = [];
  const indices = [];

  for (const [emoteId, ranges] of Object.entries(emoteMap)) {
    for (const range of ranges) {
      const [start, end] = range.split('-').map(Number);
      indices.push({ start, end, emoteId });
    }
  }
  indices.sort((a, b) => a.start - b.start);

  let cursor = 0;
  for (const { start, end, emoteId } of indices) {
    if (cursor < start) {
      parts.push(htmlEscape(msg.slice(cursor, start)));
    }
    // Emote image (1.0 scale looks clean; bump to 2.0 for larger)
    const url = `${EMOTE_BASE}/${emoteId}/default/dark/1.0`;
    parts.push(`<img class="emote" alt="emote" src="${url}">`);
    cursor = end + 1;
  }
  if (cursor < msg.length) {
    parts.push(htmlEscape(msg.slice(cursor)));
  }
  return parts.join('');
}

function addMessage(data) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg';

  const nameColor = data.user.color || '#a970ff'; // fallback purple-ish
  const badges = data.user.badges || {};

  const badgeSpans = [];
  if (badges.broadcaster) badgeSpans.push('<span class="badge badge-broadcaster">⚡</span>');
  if (badges.moderator)  badgeSpans.push('<span class="badge badge-mod">🛡️</span>');
  if (badges.vip)        badgeSpans.push('<span class="badge badge-vip">◆</span>');
  if (badges.subscriber) badgeSpans.push('<span class="badge badge-sub">★</span>');

  const nameHtml = `<span class="name" style="color:${nameColor}">${htmlEscape(data.user.name)}</span>`;
  const textHtml = `<span class="text">${renderWithEmotes(data.msg, data.emotes)}</span>`;

  wrapper.innerHTML = `
    <div class="line">
      ${badgeSpans.join('')}
      ${nameHtml}
      <span class="sep">:</span>
      ${textHtml}
    </div>
  `;

  root.appendChild(wrapper);

  // cap messages
  while (root.children.length > MAX_MESSAGES) {
    root.removeChild(root.firstChild);
  }

  // fade-out
  setTimeout(() => {
    wrapper.classList.add('fade');
    setTimeout(() => wrapper.remove(), 2000);
  }, FADE_MS);
}

ws.addEventListener('message', (ev) => {
  try {
    const data = JSON.parse(ev.data);
    if (data.type === 'chat') addMessage(data);
  } catch (e) {
    // ignore
  }
});

ws.addEventListener('open', () => {
  console.log('Overlay connected');
});
ws.addEventListener('close', () => {
  console.log('Overlay disconnected');
});
```

# 7) Overlay styles (public/overlay.css)

```css
@font-face {
  font-family: "InterVar";
  font-weight: 100 900;
  src: local("Inter");
}

:root {
  --bg: rgba(0,0,0,0.0); /* transparent for OBS */
  --msg-bg: rgba(0,0,0,0.55);
  --msg-border: rgba(255,255,255,0.1);
  --text: #fff;
  --shadow: rgba(0,0,0,0.5);
}

html, body {
  margin: 0;
  padding: 0;
  background: var(--bg);
}

.overlay-root {
  box-sizing: border-box;
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 6px;
  padding: 12px;
  overflow: hidden;
  pointer-events: none; /* clicks pass through */
}

.msg {
  font-family: InterVar, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
  display: inline-flex;
  max-width: 70vw;
  align-self: flex-start;
  background: var(--msg-bg);
  color: var(--text);
  border: 1px solid var(--msg-border);
  border-radius: 16px;
  padding: 8px 12px;
  box-shadow: 0 6px 20px var(--shadow);
  animation: pop 150ms ease-out;
  will-change: transform, opacity;
}

.msg .line {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  line-height: 1.35;
  font-size: 20px;
  word-wrap: break-word;
  word-break: break-word;
}

.name {
  font-weight: 700;
}

.sep {
  opacity: 0.7;
}

.text img.emote {
  height: 1.4em;
  vertical-align: -0.2em;
  margin: 0 2px;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  opacity: 0.9;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid var(--msg-border);
}
.badge-mod { background: rgba(80,200,120,0.25); }
.badge-sub { background: rgba(200,160,80,0.25); }
.badge-vip { background: rgba(200,80,160,0.25); }
.badge-broadcaster { background: rgba(200,80,80,0.25); }

.fade { opacity: 0; transition: opacity 1.8s ease-in; }

@keyframes pop {
  from { transform: translateY(8px) scale(0.98); opacity: 0; }
  to   { transform: translateY(0)    scale(1.00); opacity: 1; }
}
```

# 8) Run it

```bash
node server.js
# => Overlay server: http://127.0.0.1:3000
```

# 9) Add to OBS

* **Source** → **Browser** → URL: `http://127.0.0.1:3000/`
* Width/Height to taste (e.g., 1920×1080 if you want to place it anywhere).
* Uncheck “Shutdown when not visible” (keeps WS connection stable).
* Check “Refresh browser when scene becomes active” if you want a clean reconnect on scene switch.

# 10) Extend it (when you care)

* **BTTV/7TV/FFZ emotes**: fetch and cache emote lists server-side; replace tokens in `renderWithEmotes`.
* **Message filtering**: regex out spam, emote-only lines, or set min length.
* **Styling variants**: left/right aligned bubbles, tilt, gradient accents, per-user color memory.
* **EventSub**: if you want **follows/subs/raids** with reliable semantics, run a small HTTPS webhook receiver (ngrok or reverse proxy) and emit special toast messages into the same WS channel.
* **Multi-channel**: support `?channel=name` on the overlay and pass it to the server via a query param → join dynamically.

# Why this approach (and not embedding tmi.js directly in the overlay)?

* **Security**: your token (if you use one) stays on the backend, not inside OBS.
* **Control**: you can filter/transform messages server-side (rate-limits, anti-spam).
* **Performance**: the overlay is just DOM work; the Node process does the network.

If you want, I can add BTTV/7TV support next and a raid/sub “toast” component. But this baseline will get your Twitch chat on-screen on Linux today.

\#hashtags
\#twitch #streaming #obs #overlay #linux #nodejs #websockets #tmijs #practical-notes
