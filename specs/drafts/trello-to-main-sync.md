# Draft Spec: Trello → main sync (Trello as truth) + webhook relay deployment

## Mission
Make the Trello board the **projection of truth** for owners (fast direct edits) while keeping the Git repo (`open-hax/ussyverse-kanban`) as an auditable mirror and still accepting PR-based board state proposals.

## Requirements (from operator)
- Owners can edit Trello directly; changes propagate to `main` without PR gating.
- Anyone can submit board changes via PR; accepted PRs update Trello immediately.
- Propagation from Trello should be low-latency (seconds), not polling-only.

## Architecture
1. **Webhook relay (Render)**
   - Receives Trello webhooks.
   - Verifies `X-Trello-Webhook` signature (HMAC-SHA1 base64) using Trello app secret.
   - Triggers GitHub `repository_dispatch` event for `open-hax/ussyverse-kanban`.

2. **GitHub Action (ussyverse-kanban)**
   - Trigger: `repository_dispatch` and optional schedule fallback.
   - Runs `scripts/trello-pull.mjs` to mirror Trello cards → `tasks/**`.
   - Commits and pushes to `main` (requires branch protection bypass for Actions/bot).

3. **Existing flow retained**
   - PR → main → Trello stays in place (already implemented).

## Data mapping
- Trello list name → `status` (inverse of `trello.listMapping`, fallback slugify)
- Trello labels include priority labels `P0..P3`
- UUID extracted from card description line `Kanban UUID:`; fallback to Trello card id

## Deployment
- Render Blueprint (`render.yaml`) for the webhook relay service.
- Service env vars (all secrets `sync: false`):
  - `TRELLO_API_KEY`, `TRELLO_API_TOKEN`
  - `TRELLO_BOARD_SHORTLINK` (e.g. `Mu2BmeDE`) or board URL
  - `TRELLO_APP_SECRET` (Power-Up secret) for signature verification
  - `WEBHOOK_CALLBACK_URL` (public https URL to this service endpoint)
  - `GITHUB_TOKEN`, `GITHUB_REPO` (e.g. `open-hax/ussyverse-kanban`)

## Open questions
- What bot identity should push to main? (default: GitHub Actions token)
- Do we want to auto-create Trello webhooks on startup or manage them manually?

## Definition of done
- Editing Trello triggers webhook relay and results in a commit on `main` that updates `tasks/**`.
- A PR merged to `main` updates Trello as before.
- End-to-end verification documented with curl + browser checks.
