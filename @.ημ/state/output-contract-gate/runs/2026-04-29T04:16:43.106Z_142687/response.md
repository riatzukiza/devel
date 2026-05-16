## Signal

(ctx=己, p=0.99) Finished the stale PR salvage and promotion cycle.

(ctx=己, p=0.99) Salvaged and merged PR #182 useful work via replacement PR #195:
- `3dc3b97` `Fix UI runtime LS_THEME ReferenceError`
- `80b415a` `Add Vitest frontend smoke tests`
- Merged to `staging`: `31b4159`
- Closed original #182 as superseded.

(ctx=己, p=0.99) Promoted staging to main via PR #196:
- Merge commit: `85267b59c5001f9577b31a98e4186fd68091355c`

(ctx=己, p=0.99) Production deploy initially failed due host Docker disk pressure:
- Failed run: `25089502754`
- Root cause: Docker layer extraction failed with `no space left on device`.

(ctx=己, p=0.99) Fixed deploy hygiene and stale nginx route resolution:
- PR #197: prune Docker builder cache and unused images before remote deploy builds.
  - `3fabda8 fix: prune docker build cache before remote deploy`
  - merged to `staging`: `2d58600`
- PR #199: restart remote deploy services sequentially in configured order so nginx/ssl restart after app services.
  - `bf8f810 fix: restart remote deploy services in order`
  - merged to `staging`: `8db0f31`

(ctx=己, p=0.99) Promoted those deploy fixes via PR #198:
- Merged to `main`: `3995b98bd0cc920413d51143cc728e09ccf75892`

(ctx=己, p=0.99) Production deploy is now green:
- Run: `25090387622`
- `production-preflight` ✅
- `deploy-production` ✅
- `verify-production` ✅

(ctx=己, p=0.99) No open PRs remain in `open-hax/proxx`.

## Evidence

(ctx=世, p=0.99) Local validation before #195:
- `pnpm -s typecheck` ✅
- `pnpm -s lint:errors` ✅
- `pnpm -s web:build` ✅
- `pnpm -s web:test` ✅
- `pnpm -s test` ✅, 631 pass / 1 skipped.

(ctx=世, p=0.99) GitHub PRs completed:
- #193 merged, #180 closed superseded.
- #194 merged, #187 closed superseded.
- #195 merged, #182 closed superseded.
- #196 merged staging replay work to main.
- #197 merged deploy prune fix to staging.
- #199 merged ordered restart fix to staging.
- #198 merged final staging deploy fixes to main.

(ctx=世, p=0.99) Final production workflow:
- `deploy-production` run `25090387622`: success.

## Frames

(ctx=己, p=0.92) Frame 1: The original stale-PR cleanup goal is complete; all useful stale PR work was either replayed or intentionally left behind as obsolete/conflicting.

(ctx=己, p=0.9) Frame 2: The deploy failure was not caused by the replayed feature work; it exposed operational debt in remote Docker cache/disk management.

(ctx=己, p=0.88) Frame 3: The recurring staging federation routing failure was a deploy-order/proxy-resolution issue, not a regression in app routing logic.

## Countermoves

(ctx=己, p=0.97) Did not force-push or rebase.

(ctx=己, p=0.97) Did not delete backup/replay branches except via GitHub PR merge options where explicitly set `--delete-branch=false`.

(ctx=己, p=0.95) Closed superseded PRs only after their useful work had replacement PRs merged.

(ctx=己, p=0.94) Treated e2e failures as actionable and fixed deploy mechanics before promoting.

## Next

(ctx=己, p=0.95) Leave the repo as-is; no immediate follow-up is required unless you want stale replay branches cleaned up later.