# mcp-fs-oauth

An MCP (Model Context Protocol) **Streamable HTTP** server that exposes a small file API
(backed by **local filesystem** and/or a **GitHub repo**) and protects `/mcp` with **OAuth 2.1**.

This project runs an **embedded OAuth Authorization Server** (AS) + **Resource Server** (RS)
using the official TypeScript SDK.

## Features

- OAuth 2.1 (PKCE) with **dynamic client registration** (required by ChatGPT for MCP OAuth)
- Login provider options:
  - `password` (simple single-user gate)
  - `github` (OAuth App)
  - `google` (OIDC)
- Storage backends:
  - `local` (read/write within `LOCAL_ROOT`)
  - `github` (read/write via GitHub Contents API)
  - `auto` (try local first; fallback to github)

## Endpoints

- MCP: `POST/GET/DELETE /mcp`
- OAuth + metadata (installed at app root by the SDK):
  - `/.well-known/oauth-authorization-server`
  - `/.well-known/oauth-protected-resource/mcp`
  - `/authorize`
  - `/token`
  - `/register`
  - `/revoke` (if enabled)

## Quick start

```bash
cp .env.example .env
# edit .env
npm i
npm run dev
```

## Connecting from ChatGPT

In ChatGPT, add an MCP server with:
- Server URL: `https://your-domain.example/mcp`

ChatGPT will discover the protected resource metadata and complete the OAuth flow.

## Tools exposed

- `fs_list`
- `fs_read`
- `fs_write`
- `fs_delete`

Each tool accepts an optional `backend` override: `auto | local | github`.

## Exec allowlist patterns

`exec_run` now enforces glob-style allowlist patterns (similar to OpenCode permissions),
for example `"git *"` or `"pnpm test *"`.

- Set `MCP_EXEC_CONFIG` to a JSON file.
- Each command may define `allowPatterns` and `denyPatterns`.
- You can also define global `allowPatterns` / `denyPatterns` at config root.
- If `allowExtraArgs=true`, at least one allow pattern must be present.

Example:

```json
{
  "allowPatterns": ["git *"],
  "commands": [
    {
      "id": "git-status",
      "description": "Run git status",
      "command": "git",
      "args": ["status"],
      "allowExtraArgs": true,
      "allowPatterns": ["git status *"],
      "denyPatterns": ["*--force*", "*reset --hard*"]
    }
  ]
}
```

## Notes

- For GitHub storage write/delete, you need a token with repo content permissions.
- For public deployments, prefer `github` or `google` login with allowlists, or a strong password.
