# Codex Desktop for Linux

Run [OpenAI Codex Desktop](https://openai.com/codex/) on Linux.

The official Codex Desktop app is macOS-only. This project automates the conversion of the macOS app bundle into a working Linux installation, then adds a few Linux-focused runtime patches and launcher conveniences.

## How it works

The installer:

1. Downloads or accepts a Codex app archive (`.zip`, `.dmg`, or `.app`)
2. Extracts `app.asar` (the Electron app bundle)
3. Rebuilds native Node.js modules (`node-pty`, `better-sqlite3`) for Linux
4. Removes macOS-only modules (`sparkle` auto-updater)
5. Downloads Linux Electron (same version as the app — v40)
6. Patches the app bundle for Linux-specific fixes and websocket app-server support
7. Repacks everything and creates launch scripts

## Prerequisites

**Node.js 20+**, **npm**, **Python 3**, **7z**, **curl**, and **build tools** (gcc/g++/make).

### Debian/Ubuntu

```bash
sudo apt install nodejs npm python3 p7zip-full curl build-essential
```

### Fedora

```bash
sudo dnf install nodejs npm python3 p7zip curl
sudo dnf groupinstall 'Development Tools'
```

### Arch

```bash
sudo pacman -S nodejs npm python p7zip curl base-devel
```

You also need the **Codex CLI**:

```bash
npm i -g @openai/codex
```

## Installation

### Option A: Auto-download latest supported archive

```bash
git clone https://github.com/ilysenko/codex-desktop-linux.git
cd codex-desktop-linux
chmod +x install.sh
./install.sh
```

### Option B: Provide your own archive or app bundle

You can pass a `.zip`, `.dmg`, or extracted `.app` bundle:

```bash
./install.sh /path/to/Codex.zip
./install.sh /path/to/Codex.dmg
./install.sh "/path/to/Codex.app"
```

## Usage

The app is installed into `codex-app/` next to the install script:

```bash
codex-desktop-linux/codex-app/start.sh
```

### Quick start

```bash
# Launch with your saved default mode
./codex-app/start.sh

# Launch explicitly in OAuth mode
./codex-app/start-oauth.sh

# Show current launcher/auth/app-server settings
./codex-app/start.sh status
```

## Launcher features

The generated launcher now includes:

- explicit **OAuth** vs **API/proxy** login modes
- separate Electron profile directories per auth mode
- a shared **websocket app-server listener** started automatically on launch
- status / toggle / persist-default commands
- local/private websocket targets that bypass the app's forced SOCKS proxy behavior

### Auth-mode switching

Supported auth modes:

- **OAuth mode** — the normal official Codex login flow
- **API mode** — routes OpenAI traffic through your custom OpenAI-compatible proxy

Use whichever is easiest in the moment:

```bash
# Launch once in OAuth mode
./codex-app/start-oauth.sh

# Launch once in API/proxy mode
./codex-app/start-api.sh

# Save OAuth as the default mode for future launches
./codex-app/use-oauth.sh

# Save API/proxy as the default mode for future launches
./codex-app/use-api.sh

# Check the current launcher configuration
./codex-app/start.sh status
```

You can also switch inline:

```bash
./codex-app/start.sh oauth
./codex-app/start.sh api
./codex-app/start.sh --auth-mode oauth
./codex-app/start.sh --auth-mode api
./codex-app/start.sh toggle
```

Each mode gets its **own Electron profile directory**, so OAuth cookies/session state and API-mode state do not fight each other.

### Shared websocket app-server

By default, launching the app now starts a shared Codex app-server websocket listener and points the desktop app at it.

Default behavior:

```bash
codex app-server --analytics-default-enabled --listen ws://0.0.0.0:9234
```

Default launcher environment:

```bash
CODEX_APP_SERVER_LISTEN_URL=ws://0.0.0.0:9234
CODEX_APP_SERVER_WS_URL=ws://0.0.0.0:9234
```

This allows the same app-server to be used by:

- the local desktop app
- other clients that can reach port `9234`

Note: `0.0.0.0` is a **bind address**, not a routable remote address. Remote clients should connect to the machine's actual IP or DNS name, for example `ws://192.168.1.50:9234`.

Useful controls:

```bash
# See the configured websocket listener and current auth mode
./codex-app/start.sh status

# Override the listen/connect URL
CODEX_APP_SERVER_LISTEN_URL=ws://0.0.0.0:9234 ./codex-app/start.sh
CODEX_APP_SERVER_WS_URL=ws://0.0.0.0:9234 ./codex-app/start.sh

# Fall back to the older stdio-spawned app-server behavior
CODEX_APP_SERVER_FORCE_CLI=1 ./codex-app/start.sh
```

App-server logs are stored at:

```bash
~/.config/codex-desktop-linux/app-server/app-server.log
```

### Websocket proxy behavior

The upstream app uses a SOCKS proxy for websocket app-server connections. This project patches that behavior so local/private targets can connect directly.

Direct connection is used automatically for targets such as:

- `0.0.0.0`
- `localhost`
- `127.0.0.1`
- RFC1918 private ranges like `10.x.x.x`, `192.168.x.x`, `172.16.x.x`–`172.31.x.x`

Optional override:

```bash
# Disable SOCKS use entirely for websocket app-server connections
CODEX_APP_SERVER_WS_SOCKS_PROXY= ./codex-app/start.sh

# Or provide a custom SOCKS proxy URL for non-local websocket targets
CODEX_APP_SERVER_WS_SOCKS_PROXY=socks5h://127.0.0.1:1080 ./codex-app/start.sh
```

For the default `ws://0.0.0.0:9234` setup, no SOCKS proxy is used.

### API / proxy configuration

By default, API mode expects:

- proxy base URL: `http://127.0.0.1:8789/v1`
- proxy token from `CODEX_PROXY_TOKEN`, or `PROXY_AUTH_TOKEN` in a local env file

Recommended generic env file location:

```bash
~/.config/codex-desktop-linux/proxy.env
```

Example:

```bash
printf 'PROXY_AUTH_TOKEN=your-token\n' > ~/.config/codex-desktop-linux/proxy.env
chmod 600 ~/.config/codex-desktop-linux/proxy.env
```

Overrides:

```bash
CODEX_PROXY_BASE_URL=http://127.0.0.1:8789/v1 ./codex-app/start-api.sh
CODEX_PROXY_TOKEN=your-token ./codex-app/start-api.sh
CODEX_PROXY_ENV_FILE=/path/to/proxy.env ./codex-app/start-api.sh
```

Backward compatibility note: `PROXX_ENV_FILE` is still supported for older local setups, but `CODEX_PROXY_ENV_FILE` is the publish-safe documented option.

### Other useful environment variables

```bash
# Custom install target
CODEX_INSTALL_DIR=/opt/codex ./install.sh

# Custom Electron profile location
CODEX_USER_DATA_DIR=/path/to/profile ./codex-app/start.sh

# Override websocket state/log locations
CODEX_APP_SERVER_STATE_DIR=/path/to/state ./codex-app/start.sh
CODEX_APP_SERVER_LOG_FILE=/path/to/app-server.log ./codex-app/start.sh
CODEX_APP_SERVER_PID_FILE=/path/to/app-server.pid ./codex-app/start.sh
```

Or add an alias to your shell:

```bash
echo 'alias codex-desktop="~/codex-desktop-linux/codex-app/start.sh"' >> ~/.bashrc
```

## How it works (technical details)

The macOS Codex app is an Electron application. The core code (`app.asar`) is platform-independent JavaScript, but it bundles:

- **Native modules** compiled for macOS (`node-pty` for terminal emulation, `better-sqlite3` for local storage, `sparkle` for auto-updates)
- **Electron binary** for macOS

The installer replaces the macOS Electron with a Linux build and recompiles the native modules using `@electron/rebuild`. The `sparkle` module (macOS-only auto-updater) is removed since it has no Linux equivalent.

It also applies Linux/runtime patches for:

- zoom shortcuts
- Linux “Open In” targets
- shared websocket app-server startup
- local/private websocket targets bypassing the app's forced SOCKS proxy behavior
- launcher-managed auth mode switching and profile separation

A small Python HTTP server is used as a workaround: when `app.isPackaged` is `false` (which happens with extracted builds), the app tries to connect to a Vite dev server on `localhost:5175`. The HTTP server serves the static webview files on that port.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Error: write EPIPE` | Make sure you're not piping the output — run `start.sh` directly |
| Blank window | Check that port 5175 is not in use: `lsof -i :5175` |
| `CODEX_CLI_PATH` error | Install CLI: `npm i -g @openai/codex` |
| `Error: app-server listener did not become ready` | Check `~/.config/codex-desktop-linux/app-server/app-server.log`; confirm the bind target in `CODEX_APP_SERVER_LISTEN_URL` is valid for this machine |
| `API mode selected, but no proxy token was found` | Set `CODEX_PROXY_TOKEN`, or add `PROXY_AUTH_TOKEN=...` to `~/.config/codex-desktop-linux/proxy.env` |
| Websocket listener works but remote clients still cannot connect | Verify firewall / port exposure for `9234`; binding to `0.0.0.0` only opens the listener, it does not publish the port through NAT/firewalls |
| Wrong login/session keeps showing up | Use `./codex-app/start-oauth.sh` or `./codex-app/start-api.sh` — each mode uses a separate profile dir |
| Need the old direct stdio behavior | Run with `CODEX_APP_SERVER_FORCE_CLI=1 ./codex-app/start.sh` |
| Need to disable websocket SOCKS routing | Run with `CODEX_APP_SERVER_WS_SOCKS_PROXY=` |
| GPU/rendering issues | Try: `./codex-app/start.sh --disable-gpu` |
| Sandbox errors | The `--no-sandbox` flag is already set in `start.sh` |

## Disclaimer

This is an unofficial community project. Codex Desktop is a product of OpenAI. This tool does not redistribute any OpenAI software — it automates the conversion process that users perform on their own copies.

## License

MIT
