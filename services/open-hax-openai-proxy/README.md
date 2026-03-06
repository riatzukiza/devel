# Open Hax OpenAI Proxy

OpenAI-compatible proxy server with provider-scoped account rotation.

## Features

- `POST /v1/chat/completions` compatibility endpoint.
- Multi-provider routing through one OpenAI-compatible endpoint.
- Model-aware upstream routing for Claude models: `claude-*` can be sent to upstream `POST /v1/messages` and converted back into chat-completions format.
- Model-aware upstream routing: `gpt-*` models are sent to upstream `POST /v1/responses` and converted back into chat-completions format.
- Preserves reasoning traces when translating Responses/Messages payloads by mapping them to OpenAI-compatible `reasoning_content` in non-stream and synthetic stream responses.
- Maps OpenAI-style reasoning controls (`reasoning_effort` / `reasoning.effort`) into Claude `thinking` payloads and adds the interleaved-thinking beta header when enabled.
- Model-aware routing to OpenAI provider: models prefixed with `openai/` or `openai:` route to configured OpenAI endpoints.
- Model-aware routing to Ollama base API: models prefixed with `ollama/` or `ollama:` are sent to Ollama `POST /api/chat`.
- Built-in React/Vite console with separate Chat, Credentials, and Tools/MCP pages.
- OpenAI OAuth browser + device flows based on OpenCode Codex plugin behavior (PKCE, state, callback exchange, account extraction).
- Chroma-backed semantic history search with lexical fallback for chat session recall.
- `GET /v1/models` and `GET /v1/models/:id` model listing.
- `GET /v1/models` merges static models with live Ollama/Ollama Cloud catalogs when configured.
- Auto-aliases tagged Ollama families to the largest variant (for example `qwen3.5` -> `qwen3.5:397b`).
- Provider-scoped account rotation when upstream returns rate limits (`429`, plus `403/503` with `retry-after`).
- Cross-provider fallback for shared models (for example `vivgrid` <-> `ollama-cloud`) when one provider's keys or upstream path fails.
- Flexible `keys.json` supports both API-key and OAuth bearer accounts, with multiple accounts per provider.

## Setup

1. Create `keys.json` from `keys.example.json`.
2. Optionally create `models.json` from `models.example.json`.
3. Set `PROXY_AUTH_TOKEN` (required by default).
4. Start the server.

```bash
pnpm --filter @workspace/open-hax-openai-proxy dev
```

Build and run production mode:

```bash
pnpm --filter @workspace/open-hax-openai-proxy build
pnpm --filter @workspace/open-hax-openai-proxy start
```

Run the web console in dev mode:

```bash
pnpm --filter @workspace/open-hax-openai-proxy web:dev
```

Build the web console:

```bash
pnpm --filter @workspace/open-hax-openai-proxy web:build
```

## Environment Variables

- `PROXY_HOST` (default: `127.0.0.1`)
- `PROXY_PORT` (default: `8789`)
- `UPSTREAM_PROVIDER_ID` (default: `vivgrid`; provider key in `keys.json`)
- `UPSTREAM_FALLBACK_PROVIDER_IDS` (default: auto `ollama-cloud` when primary is `vivgrid`, or `vivgrid` when primary is `ollama-cloud`; comma-separated)
- `UPSTREAM_BASE_URL` (default: `https://api.vivgrid.com`)
- `UPSTREAM_PROVIDER_BASE_URLS` (optional mapping: `provider=url,provider=url`; defaults include `vivgrid=https://api.vivgrid.com` and `ollama-cloud=https://ollama.com`)
- `OPENAI_PROVIDER_ID` (default: `openai`; provider key in `keys.json`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com`)
- `OLLAMA_BASE_URL` (default: `http://127.0.0.1:11434`)
- `UPSTREAM_CHAT_COMPLETIONS_PATH` (default: `/v1/chat/completions`)
- `OPENAI_CHAT_COMPLETIONS_PATH` (default: `/v1/chat/completions`)
- `UPSTREAM_MESSAGES_PATH` (default: `/v1/messages`)
- `UPSTREAM_MESSAGES_MODEL_PREFIXES` (default: `claude-`; comma-separated prefixes)
- `UPSTREAM_MESSAGES_INTERLEAVED_THINKING_BETA` (default: `interleaved-thinking-2025-05-14`; set empty to disable auto `anthropic-beta` injection when thinking is enabled)
- `UPSTREAM_RESPONSES_PATH` (default: `/v1/responses`)
- `OPENAI_RESPONSES_PATH` (default: `/v1/responses`)
- `UPSTREAM_RESPONSES_MODEL_PREFIXES` (default: `gpt-`; comma-separated prefixes)
- `OPENAI_MODEL_PREFIXES` (default: `openai/,openai:`; comma-separated prefixes)
- `OLLAMA_CHAT_PATH` (default: `/api/chat`)
- `OLLAMA_MODEL_PREFIXES` (default: `ollama/,ollama:`; comma-separated prefixes)
- `PROXY_KEYS_FILE` (default: `./keys.json`, fallback: `VIVGRID_KEYS_FILE`)
- `PROXY_MODELS_FILE` (default: `./models.json`, fallback: `VIVGRID_MODELS_FILE`)
- `PROXY_KEY_RELOAD_MS` (default: `5000`, fallback: `VIVGRID_KEY_RELOAD_MS`)
- `PROXY_KEY_COOLDOWN_MS` (default: `30000`, fallback: `VIVGRID_KEY_COOLDOWN_MS`)
- `UPSTREAM_REQUEST_TIMEOUT_MS` (default: `180000`)
- `PROXY_AUTH_TOKEN` (required unless `PROXY_ALLOW_UNAUTHENTICATED=true`)
- `PROXY_ALLOW_UNAUTHENTICATED` (default: `false`; use `true` only for local debugging)

## `keys.json` Format

```json
{
  "providers": {
    "vivgrid": [
      "vivgrid-key-1",
      "vivgrid-key-2"
    ],
    "ollama-cloud": [
      "ollama-key-1",
      "ollama-key-2"
    ],
    "openai": {
      "auth": "oauth_bearer",
      "accounts": [
        "oauth-access-token-1",
        "oauth-access-token-2"
      ]
    }
  }
}
```

`id` fields are optional. When omitted, the proxy auto-generates stable internal UUID account IDs per token.

Backward compatibility is preserved for legacy single-provider formats:

- `{"keys": ["legacy-key-1", "legacy-key-2"]}`
- `["legacy-key-1", "legacy-key-2"]`

Those legacy formats map to `UPSTREAM_PROVIDER_ID`.

## OpenAI OAuth Routing Through Chat-Completions

Route requests to OpenAI by prefixing model names:

- `"model": "openai/gpt-5"`
- `"model": "openai:gpt-5"`

The prefix is stripped before upstream dispatch, and accounts are selected from `keys.json.providers[OPENAI_PROVIDER_ID]`.

## Ollama `num_ctx` Control Through OpenAI API

When you send requests through `POST /v1/chat/completions`, route to Ollama by prefixing the model:

- `"model": "ollama/llama3.2"`
- `"model": "ollama:llama3.2"`

Then set `num_ctx` through your OpenAI-style payload using either of these fields:

- `open_hax.ollama.num_ctx` (recommended)
- `num_ctx` (top-level alias)

Example:

```json
{
  "model": "ollama/llama3.2",
  "messages": [
    {
      "role": "user",
      "content": "Summarize this repository."
    }
  ],
  "open_hax": {
    "ollama": {
      "num_ctx": 32768
    }
  }
}
```

## Side-by-Side Rollout

- Keep VivGrid proxy on `8787` and run this proxy on `8789` for parallel validation.
- Reuse the same keys/models files initially, then split once traffic migrates.
- Compare status codes, SSE behavior, and tool-call payloads before cutover.

## Example Request

```bash
curl --request POST \
  --url http://127.0.0.1:8789/v1/chat/completions \
  --header 'Content-Type: application/json' \
  --data '{
    "model": "gemini-3.1-pro-preview",
    "messages": [
      {
        "role": "user",
        "content": "Say hello in English, Chinese and Japanese."
      }
    ],
    "stream": true
  }'
```
