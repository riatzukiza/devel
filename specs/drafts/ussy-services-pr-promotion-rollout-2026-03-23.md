# ussy fleet PR-promotion rollout — 2026-03-23

## Goal
Adopt the Proxx-style delivery contract across deployed services on the four Promethean ussy hosts:

- feature branch -> PR into `staging`
- push to `staging` deploys staging and runs live verification
- PR from `staging` into `main`
- push to `main` deploys production and verifies production

This should become the default deployment model for long-lived Promethean services rather than one-off SSH deploys.

## Why now
The Proxx pilot is complete enough to count as proof:

- the staged deploy workflows exist and execute
- the staging deploy path actually runs live verification
- the gate failed on a real staging runtime/provider problem instead of a fake CI-only issue
- that means the pipeline shape is valid even when service-specific runtime debt remains

Conclusion: the pattern works and is ready to be rolled out beyond Proxx.

## Scope
Near-term first adopter after Proxx: `orgs/ussyverse/battlebussy`

Longer-term target set: all durable public services currently deployed across:

- `ussy.promethean.rest`
- `ussy2.promethean.rest`
- `ussy3.promethean.rest`
- `big.ussy.promethean.rest`

## Battlebussy findings
### What already exists
A draft/promotional branch already exists locally/remotely for Battlebussy:

- branch: `ci/pr-promotion-workflows`

That branch contains staged workflow files and an operator note:

- `.github/workflows/pr-staging.yml`
- `.github/workflows/pr-main.yml`
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-main.yml`
- `docs/upstream-deploy-owner-note.md`
- `scripts/deploy-source.sh`

### What blocks a safe flip today
Battlebussy is not in the same clean state as Proxx yet.

Observed on the live production host:

- live compose working dir: `/home/error/devel/orgs/ussyverse/battlebussy/deploy`
- live environment file: `/home/error/devel/orgs/ussyverse/battlebussy/.env.production`
- live runtime is using a `deploy/docker-compose.prod.yml` that includes newer features such as:
  - `studio-runner`
  - `battlebussy-site`
  - `COMMENTARY_GLM_PROXY_BASE_URL`
  - `BATTLEBUSSY_ATTACH_CONTROL_PLANE_RELAYS`
- the deployed tree is **not a functional git checkout** right now; `.git` points at a missing submodule metadata path, so `git fetch` fails on-host

But repository state is split:

- `origin/main` is older and does **not** contain the staged workflows
- `origin/ci/pr-promotion-workflows` contains an earlier workflow draft, but it still does **not** match the newer live production compose/runtime state
- the local working branch in `~/devel/orgs/ussyverse/battlebussy` has uncommitted changes newer than both committed branches

### Reconciliation progress
A committed live snapshot branch now exists:

- `origin/reconcile/live-ussy-prod-20260323`
- commit: `d2dba42` (`reconcile: snapshot ussy production runtime`)

That branch was produced by rsyncing the current live production tree on `ussy` back into a clean worktree based on `e2f243a` and verifying the resulting tree exactly matched the deployed source snapshot (excluding runtime-only artifacts like `.env.production`, `commentary_audio/`, `commentary_traces/`, `.next/`, and `.git`).

High-level comparison against local state:

- versus current dirty local tree: `234` tracked files matched live exactly, `24` differed, `33` were present locally but absent on live
- versus clean `origin/ci/pr-promotion-workflows`: `227` matched, `31` differed, `33` were absent on live
- versus clean `origin/main`: `211` matched, `38` differed, `13` were absent on live

This confirms the live deploy is closest to the current local hacked-together branch state, but still diverges from every committed baseline.

### Implication
If Battlebussy were switched to a Proxx-style `push-to-main` production deploy **right now** against `origin/main`, production would risk regressing to an older code/runtime state.

So Battlebussy cannot safely skip straight to “enable staged auto-promotion.”

It first needs live-state convergence plus a real remote git-capable runtime checkout for staging and production.

## Standard rollout protocol for each service
For every deployed service, use this order:

1. **Inventory live reality**
   - runtime path
   - compose files / service manager
   - public hostnames
   - secrets / env contract
   - current live commit or equivalent source snapshot

2. **Canonicalize live state into git**
   - make sure the repo branch intended to become `staging` actually reflects current live behavior
   - avoid enabling auto-production deploys from stale `main`

3. **Add the promotion contract**
   - `PR -> staging` lightweight gate
   - `push staging` deploy + live verify
   - `PR staging -> main` heavy gate
   - `push main` deploy + prod verify

4. **Configure GitHub follow-through**
   - environments
   - secrets
   - vars
   - branch protection
   - required status checks

5. **Verify on real infra**
   - staging deploy succeeds
   - staging live checks are honest
   - production deploy preserves current live behavior

## Phase plan
### Phase 1 — Battlebussy convergence
Goal: make Battlebussy safe for staged promotion.

Deliverables:

- identify the canonical branch point for current live Battlebussy
- capture the live-only runtime diffs into committed repo state
- extract/refresh the staged workflow files from `ci/pr-promotion-workflows`
- update them to match current live runtime paths/hosts/secrets
- create long-lived `staging` branch only after it reflects current live behavior

### Phase 2 — Battlebussy staged deploy adoption
After convergence:

- enable `PR -> staging`
- enable `push staging` deploy + live verify
- open `staging -> main` promotion PR
- enable production deploy only once `main` is aligned with safe deploy intent

Progress now achieved:
- live snapshot reference PR: `riatzukiza/battlebussy#3`
- staged-flow bootstrap PR into `staging`: `riatzukiza/battlebussy#4` — merged
- frontend main-gate unblocker PR into `staging`: `riatzukiza/battlebussy#5` — merged
- Docker integration tag/alias parity PR into `staging`: `riatzukiza/battlebussy#8` — merged
- `staging -> main` promotion PR: `riatzukiza/battlebussy#6` — merged
- canonical runtime homes created:
  - prod: `error@ussy.promethean.rest:~/devel/services/battlebussy`
  - staging: `error@ussy3.promethean.rest:~/devel/services/battlebussy-staging`
- runner-side rsync deploy path validated on both hosts
- staging deploy workflow succeeded on GitHub
- production deploy workflow succeeded on GitHub
- post-merge smoke succeeded on both staging and main
- production public verification succeeded after the `main` deploy:
  - `https://battlebussy.ussy.promethean.rest/api/game/status`
  - `https://battlebussy.ussy.promethean.rest/arena`

### Phase 3 — Fleet rollout
Repeat the same protocol for other ussy-hosted services.

Selection heuristic:

- service is publicly routed and long-lived
- service has a stable runtime home
- service currently depends on manual SSH deploys or ad-hoc host edits

## Non-goals
- Do not force every service into the same compose topology.
- Do not claim rollout completeness before live-state convergence is done.
- Do not wire auto-deploy from stale `main` branches.

## Current decision
Treat Proxx as the validated pilot.

Treat Battlebussy as the first non-pilot adopter, but only after its live runtime is reconciled into canonical git state.
