# Codex.app Binary vs OSS Comparison

## Executive Summary

**Key Finding**: The Codex.app binary is **compiled from the same open-source code** at github.com/openai/codex. The Rust backend in the app is essentially a release build of the OSS `codex-rs` codebase.

**Implications for Custom Endpoints**: You can use the OSS config system to add custom model providers, but certain defaults (ChatGPT base URLs) are baked into both OSS and App.

---

## Architecture Comparison

| Component | OSS (github.com/openai/codex) | Codex.app Binary |
|-----------|------------------------------|------------------|
| Backend | `codex-rs/` Rust code | Compiled Rust (88MB arm64) |
| Config | `~/.codex/config.toml` | Same |
| Auth | ChatGPT OAuth or API Key | Same |
| Model Providers | OpenAI, Ollama, LM Studio | Same |
| API Endpoint | Configurable via `chatgpt_base_url` | Same |

---

## Code Shared Between OSS and App

### API Endpoints (in OSS source)
```rust
// core/src/model_provider_info.rs
let default_base_url = if matches!(auth_mode, Some(AuthMode::Chatgpt)) {
    "https://chatgpt.com/backend-api/codex"
} else {
    "https://api.openai.com/v1"
};

// core/src/config/mod.rs
chatgpt_base_url: "https://chatgpt.com/backend-api/"
```

### Auth URLs (in OSS source)
```rust
// core/src/auth.rs
"https://auth.openai.com/oauth/token"
"https://api.openai.com/auth"
```

### Usage Limit Messages (in OSS source)
```rust
// core/src/error.rs
"You've hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro)..."
"Visit https://chatgpt.com/codex/settings/usage to purchase more credits"
```

---

## What's App-Specific (Not in OSS)

### 1. Electron Shell
- `app.asar` frontend (36MB) - not part of OSS
- Sparkle update mechanism: `https://persistent.oaistatic.com/codex-app-prod/appcast.xml`
- DMG download: `https://persistent.oaistatic.com/codex-app-prod/Codex.dmg`

### 2. App-Specific Environment Variables
```
CODEX_APP_SERVER_FORCE_CLI
CODEX_APP_SERVER_WS_URL
CODEX_SPARKLE_ENABLED
```

### 3. App Protocol Extensions
The JSON-RPC protocol includes app-server specific methods not exposed in CLI:
- Window management
- System tray
- Native notifications
- File opener integrations

---

## Config Options Available in Both

### Model Provider Configuration
```toml
# ~/.codex/config.toml

# Use ChatGPT (requires login)
model_provider = "openai"

# Use local Ollama
model_provider = "ollama"
oss_provider = "ollama"

# Custom provider
[model_providers.my_custom]
name = "Custom Provider"
base_url = "https://my-api.example.com/v1"
env_key = "MY_API_KEY"
wire_api = "responses"
```

### Base URL Override
```toml
# Override ChatGPT backend URL
chatgpt_base_url = "https://custom.backend.example.com"

# Or via environment variable for OpenAI API
OPENAI_BASE_URL = "https://my-proxy.example.com/v1"
```

### OSS Provider Options
```toml
# Port for Ollama (default: 11434)
CODEX_OSS_PORT = "11434"

# Full base URL for OSS
CODEX_OSS_BASE_URL = "http://localhost:8080/v1"
```

---

## Custom Endpoint Strategies

### Strategy 1: config.toml Override (Recommended)

Add custom provider in `~/.codex/config.toml`:
```toml
model_provider = "custom"

[model_providers.custom]
name = "Custom API"
base_url = "https://my-llm-api.com/v1"
env_key = "CUSTOM_API_KEY"
experimental_bearer_token = "sk-xxx"  # Or use env_key
wire_api = "responses"
supports_websockets = false
```

### Strategy 2: Environment Variables

```bash
# Override OpenAI API endpoint
export OPENAI_BASE_URL="https://my-proxy.openai.com/v1"

# Override ChatGPT backend
export CODEX_CHATGPT_BASE_URL="https://custom.backend.com"

# OSS provider base URL
export CODEX_OSS_BASE_URL="http://localhost:8080/v1"
export CODEX_OSS_PORT="8080"
```

### Strategy 3: Local Proxy (Advanced)

Run a reverse proxy to intercept and modify API calls:
```bash
# mitmproxy or similar
mitmproxy -p 8080 --mode reverse:https://chatgpt.com/backend-api
```

Then set:
```toml
chatgpt_base_url = "http://localhost:8080"
```

---

## JSON-RPC Protocol (Shared OSS/App)

### Request Methods
```
initialize
thread/start
thread/resume
thread/fork
thread/archive
thread/rollback
thread/list
thread/read
skills/list
skills/remote/list
turn/start
turn/steer
turn/interrupt
model/list
config/read
config/value/write
account/login/start
account/logout
mcpServer/oauth/login
```

### Server-to-Client Notifications
```
thread/started
thread/status/changed
turn/started
turn/completed
item/started
item/completed
item/agentMessage/delta
item/commandExecution/outputDelta
account/updated
```

---

## Binary String Analysis

### Total Strings Extracted: 88,457
### OSS URL References Found: 366

### Binary-Only URLs (App-specific)
```
https://persistent.oaistatic.com/codex-app-prod/appcast.xml
https://persistent.oaistatic.com/codex-app-prod/Codex.dmg
```

### Auth-Related Strings (Both OSS and Binary)
```
https://auth.openai.com/oauth/token
https://api.openai.com/auth
https://api.openai.com/v1
https://chatgpt.com/backend-api
https://chatgpt.com/backend-api/codex
```

---

## Building from Source

If you want full control, build from OSS:

```bash
git clone https://github.com/openai/codex.git
cd codex/codex-rs

# Build CLI
cargo build --release -p codex-tui

# The binary will be at:
# target/release/codex
```

### Custom Build Modifications

1. **Change default base URL**:
   Edit `core/src/model_provider_info.rs`:
   ```rust
   // Change this line for ChatGPT mode
   "https://chatgpt.com/backend-api/codex"
   // to your custom endpoint
   ```

2. **Disable auth requirements**:
   Edit `model_providers.my_provider.requires_openai_auth = false`

3. **Add hardcoded provider**:
   Add to `built_in_model_providers()` function

---

## Key Files for Modification

| File | Purpose |
|------|---------|
| `core/src/model_provider_info.rs` | Provider definitions, base URLs |
| `core/src/config/mod.rs` | Config loading, defaults |
| `core/src/auth.rs` | OAuth flow, token handling |
| `core/src/client.rs` | HTTP client, request building |
| `tui/src/lib.rs` | TUI-specific defaults |

---

## Quick Reference: Complete ModelProviderInfo Config

Based on `config.schema.json`, all available options for custom providers:

```toml
[model_providers.my_provider]
# REQUIRED
name = "My Custom Provider"

# API Configuration
base_url = "https://api.example.com/v1"
wire_api = "responses"  # Only "responses" supported (chat removed)

# Authentication (use ONE of these)
env_key = "MY_API_KEY"                          # Reads from env var
experimental_bearer_token = "sk-xxx"            # Hardcoded token (less secure)

# Optional: Help text if API key is missing
env_key_instructions = "Get your key from https://example.com/keys"

# HTTP Customization
query_params = { "api-version" = "2025-04-01" }
http_headers = { "X-Custom-Header" = "value" }
env_http_headers = { "X-Auth-Header" = "MY_AUTH_ENV_VAR" }

# Retry/Timeout Settings
request_max_retries = 4          # Max retries for failed requests
stream_max_retries = 5           # Max retries for dropped streams
stream_idle_timeout_ms = 300000  # 5 min timeout for stream inactivity

# Auth Behavior
requires_openai_auth = false     # Skip OpenAI login flow for non-OpenAI APIs
supports_websockets = false      # Enable if your API supports WebSocket streaming
```

---

## Conclusion

The Codex.app binary IS the OSS code compiled. There are no hidden proprietary API endpoints - the same `chatgpt.com/backend-api` URLs exist in the public repo.

**For custom LLM endpoints:**
1. Use `model_providers` in config.toml
2. Set `base_url` and `env_key`
3. Use `wire_api = "responses"` (Chat Completions removed)
4. Set `requires_openai_auth = false` for non-OpenAI providers

**For intercepting/modifying requests:**
1. Use `chatgpt_base_url` config option
2. Use `OPENAI_BASE_URL` environment variable
3. Run a reverse proxy
