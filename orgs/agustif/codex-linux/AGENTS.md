# Codex.app Reverse Engineering Repository

This repository contains reverse engineering work on OpenAI's Codex.app desktop application, including extracted binaries, the open-source codebase, and a Linux fork.

## Repository Structure

```
codex_app_reverse_engineer/
├── app/                    # Extracted app.asar from Codex.app
│   ├── .vite/build/        # Main process (main.js, preload.js)
│   ├── webview/            # Frontend UI (React/Vite)
│   ├── native/             # Native modules (sparkle.node)
│   └── skills/             # Built-in skills
├── app-asar-extracted/     # Duplicate extraction (same as app/)
├── codex-oss/              # Clone of github.com/openai/codex
│   ├── codex-rs/           # Rust backend source
│   │   ├── core/           # Core library (config, auth, client)
│   │   ├── cli/            # CLI binary
│   │   ├── tui/            # TUI interface
│   │   └── app-server/     # App server (WebSocket/JSON-RPC)
│   ├── sdk/                # TypeScript SDK
│   └── shell-tool-mcp/     # MCP server
├── codex-linux-fork/       # Community Linux fork
│   ├── main.js             # Electron main process
│   ├── preload.js          # Preload script
│   ├── webview/            # UI (copied from app/)
│   ├── resources/          # Icons and binaries
│   └── bin/                # Output for compiled codex binary
├── docker/                 # Docker build system
│   ├── Dockerfile          # Ubuntu 22.04 build environment
│   ├── docker-compose.yml  # Build orchestration
│   └── build.sh            # Build script
└── release/                # Output directory for builds
```

## Build Commands

### Primary Build Targets

```bash
# Quick build (x86_64 + arm64, Ubuntu) - for PRs and testing
make quick

# Full build (all architectures + distributions) - for releases
make full

# Full CI build with Codex.app download
make ci-build

# Docker build (legacy)
make build

# Run Electron wrapper locally
make dev

# Maintenance
make clean      # Remove build artifacts
make prune      # Clean + prune Docker caches
make shell      # Interactive build shell
```

### Codex Backend (Rust)

```bash
cd codex-oss/codex-rs

# Build app server (used by Linux fork)
cargo build --release -p codex-app-server

# Build CLI
cargo build --release -p codex-tui

# Run tests
cargo test                    # All tests
cargo test -p codex-tui       # Specific package

# With just (task runner)
just codex "prompt"           # Run codex
just fmt                      # Format code
just fix -p <project>         # Fix linter issues
just test                     # Run tests with nextest
just write-config-schema      # Regenerate config schema
```

### Electron Wrapper (Node.js)

```bash
cd codex-linux-fork

# Install dependencies
npm install

# Build packages (.deb, AppImage, .tar.gz)
npm run build:linux

# Build specific format
npm run build:deb
npm run build:appimage
npm run build:tarball

# Development
npm start                     # Run dev server
npm run watch                 # Watch mode
```

## Architecture

### Codex.app (macOS)

```
┌─────────────────────────────────────────────────────┐
│ Codex.app                                           │
│ /Applications/Codex.app                             │
├─────────────────────────────────────────────────────┤
│ Electron Shell (app.asar, 36MB)                     │
│   └── .vite/build/main.js + webview/ (React UI)     │
│                                                     │
│ Rust Backend (codex binary, 88MB)                   │
│   └── Compiled from codex-oss/codex-rs              │
└─────────────────────────────────────────────────────┘
```

**Communication**: JSON-RPC 2.0 over WebSocket or stdio

### Linux Fork

Same architecture, but:
- Built from source using Docker
- No Sparkle updater
- Outputs: .deb, AppImage, tarball

## Key Files

### For Reverse Engineering

| File | Purpose |
|------|---------|
| `app/.vite/build/main.js` | Electron main process (API URLs, auth) |
| `app/webview/assets/*.js` | Renderer/UI code |
| `app/package.json` | Build config, version info |
| `binary_strings.txt` | Extracted strings from codex binary |
| `binary_urls.txt` | URLs found in binary |

### For OSS Modifications

| File | Purpose |
|------|---------|
| `codex-oss/codex-rs/core/src/model_provider_info.rs` | Provider definitions, base URLs |
| `codex-oss/codex-rs/core/src/config/mod.rs` | Config loading, defaults |
| `codex-oss/codex-rs/core/src/auth.rs` | OAuth flow, token handling |
| `codex-oss/codex-rs/core/src/client.rs` | HTTP client, request building |
| `codex-oss/codex-rs/core/config.schema.json` | Config schema |

## Configuration

### App Config Location

```
~/Library/Application Support/Codex/
├── config.json          # User preferences
├── codex.db             # SQLite database
├── auth.json            # Auth tokens
└── vendor_imports/skills/  # Custom skills
```

### CLI Config Location

```
~/.codex/
├── config.toml          # Main config file
└── history/
```

### Environment Variables

```bash
# API Override
CODEX_API_BASE_URL="https://custom-api.example.com"
CODEX_API_ENDPOINT="localhost"
CODEX_CHATGPT_BASE_URL="https://custom.backend.com"

# App Server
CODEX_APP_SERVER_WS_URL="ws://localhost:8080"
CODEX_APP_SERVER_FORCE_CLI="true"

# OSS Provider
CODEX_OSS_BASE_URL="http://localhost:8080/v1"
CODEX_OSS_PORT="8080"

# Behavior
CODEX_HOME="/custom/path"
CODEX_SHELL="/bin/zsh"
CODEX_MAX_LOG_LEVEL="debug"
CODEX_SPARKLE_ENABLED="false"
```

## Custom API Endpoints

### Method 1: Environment Variable

```bash
export CODEX_API_BASE_URL="https://your-api.com"
```

### Method 2: config.toml

```toml
# ~/.codex/config.toml
chatgpt_base_url = "https://your-api.com"

# Or add custom provider
model_provider = "custom"

[model_providers.custom]
name = "Custom Provider"
base_url = "https://api.example.com/v1"
env_key = "CUSTOM_API_KEY"
wire_api = "responses"
requires_openai_auth = false
```

## Local LLM Support

### Using Ollama

```bash
ollama serve
/Applications/Codex.app/Contents/Resources/codex --oss --local-provider ollama
```

### Using LM Studio

```bash
lms server start
/Applications/Codex.app/Contents/Resources/codex --oss --local-provider lmstudio
```

## Skills System

Skills are stored in `~/Library/Application Support/Codex/vendor_imports/skills/`

### Structure

```
skill-name/
├── SKILL.md          # Required: Skill definition
├── agents/
│   └── openai.yaml   # OpenAI agent config
├── scripts/          # Optional scripts
├── references/       # Optional reference docs
└── assets/           # Optional assets
```

## JSON-RPC Protocol

### Key Methods

- `initialize` - Initialize connection
- `thread/start` - Start new conversation
- `thread/resume` - Resume conversation
- `turn/start` - Send message
- `turn/interrupt` - Stop current turn
- `skills/list` - List skills
- `config/read`, `config/write` - Config management

## Key Findings

1. **Binary is OSS code**: The Codex.app Rust binary is compiled from the open-source code at github.com/openai/codex
2. **Same config system**: Both OSS CLI and App use `~/.codex/config.toml`
3. **No hidden endpoints**: The `chatgpt.com/backend-api` URLs are in the public repo
4. **Build your own**: You can compile from source with custom modifications

## Development Workflow

### Modifying the Electron App

```bash
# Extract app.asar
npx asar extract /Applications/Codex.app/Contents/Resources/app.asar ./app

# After modifications, repack
npx asar pack ./app /Applications/Codex.app/Contents/Resources/app.asar

# Re-sign (optional but recommended)
codesign --force --deep --sign - /Applications/Codex.app
```

### Building Linux Fork from Source

```bash
# Full Docker build
make build

# Or manual:
cd codex-oss/codex-rs
cargo build --release -p codex-app-server
cp target/release/codex-app-server ../codex-linux-fork/bin/codex
cd ../codex-linux-fork
npm install
npm run rebuild
npm run build:linux
```

## Documentation

- `CODEX_REVERSE_ENGINEERING.md` - Full reverse engineering guide
- `BINARY_VS_OSS_COMPARISON.md` - Comparison between binary and OSS
- `codex-oss/AGENTS.md` - Agent guidelines for OSS repo

## Important Notes

- The `app/` and `app-asar-extracted/` directories contain identical content
- The Linux fork requires Docker for building (Ubuntu 22.04)
- Code signing is broken when modifying app.asar
- Use environment variables for customization when possible (no code changes needed)
