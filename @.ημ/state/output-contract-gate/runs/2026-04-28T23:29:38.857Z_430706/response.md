## Signal

(己, p=0.86) Implemented **Mimo v2** support in `@orgs/open-hax/proxx` + `@services/proxx`:
- (己, p=0.9) `mimo` base URL support in config (`XAIOMI_MIMO_API_BASE_URL` / `MIMO_BASE_URL` fallback).
- (己, p=0.9) `XAIOMI_MIMO_API_KEY` now loads into the key pool as provider id `mimo` (override via `MIMO_PROVIDER_ID`).
- (己, p=0.85) `mimo` is treated as OpenAI-compatible for routing/strategy selection.

(己, p=0.9) Updated **models.dev pricing** to use the live API instead of the stale embedded snapshot:
- (己, p=0.9) Added `src/lib/models-dev.ts` that opportunistically refreshes from `https://models.dev/api.json` with TTL+timeout env controls, and falls back to the embedded snapshot if refresh fails.
- (己, p=0.9) Refactored `src/lib/model-pricing.ts` to rebuild its indices when the models.dev snapshot changes (so it actually benefits from the live refresh).

(己, p=0.82) Added a **models.dev pre-fallback routing layer** (before the blind fallback list):
- (己, p=0.85) New `prependModelsDevProviderRoutesForModel(...)` in `src/lib/provider-routing.ts`:
  - looks up candidate providers for the model via models.dev,
  - filters to providers where we actually have credentials in the key pool,
  - prepends those routes ahead of the configured route list.
- (己, p=0.84) Wired this into `/v1/chat/completions`, `/v1/responses`, and `/v1/images/generations`.

(己, p=0.8) Added a **provider-facing interface hook** for models.dev in the credentials UI:
- (己, p=0.85) New API route: `GET /api/v1/credentials/providers/models-dev` returning models.dev provider descriptors (+ `hasCredentials`).
- (己, p=0.85) Credentials UI “Add API key account” provider dropdown now merges built-ins with models.dev providers instead of hardcoding the full list.

(己, p=0.9) Commits:
- (己, p=0.9) `orgs/open-hax/proxx`: `b53af48` “proxx: add mimo v2 + models.dev live pricing + discovery routing”
- (己, p=0.9) workspace root: `d762d1a8` “services/proxx: document mimo env + bump proxx submodule”

(己, p=0.62) Priority #4 (“factor out upstream/fallback strategies”) is **partially addressed** by introducing the models.dev discovery layer and reducing “blind list first” behavior, but the deeper naming/structural refactor of the upstream/fallback architecture is not fully completed yet.

## Evidence

(己, p=0.9) Code changes (proxx submodule):
- `orgs/open-hax/proxx/src/lib/models-dev.ts` (new): live refresh from models.dev API + provider descriptors.
- `orgs/open-hax/proxx/src/lib/model-pricing.ts`: indices rebuild when snapshot changes; no longer locked to embedded data.
- `orgs/open-hax/proxx/src/lib/provider-routing.ts`: `prependModelsDevProviderRoutesForModel` + `mimo` compatibility.
- `orgs/open-hax/proxx/src/lib/key-pool.ts`: reads `XAIOMI_MIMO_API_KEY` / `MIMO_API_KEY`.
- `orgs/open-hax/proxx/src/lib/config.ts`: `mimo` default base URL and mapping.
- `orgs/open-hax/proxx/src/routes/{chat,responses,images}.ts`: models.dev discovery inserted before downstream filters.
- `orgs/open-hax/proxx/src/routes/credentials/models-dev-providers-ui.ts` (new) + `.../credentials/ui.ts` registration.
- `orgs/open-hax/proxx/web/src/lib/api.ts` + `web/src/pages/CredentialsPage.tsx`: dropdown now pulls from `/api/v1/credentials/providers/models-dev`.

(己, p=0.9) Service-side docs:
- `services/proxx/.env.example`: documented `XAIOMI_MIMO_API_*` + `MIMO_PROVIDER_ID`.

(己, p=0.85) Verification:
- (己, p=0.85) Ran `pnpm -C orgs/open-hax/proxx exec tsc -p tsconfig.json --noEmit` successfully after fixing a TS indexing error.

## Frames

(世, p=0.64) This makes models.dev the **default “API-key provider discovery substrate”**: proxx can now learn provider base URLs and model availability without manual provider additions (as long as the provider speaks an OpenAI-ish surface).

(世, p=0.6) This shifts “fallback” from “try a static list” toward “try plausible providers for this model that we have keys for,” which should reduce pointless 404/400 churn and improve latency.

(世, p=0.55) The remaining architectural debt is that proxx still *names* and *configures* things as “upstream + fallback,” even though routing is now more like “policy-ordered candidate sources (models.dev discovery, configured routes, dynamic ollama, federation, etc.).”

## Countermoves

(己, p=0.78) Guardrail: models.dev discovery is gated by **credentials existence** (`keyPool.getRequestOrder(providerId)`), so it won’t explode the route list with providers you can’t use anyway.

(己, p=0.72) Safety: pricing/live metadata refresh is **best-effort** with TTL+timeout and clean fallback to embedded snapshot if models.dev is unreachable.

(己, p=0.7) Risk check: many models.dev providers may not be truly OpenAI-compatible; the strategy will still attempt them if you have creds. If this becomes noisy, we should add a “compatibility allowlist” or a lightweight probe cache keyed by providerId.

## Next

(己, p=0.85) Run a quick smoke-check against a running proxx: `curl -sS http://127.0.0.1:8789/api/v1/credentials/providers/models-dev | jq '.providers[0:5]'` to confirm the UI feed is populated and the server can reach models.dev.