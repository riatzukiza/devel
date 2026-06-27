---
title: "Repo layout"
status: incoming
source_note: "services/mcp-fs-oauth/docs/notes/infrastructure/mcp-fs-http-oauth.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Repo layout

## Context
- Source note: `services/mcp-fs-oauth/docs/notes/infrastructure/mcp-fs-http-oauth.md`
- Category: `infrastructure`

## Draft Requirements
- `package.json`
- `tsconfig.json`
- `.env.example`
- `src/index.ts`
- Jail any user-supplied path to FS_ROOT to prevent traversal.
- Load OAuth AS metadata.
- - Prefer explicit JSON in OAUTH_METADATA_JSON
- - Else fetch RFC8414 from {issuer}/.well-known/oauth-authorization-server
- - Else fall back to OIDC discovery {issuer}/.well-known/openid-configuration
- OAuth token introspection verifier.
- Returns MCP AuthInfo shape (token, clientId, scopes, expiresAt, resource?, extra?).
- **Streamable HTTP transport** via `StreamableHTTPServerTransport`, with `handleRequest()` handling HTTP requests. ([jsDelivr][1])

## Summary Snippets
- Below is a **minimal remote MCP filesystem server** (TypeScript + Express) that speaks **Streamable HTTP** and is wired for **OAuth-protected resource discovery** (so a client like ChatGPT can learn where to authenticate from a `401` + `WWW-Authenticate` header). It uses the official TS MCP SDK’s Streamable HTTP transport and auth helpers. ([jsDelivr][1])
- > Notes > > * This is **Resource Server (RS) only**: it **validates access tokens** (via OAuth token introspection) and **advertises OAuth metadata** to clients. That’s the clean RS/AS split the MCP auth flow is designed around. ([jsDelivr][2]) > * The MCP endpoint is `/mcp` and uses **StreamableHTTPServerTransport**. ([jsDelivr][1]) > * `requireBearerAuth` injects `req.auth` (token info) and can include the **Protected Resource Metadata URL** in `WWW-Authenticate` for `401`s. ([jsDelivr][3])

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
