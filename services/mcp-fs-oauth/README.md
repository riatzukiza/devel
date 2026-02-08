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

## Notes

- For GitHub storage write/delete, you need a token with repo content permissions.
- For public deployments, prefer `github` or `google` login with allowlists, or a strong password.
