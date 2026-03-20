# Spec Draft: Reconcile and retire legacy `services/open-hax-openai-proxy`

## Summary
Safely retire the legacy `services/open-hax-openai-proxy` source checkout now that:
- canonical source should live in `orgs/open-hax/proxx`
- service-local runtime/devops should live in `services/proxx`

The retirement must preserve all meaningful local state first:
- committed but unpushed branch history
- local-only branches
- stash entries
- current dirty working tree changes

## Open Questions
- None.

## Risk Analysis
- **State loss**: the legacy repo contains local-only branch and stash state that is not represented on `origin`.
- **Branch divergence**: `orgs/open-hax/proxx` and `services/open-hax-openai-proxy` are on different local branch lines today.
- **Path breakage**: some historical docs/scripts still mention `services/open-hax-openai-proxy`.

## Audit Findings (initial)
- Legacy repo active branch: `hotfix/gpt-5.4-free-access` at `76e9455`, synced with `origin/hotfix/gpt-5.4-free-access`.
- Legacy repo local-only branch: `experiment/search` at `5cf76c8` (no upstream).
- Legacy repo stashes present: 3 pre-existing entries before retirement work.
- Legacy repo pre-existing dirty state: `web/src/pages/DashboardPage.tsx`.
- Canonical repo local branch `main` is on `b44fca6` and diverges from `origin/main`; that line must be preserved too.

## Completion Notes
- Preserved legacy git state in three ways:
  - fetched legacy refs into `orgs/open-hax/proxx` via `legacy-services-local`
  - added `legacy/experiment-search` plus `legacy-retire/*` tags for the local-only branch + stash commits
  - wrote a full backup bundle to `archives/open-hax-openai-proxy-retired-2026-03-19.bundle`
- Archived the full legacy worktree to `archives/open-hax-openai-proxy-retired-worktree-2026-03-19` and replaced `services/open-hax-openai-proxy` with a compatibility symlink to `services/proxx`
- Copied runtime bind-mounted state (`.env`, `keys.json`, `models.json`, `data/`) into `services/proxx`
- Kept the compose project name as `open-hax-openai-proxy` so the existing named Postgres volume remains attached during the move
- Recreated the live proxy container from `services/proxx` and verified it now mounts `services/proxx/*`
- Reconfirmed database state after cutover by comparing the live public-table row counts (`accounts=223`, `events=94757`, `providers=4`, `schema_version=4`, etc.)

## Implementation Phases
1. **Audit + preserve refs**
   - Record branch/ahead-behind/stash findings.
   - Capture current legacy dirty state into a named preserved ref.
   - Import legacy-only refs/stashes into `orgs/open-hax/proxx`.
2. **Reconcile canonical repo**
   - Move `orgs/open-hax/proxx` onto the intended active line from the legacy repo.
   - Reapply current source-repo doc guidance and preserved dirty WIP as needed.
3. **Retire legacy path**
   - Remove the old submodule from root tracking.
   - Replace `services/open-hax-openai-proxy` with a compat symlink to `services/proxx`.
4. **Verification**
   - Validate root stack config and compat path behavior.
   - Re-run minimal source/build checks.

## Affected Files
- `.gitmodules`
- `services/open-hax-openai-proxy` (retire submodule, replace with symlink)
- `services/proxx/**`
- `orgs/open-hax/proxx/**`
- `specs/drafts/proxx-legacy-services-retirement-2026-03-19.md`

## Definition of Done
- No meaningful local-only state from the legacy repo is lost.
- `orgs/open-hax/proxx` contains preserved/imported legacy-only refs and the active reconciled working line.
- `services/open-hax-openai-proxy` no longer contains source code.
- `services/open-hax-openai-proxy` resolves safely to the new devops home.
- Root stack/config tooling continues to work.

## Verification Notes
- `git branch -vv` / `git stash list` audited in the legacy repo before retirement
- `git bundle create archives/open-hax-openai-proxy-retired-2026-03-19.bundle --all refs/stash` ✅
- `docker compose -f services/proxx/docker-compose.yml -f services/proxx/docker-compose.factory-auth.override.yml config -q` ✅
- `cd orgs/open-hax/proxx && pnpm build` ✅
- Live cutover recreated `open-hax-openai-proxy-open-hax-openai-proxy-1` from `services/proxx` bind mounts ✅
- `curl -H "Authorization: Bearer ..." http://127.0.0.1:8789/health` ✅
- `sha256sum services/open-hax-openai-proxy/data/request-logs.json services/proxx/data/request-logs.json` matched during cutover ✅
- Public-table row counts remained intact after the cutover (`accounts=223`, `events=94757`, `providers=4`, `schema_version=4`) ✅

## Todo
- [x] Phase 1: Audit + preserve refs
- [x] Phase 2: Reconcile canonical repo
- [x] Phase 3: Retire legacy path
- [x] Phase 4: Verification
