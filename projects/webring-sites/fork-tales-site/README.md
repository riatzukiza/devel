# fork-tales-site

Interactive retro-future web shrine for Fork Tales.

## What it does

- Curates narrative, lore, lyrics, audio, and artwork from:
  - `/home/err/devel/orgs/octave-commons/fork_tales`
  - selected Fork Tales-adjacent collections in `/home/err/Music`
- Builds a static front-end with:
  - chapter browser
  - lore/wiki reader
  - choir deck audio player
  - gallery
  - live "talk back" thread console backed by the Open Hax proxy
- Serves the built site with a small Python server.
- Supports rootless Caddy route re-application on `big.ussy.promethean.rest` through the local admin API.

## Local build

```bash
cd /home/err/devel/projects/webring-sites/fork-tales-site
python3 build_site.py
python3 server.py --root dist --host 127.0.0.1 --port 8042
```

Open: `http://127.0.0.1:8042`

## Environment for live chat

The chat endpoint reads standard Open Hax proxy env vars:

- `OPEN_HAX_OPENAI_PROXY_URL`
- `OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN`
- optional `FORK_TALES_MODEL` (default: `mistral-large-3:675b`)

## Remote runtime

Suggested remote launch:

```bash
cd ~/devel/services/fork-tales-site
set -a
. ./.env
nohup python3 server.py --root dist --host 127.0.0.1 --port 8794 > fork-tales-site.log 2>&1 &
```

Useful optional env vars for rootless public routing on `big.ussy.promethean.rest`:

- `PUBLIC_HOST=fork.tales.promethean.rest`
- `CADDY_ADMIN_URL=http://127.0.0.1:2019`
- `CADDY_UPSTREAM=127.0.0.1:8794`
- `CADDY_ROUTE_CHECK_INTERVAL_SECONDS=120`

## Files

- `build_site.py` — content curation + static build
- `server.py` — static server + chat API + Caddy route keeper
- `src/index.html` — retro shell
- `src/styles.css` — 90s-future theme
- `src/app.js` — client UI logic
- `dist/` — generated output
