# Pi/Open Hax: OpenAI OAuth image generation

## Context
Pi wants `/v1/images/generations` to work through the Open Hax proxy using **OpenAI OAuth-backed accounts** (no API keys).

Current behavior (observed): OAuth access tokens obtained via the bundled ChatGPT/Codex CLI public client id return "Missing scopes" when calling the official OpenAI Platform endpoints:
- `GET https://api.openai.com/v1/models` → missing `api.model.read`
- `POST https://api.openai.com/v1/images/generations` → missing `api.model.images.request`
- `POST https://api.openai.com/v1/responses` → missing `api.responses.write`

ChatGPT backend endpoints for image generation (`https://chatgpt.com/backend-api/...`) are unreliable for server-side proxying (403/Cloudflare, tool type unsupported in `/backend-api/codex/responses`).

## Goal
- Make image generation succeed via OAuth-backed accounts by obtaining tokens with the necessary **OpenAI Platform API scopes**, and routing image requests to `https://api.openai.com/v1/images/generations`.

Secondary goal (pragmatic, subscription-compatible):
- When Platform scopes are missing (common for ChatGPT/Codex OAuth public clients), allow image generation to fall back to **ChatGPT/Codex backend** image endpoints under `https://chatgpt.com/backend-api/...`.

## Non-goals
- Bypassing Cloudflare/browser checks for ChatGPT backend APIs.
- Supporting image generation via non-OpenAI providers (unless explicitly requested).

## Open questions
1. Which OAuth client is being used for login?
   - If it is the bundled ChatGPT/Codex client id, can it legally/technically request Platform API scopes?
   - If not, the user needs to supply their own OpenAI Platform OAuth app client id.
2. Minimum required Platform scopes for the desired behavior:
   - Likely `api.model.images.request`.
   - Potentially also `api.model.read` and/or `api.responses.write` depending on ancillary proxy routes.

## Risks
- (High) The bundled ChatGPT OAuth client may never receive Platform API scopes even if requested.
- (Medium) OAuth token refresh will not add scopes; re-auth is required.
- (Low) Divergence between `services/open-hax-openai-proxy` and `orgs/open-hax/proxx` mirrors.

## Priority
P1 (blocks images)

## Implementation phases

### Phase 1 (done): Improve proxy routing + diagnostics
- Route OpenAI image generation to `OPENAI_API_BASE_URL` (default `https://api.openai.com`) instead of ChatGPT backend.
- Allow configuring requested OpenAI OAuth scopes (`OPENAI_OAUTH_SCOPES`).
- Preserve upstream 401/403 auth errors through fallback so clients see "Missing scopes" clearly.

### Phase 2 (done): Make OAuth client configurable
- Add config to override OAuth client + issuer:
  - `OPENAI_OAUTH_CLIENT_ID`
  - `OPENAI_OAUTH_ISSUER` (default `https://auth.openai.com`)
- Wire through to OpenAI OAuth manager (browser + device flows).

### Phase 3 (next): End-to-end verification
- With `OPENAI_OAUTH_CLIENT_ID` pointing to a Platform OAuth app and `OPENAI_OAUTH_SCOPES` including platform scopes:
  1. Re-auth via the proxy UI.
  2. Confirm stored access token contains the expected scopes.
  3. Call `POST /v1/images/generations` through proxy and validate success.

### Phase 4 (next): Support Codex/ChatGPT backend image generation (subscription surface)
- Add `OPENAI_IMAGES_UPSTREAM_MODE` config:
  - `platform`: always use `OPENAI_API_BASE_URL` (api.openai.com)
  - `chatgpt`: always use `OPENAI_BASE_URL` (chatgpt.com/backend-api) with `OPENAI_IMAGES_GENERATIONS_PATHS`
  - `auto` (default): try platform first, then fall back to chatgpt on 401/403/404.
- Add a regression test that verifies the fallback order.

## Affected files
- `services/open-hax-openai-proxy/src/lib/openai-oauth.ts`
- `services/open-hax-openai-proxy/src/lib/config.ts`
- `services/open-hax-openai-proxy/src/app.ts`
- `services/open-hax-openai-proxy/src/lib/ui-routes.ts`
- `services/open-hax-openai-proxy/src/lib/provider-strategy.ts`
- `services/open-hax-openai-proxy/src/tests/{proxy,factory-strategy}.test.ts`

Mirrors:
- `orgs/open-hax/proxx/src/lib/openai-oauth.ts`
- `orgs/open-hax/proxx/src/lib/config.ts`
- `orgs/open-hax/proxx/src/app.ts`
- `orgs/open-hax/proxx/src/lib/ui-routes.ts`
- `orgs/open-hax/proxx/src/lib/provider-strategy.ts`
- `orgs/open-hax/proxx/src/tests/{proxy,factory-strategy}.test.ts`

## Definition of done
- A user can authenticate via OAuth, then successfully call `POST /v1/images/generations` through the proxy without API keys.
- On failure due to scope/auth issues, the proxy returns a clear 401/403 error message including the upstream reason.
