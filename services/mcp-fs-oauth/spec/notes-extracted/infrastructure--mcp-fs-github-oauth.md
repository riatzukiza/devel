---
title: "`.env.example` (GitHub)"
status: incoming
source_note: "services/mcp-fs-oauth/docs/notes/infrastructure/mcp-fs-github-oauth.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# `.env.example` (GitHub)

## Context
- Source note: `services/mcp-fs-oauth/docs/notes/infrastructure/mcp-fs-github-oauth.md`
- Category: `infrastructure`

## Draft Requirements
- GitHub doesn’t provide an RFC7662 `/introspect` endpoint, but it *does* provide a **“Check a token”** endpoint you can call with **Basic auth (client_id:client_secret)**:
- Jail any user-supplied path to FS_ROOT to prevent traversal.
- GitHub "Check a token" verifier:
- POST https://api.github.com/applications/{client_id}/token
- Basic auth: client_id:client_secret
- Body: {"access_token": "<token>"}
- Valid tokens return 200 with scopes, user, expires_at, etc.
- Invalid tokens return 404. :contentReference[oaicite:5]{index=5}
- `POST https://github.com/login/device/code`
- user enters code at `https://github.com/login/device`
- poll `POST https://github.com/login/oauth/access_token` until you get an access token ([GitHub Docs][3])

## Summary Snippets
- Cool — if your OAuth provider is GitHub, the main change is **token verification**:
- * GitHub doesn’t provide an RFC7662 `/introspect` endpoint, but it *does* provide a **“Check a token”** endpoint you can call with **Basic auth (client_id:client_secret)**: `POST https://api.github.com/applications/{client_id}/token` with JSON `{ "access_token": "..." }`. ([GitHub Docs][1])

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
