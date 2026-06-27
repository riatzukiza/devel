# Claude thinking-budget mapping + ussy remote deploy

## Goal
Prepare Shibboleth for more stable remote benchmarking by:
- mapping the existing reasoning-effort control surface onto Claude/Anthropic-style thinking budget tokens where supported
- syncing the current working repo state to `error@ussy.promethean.rest`
- leaving the remote in a runnable state for larger benchmark sweeps

## Why now
- local network conditions are degraded, making large runs unreliable
- small reruns show Claude 4.6 Opus works again via the proxy, but the harness still models only `reasoning_effort`
- the remote host already runs the open-hax proxy and should be a more stable execution environment

## Scope
### In scope
1. Research the current proxy / adapter constraints for Claude thinking control.
2. Add a model-aware mapping layer for Claude-style thinking budgets if the proxy can carry it.
3. Rsync the current repo state (including uncommitted local changes and required benchmark artifacts) to the remote host.
4. Verify the remote tree layout and document the remote path used.

### Out of scope
- full remote benchmark execution at large scale in this turn unless the deployment finishes quickly and the user asks to proceed
- productionizing a full remote service manager / CI pipeline

## Open questions
1. Does the open-hax proxy forward Anthropic-specific thinking parameters through its OpenAI-compatible interface, or do we need a dedicated adapter/path?
2. What remote destination path should be treated as canonical for this repo on `ussy.promethean.rest`?
3. Which artifacts are required remotely for immediate judged seedbench runs: source tree only, or also local `data/build/0.1.0`, seed parquet files, and judge caches?

## Risks
- Rsyncing the whole repo naively may transfer unnecessary local caches or large artifacts.
- Proxy compatibility for Anthropic thinking budget parameters may be partial or undocumented.
- Remote runs will still need auth env setup and possibly Java/Clojure dependencies confirmed.

## Phases
### Phase 1 — inspect + choose deploy shape
- inspect remote home / existing workspace layout
- inspect current adapter/proxy assumptions for Claude thinking controls
- choose remote path and rsync include/exclude set

### Phase 2 — code changes for Claude thinking mapping
- add model-aware mapping/config surface if feasible without breaking other models
- keep requested control explicit and logged
- avoid claiming native Claude support if only proxy emulation exists

### Phase 3 — rsync working state to remote
- create/prepare remote directory
- rsync tracked + necessary generated artifacts
- verify remote files are present

### Phase 4 — remote readiness check
- confirm remote can load the repo and sees expected files/config
- note next command(s) to run remotely for benchmark work

## Affected files
- `src/promptbench/eval/openai_adapter.clj`
- `src/promptbench/eval/runner.clj`
- `specs/drafts/claude-thinking-budget-and-ussy-deploy.md`
- remote path under `error@ussy.promethean.rest`

## Definition of done
- Current repo state is present on `ussy.promethean.rest` in a verified path.
- Claude thinking control limitations / mapping are made more explicit in code or documented if blocked by proxy constraints.
- We have a clear remote command path for running judged benchmarks there.
