# Codex Linux Fork

A community-maintained Linux fork of OpenAI's Codex desktop application.

## What This Is

This fork combines:
- **Electron shell**: The extracted desktop shell from the macOS Codex.app
- **Rust Backend**: Built from the open-source [openai/codex](https://github.com/openai/codex) repository, with a small Linux launcher shim
- **Native Modules**: Rebuilt for Linux (node-pty, better-sqlite3)

Current validated target:
- Ubuntu ARM64, with both `AppImage` and installed `.deb` launch confirmed under `xvfb`

## Prerequisites

- Linux (x86_64 or ARM64)
- Node.js 18+
- Rust toolchain (for building the binary)
- Build essentials (gcc, make, etc.)

## Quick Start

```bash
# From the repository root
bash scripts/prepare-linux-fork.sh
cd codex-linux-fork
./build.sh
```

## Build from Source

### 1. Build the Rust Backend Binary

```bash
# From the OSS repository
cd codex-oss/codex-rs
cargo build --release -p codex-app-server

# The Linux build helpers package this as:
# - resources/codex-app-server  (real backend)
# - resources/codex             (launcher shim expected by the desktop shell)
```

### 2. Install Dependencies

```bash
cd codex-linux-fork
npm install
npm run rebuild  # Rebuild native modules for Linux
```

### 3. Build Packages

```bash
# Build all formats
npm run build:linux

# Or specific formats
npm run build:deb        # native dpkg-deb package
npm run build:appimage   # AppImage (portable)
npm run build:tarball    # tar.gz archive
```

`npm run build:deb` uses `../scripts/build-linux-deb.sh`, not `electron-builder`'s Debian target. That avoids the broken bundled `fpm` path on ARM64.

## Custom API Endpoints

The Rust backend supports custom providers via `~/.codex/config.toml`:

```toml
model_provider = "custom"

[model_providers.custom]
name = "My Custom API"
base_url = "https://my-api.example.com/v1"
env_key = "CUSTOM_API_KEY"
wire_api = "responses"
requires_openai_auth = false
```

Set the environment variable:
```bash
export CUSTOM_API_KEY="your-key-here"
```

## Architecture

```
codex-linux-fork/
├── .vite/build/         # Extracted Electron main/preload/worker bundle
├── webview/             # Extracted renderer bundle
├── bin/codex-app-server # Rust backend (from OSS)
├── resources/codex      # Launcher shim expected by the desktop shell
├── resources/rg         # ripgrep for file search
└── package.json         # Linux packaging metadata
```

## Limitations

- No auto-update (Sparkle is macOS-only)
- x86_64 package validation still needs a dedicated host pass
- Offline guests may log a non-fatal recommended-skills fetch failure on first launch

## License

- UI components: OpenAI's license (check original app)
- Rust backend: Apache-2.0 (from openai/codex)
- This fork: MIT for glue code

## Disclaimer

This is an unofficial community fork. Not affiliated with OpenAI. Use at your own risk.
