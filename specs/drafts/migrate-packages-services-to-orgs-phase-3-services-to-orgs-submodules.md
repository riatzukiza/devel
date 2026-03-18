# Draft Spec (Phase 3): Migrate services/* → orgs/<org>/* as submodules + leave symlinks

## Mission
Promote selected `services/*` modules into canonical submodules under:

`orgs/<org>/<repo>`

…while keeping `services/<name>` as a symlink compatibility path.

This phase also handles the special case where some services are **already submodules located under `services/`** today.

## Context / Current State
- `services/` includes multiple Node services, MCP servers, and other runtime processes.
- `.gitmodules` already contains submodules in `services/` (e.g. openai proxy variants).
- pnpm workspace includes `services/*`.

## Goals
1. For each service in the Phase 0 mapping:
   - create/confirm upstream repo under chosen org
   - ensure the repo is present as a submodule at `orgs/<org>/<repo>`
   - replace `services/<name>` with a symlink to the canonical location
2. For services already tracked as submodules under `services/<name>`:
   - relocate the submodule path to `orgs/<org>/<repo>`
   - ensure `services/<name>` becomes a symlink
3. Keep runtime + dev workflows working (docker compose, pm2 configs, scripts).

## Non-goals
- Major architecture changes.
- Rewriting deployment topology.

## Special Case: moving an existing submodule
If `services/<name>` is already a git submodule:
1. Move the submodule path to `orgs/<org>/<repo>` (update `.gitmodules`).
2. Ensure the gitlink is updated.
3. Create the symlink at the original `services/<name>` location.

## Open Questions
1. Do we want to preserve the *service directory names* as the symlink name even if the upstream repo name differs?
   - Decision: **yes**. Example: keep `services/open-hax-openai-proxy` as the stable compat path, even though the upstream repo is `open-hax/proxx` and the canonical checkout becomes `orgs/open-hax/proxx`.
2. Which runtime references should become canonical?
   - keep referring to `services/<name>` (compat path)
   - or update scripts to refer to `orgs/<org>/<repo>` explicitly
   - Recommendation: keep referencing `services/<name>` for ergonomics; treat it as stable.
3. Are there any services that must remain monorepo-local (never upstreamed)?

## Risks
- Compose/PM2 paths: these often hardcode relative paths into `services/`.
  - Mitigation: keep `services/<name>` stable as a symlink.
- Submodules + runtime tooling: some tools dislike symlinked working dirs.
  - Mitigation: ensure canonical dir is a real checkout under `orgs/`.

## Implementation Phases (within Phase 3)
### Phase 3.1 — Pilot service migration
- Choose one low-risk service.
- Validate: dev run, build, tests, docker/pm2 interactions.

### Phase 3.2 — Convert existing service-submodules
- Relocate any `services/*` submodules into `orgs/*/*`.
- Add symlink compatibility.

### Phase 3.3 — Bulk migrate remaining services
- Upstream creation + add as submodules + symlink.
- Validate after each move.

## Affected Files
- `.gitmodules`
- `services/*` (replace dirs/submodules with symlinks)
- `orgs/<org>/*` (new submodule directories)
- `docs/migrations/packages-services-to-orgs/links.yaml`
- `docker-compose*.yml`, `ecosystem*.edn`, `system/**`, `scripts/**` (as needed for path stability)

## Verification
Per migrated service:
- `pnpm --filter <service> build` (if applicable)
- smoke run command (service-specific; document per module in migration map)

End of phase:
- `pnpm -w build` (or Nx affected build)
- `pnpm -w test` (or Nx affected test)
- Optional: fresh clone with `--recurse-submodules` + `pnpm install`.

## Definition of Done
- All services selected for promotion are present under `orgs/<org>/...` as submodules.
- `services/<name>` remains a stable path via symlink.
- Dev/runtime workflows that previously used `services/<name>` still work.
