# Battlebussy live reconciliation inventory — 2026-03-23

## Objective
Record what was actually found on the live `ussy` production Battlebussy runtime and pin that state into git so future staged deploy work can start from reality instead of folklore.

## Live runtime source of truth observed
Host: `error@ussy.promethean.rest`

Runtime paths observed from Docker labels:
- project working dir: `/home/error/devel/orgs/ussyverse/battlebussy/deploy`
- compose file: `/home/error/devel/orgs/ussyverse/battlebussy/deploy/docker-compose.prod.yml`
- env file: `/home/error/devel/orgs/ussyverse/battlebussy/.env.production`

Important defect:
- the deployed tree is not a valid git checkout
- `/home/error/devel/orgs/ussyverse/battlebussy/.git` points to `../../../.git/modules/orgs/ussyverse/battlebussy`
- that path is missing on-host, so `git fetch` / `git status` fail there

## Live snapshot branch created
Pushed branch:
- `origin/reconcile/live-ussy-prod-20260323`

Commit:
- `d2dba42` — `reconcile: snapshot ussy production runtime`

Method:
1. rsynced live tree from `ussy` into `/tmp/battlebussy-live-snapshot`
2. excluded runtime-only artifacts:
   - `.git`
   - `.env.production`
   - `.env.production.bak.*`
   - `commentary_audio/`
   - `commentary_traces/`
   - `.next/`
   - `node_modules/`
   - `.ημ/`
3. applied that snapshot onto a clean worktree based on `e2f243a`
4. verified rsync dry-run produced no remaining differences against the captured live snapshot

## Comparison summary
### Compared to current dirty local tree
- tracked files examined: `291`
- exact match with live: `234`
- same path but content differs: `24`
- present locally but absent on live: `33`

#### Differing files
- `.github/workflows/ci.yml`
- `AGENTS.md`
- `agent/agent.py`
- `agent/config.py`
- `internal/cli/server.go`
- `internal/httpbridge/service_active_match_test.go`
- `internal/httpbridge/studio.go`
- `internal/orchestrator/config.go`
- `internal/orchestrator/manager.go`
- `internal/orchestrator/runtime_profile.go`
- `internal/orchestrator/runtime_profile_test.go`
- `internal/orchestrator/state.go`
- `internal/orchestrator/types.go`
- `internal/scenario/validator.go`
- `internal/scenario/validator_test.go`
- `internal/scoring/processor.go`
- `internal/scoring/processor_test.go`
- `internal/scoring/rules.go`
- `internal/scoring/service.go`
- `internal/transport/types.go`
- `internal/transport/validate.go`
- `schemas/events/MATCH_LIFECYCLE.schema.json`
- `schemas/scenario.schema.json`
- `scripts/run-live-broadcast-loop.sh`

#### Present locally but not live
- `.github/workflows/deploy-main.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/pr-main.yml`
- `.github/workflows/pr-staging.yml`
- `.opencode/skill/pr-promotion-workflows/SKILL.md`
- `.opencode/skill/promethean-rest-dns/SKILL.md`
- `bundles/sqli-auth-bypass.yml`
- `docs/upstream-deploy-owner-note.md`
- `internal/httpbridge/dataset_test.go`
- `internal/httpbridge/service_broadcast_test.go`
- `internal/orchestrator/builder.go`
- `internal/orchestrator/builder_test.go`
- `internal/scenario/bundle.go`
- `internal/scoring/service_test.go`
- `scenarios/builder-v0-sqli-auth/scenario.yml`
- `scenarios/builder-v0-sqli-auth/scoring-rules.yml`
- `schemas/events/BUILDER_COMPLETE.schema.json`
- `schemas/events/BUILDER_FALLBACK.schema.json`
- `schemas/events/BUILDER_GENERATE.schema.json`
- `schemas/events/BUILDER_START.schema.json`
- `schemas/events/BUILDER_VALIDATE_FAILURE.schema.json`
- `schemas/events/BUILDER_VALIDATE_SUCCESS.schema.json`
- `schemas/events/VULNERABILITY_CHAIN.schema.json`
- `scripts/deploy-source.sh`
- `specs/drafts/arena-overflow-lowres.md`
- `specs/drafts/builder-v0-bootstrap.md`
- `specs/drafts/cloudflare-cert-regression.md`
- `specs/drafts/dataset-inspector-admin.md`
- `specs/drafts/full-site-deploy.md`
- `specs/drafts/pr-promotion-workflows.md`
- `specs/drafts/voxx-edge-routing.md`
- `specs/drafts/voxx-melo-tailscale-cutover.md`
- `specs/drafts/voxx-source-melo-trial.md`

### Compared to clean `origin/ci/pr-promotion-workflows`
- exact match with live: `227`
- differs: `31`
- absent on live: `33`

### Compared to clean `origin/main`
- exact match with live: `211`
- differs: `38`
- absent on live: `13`

## Interpretation
The deployed instance is closest to the current locally hacked branch state, but it still is not identical to any committed branch.

Practical meaning:
- there is now a committed branch that mirrors what is actually deployed
- promotion-flow work should proceed from that reality, not from stale `main`
- the next hard requirement is to restore a real remote git-capable checkout so `staging` and `main` push deploys can work at all

## Runtime-home bootstrap progress
New canonical runtime homes have now been bootstrapped:

### Production (`ussy`)
- path: `~/devel/services/battlebussy`
- source synced from the live snapshot branch
- existing `.env.production` copied from the hacked legacy runtime tree
- runner-side rsync deploy was manually tested against this path
- public verification after deploy still passed:
  - `https://battlebussy.ussy.promethean.rest/api/game/status`
  - `https://battlebussy.ussy.promethean.rest/arena`

### Staging (`ussy3`)
- path: `~/devel/services/battlebussy-staging`
- source synced from the live snapshot branch
- `.env.production` temporarily bootstrapped from production for convergence/testing
- required external Docker networks were created:
  - `battlebussy-scoring`
  - `voxx_default`
- first deploy attempt failed because `ussy3` could not pull private GHCR Battlebussy images
- current workaround used for bootstrap:
  - streamed the already-running Battlebussy images from `ussy` to `ussy3` with `docker save | docker load`
- runner-side rsync deploy was then manually tested successfully against this path
- host-local verification passed:
  - `http://127.0.0.1:8080/api/game/status`
  - `http://127.0.0.1:3000/`

### Immediate staging caveat
The staging runtime now works, but fresh-image recovery on `ussy3` still needs one of these made canonical:
- GHCR auth on the staging host, or
- a source-build staging compose/deploy path, or
- CI-side image push/promotion before deploy

## Promotion bootstrap progress
A new bootstrap branch was created from the live snapshot baseline to reintroduce staged promotion assets without depending on remote host git access:

- branch: `ci/live-reconcile-staging-bootstrap`

Added on that branch:
- `scripts/deploy-source.sh`
- `scripts/deploy-remote.sh`
- `.github/workflows/pr-staging.yml`
- `.github/workflows/pr-main.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-main.yml`
- `docs/upstream-deploy-owner-note.md`

These new deploy workflows use **runner-side rsync** to the runtime homes instead of `git fetch` on-host, which matches the Promethean direction proven by Proxx and avoids the broken remote git metadata problem.

## Promotion progress achieved
The staged flow has now been exercised end-to-end:

- live snapshot reference PR: `riatzukiza/battlebussy#3`
- staged bootstrap PR to `staging`: `riatzukiza/battlebussy#4` — merged
- frontend lint/purity unblocker PR to `staging`: `riatzukiza/battlebussy#5` — merged
- graph/ancestry repair for `staging -> main` convergence was applied to `staging`
- Docker integration tag/alias parity PR to `staging`: `riatzukiza/battlebussy#8` — merged
- promotion PR `staging -> main`: `riatzukiza/battlebussy#6` — merged

Successful GitHub runs observed:
- `Deploy staging` on `staging`
- `Post-merge smoke` on `staging`
- `PR to main / promotion-guard`
- `PR to main / full-suite`
- `Deploy production` on `main`
- `Post-merge smoke` on `main`

Post-production verification succeeded publicly:
- `https://battlebussy.ussy.promethean.rest/api/game/status`
- `https://battlebussy.ussy.promethean.rest/arena`

## Post-adoption regression work
A live runtime regression was then observed on production:

- match creation failed with `invalid pool request: Pool overlaps with other one on this address space`

Operational findings:
- the production host had `63` leaked `battlebussy-match-*` Docker networks
- those stale networks were still holding `10.100.X.0/24` pools and relay endpoints
- all `63` orphaned relay-only match networks were detached and removed safely
- after cleanup, Battlebussy resumed creating live matches successfully

Durable code fix:
- PR `riatzukiza/battlebussy#9` — `fix: avoid reusing occupied match subnets` — merged into `staging`
- allocator now inspects existing Docker networks before choosing the next `10.100.X.0/24` pool
- targeted allocator/unit tests passed locally before push

## Recommended next step
After `#9` bakes through staging and main, package the whole Battlebussy adoption sequence into a reusable template and roll it out to the remaining long-lived ussy-hosted services.
