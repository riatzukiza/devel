## Signal

(ctx=己, p=0.96) I scanned Proxx remote branches against `origin/staging`. There is still unintegrated work, but most of it is stale/salvage-only rather than clean merge-ready.

(ctx=世, p=0.98) Current open PRs:

```text
#201 staging -> main
  https://github.com/open-hax/proxx/pull/201
  Status: most checks green, but coderabbit-review-gate, deploy-staging, staging-promotion-gate failing.

#204 coderabbitai/autofix/0ae6ca6 -> staging
  https://github.com/open-hax/proxx/pull/204
  Status: CodeRabbit autofix PR, checks mostly green; eta-mu cancelled.
```

(ctx=己, p=0.94) Highest-value unintegrated candidates:

| Priority | Branch | Unintegrated commits | Recommendation |
|---:|---|---:|---|
| 1 | `origin/coderabbitai/autofix/0ae6ca6` | 1 | Review/merge or manually apply. It is active PR #204. |
| 2 | `origin/backup/reconcile-dev-stable-cherrypick-wip-2026-04-28` | 2 | Cherry-pick/replay selectively; looks like safe tests/specs + token-refresh extraction. |
| 3 | `origin/feat/embeddings-strategy-hf-tei-ovm-npu` | 1 real remaining commit | Salvage if embeddings provider strategy work is still desired. |
| 4 | `origin/feat/stuff` | 12 | Salvage only. Contains useful UI/tests/specs but branch is stale and broad. |
| 5 | `origin/feat/cljs-data-layer` | 2 real unmatched commits, rest equivalent | Mostly superseded by current CLJS recovery; inspect Layer 4/5 deltas only. |
| Low | `origin/conflicts/staging` | 2 | Dirty conflict/history branch; do not merge wholesale. |
| No-op | `origin/fix/deploy-prune-before-build` | 0 patch-unique | Patch-equivalent already integrated despite branch appearing ahead. |

## Evidence

(ctx=世, p=0.98) `git cherry -v origin/staging <branch>` showed these patch-unique commits:

```text
origin/coderabbitai/autofix/0ae6ca6
+ e2ba4f8 fix: apply CodeRabbit auto-fixes

origin/backup/reconcile-dev-stable-cherrypick-wip-2026-04-28
+ d4a88c5 fix: salvage safe proxx integration changes
+ c284512 refactor: extract token refresh runtime bindings

origin/feat/embeddings-strategy-hf-tei-ovm-npu
+ 92c3351 refactor(embeddings): rewrite as proper ProviderStrategy subclasses

origin/feat/stuff
+ aad5f80 update package.json
+ d6eaa3b add epics
+ 141a0c0 Fix proxx TypeScript build
+ 4a2bb7b Fix proxx test runner and bridge WS wiring
+ 4e59a3a Fix federation UI routes and routing/test regressions
+ bba9395 Fix tenant-provider-policy UI maxRequestsPerMinute typing
+ 105e352 Fix proxy tests: images passthrough, OpenAI OAuth cooldown, SSE bootstrap
+ 6ce4165 Fix DashboardPage duplicate helper breaking Vite build
+ 2ed8886 correctly set up pnpm
+ 5f36127 Fix UI runtime LS_THEME ReferenceError
+ e781353 Add Vitest frontend smoke tests
+ 43f5c32 Fix CredentialsPage missing disabled-account helpers

origin/feat/cljs-data-layer
+ 9def1e9 feat(cljs-data-layer): Layer 4 — store protocol + initial drivers
+ ce83391 feat(cljs-data-layer): Layer 5 — pipeline (chain of custody)
- remaining boot/review/sensitive-redaction commits appear patch-equivalent/integrated

origin/fix/deploy-prune-before-build
- 7ffdba1 fix: prune docker build cache before remote deploy
```

(ctx=世, p=0.93) `origin/feat/stuff` is broad: package/pnpm changes, specs, major `src/app.ts`, provider strategy, UI routes, frontend tests, credentials page, dashboard page. It should not be merged directly.

(ctx=世, p=0.92) `origin/feat/cljs-data-layer` Layer 4/5 commits overlap conceptually with the current CLJS recovery but are not patch-identical; they may contain driver/pipeline details worth diffing.

## Frames

(ctx=己, p=0.91) Frame 1: The “live integration lane” is `staging -> main` via PR #201 plus the CodeRabbit autofix PR #204.

(ctx=己, p=0.89) Frame 2: The most salvageable old technical work is token-refresh extraction/tests and embeddings strategy refactor.

(ctx=己, p=0.87) Frame 3: `feat/stuff` is more of a historical junk drawer with several valuable shards than a branch.

## Countermoves

(ctx=己, p=0.96) Do not merge `origin/feat/stuff` wholesale.

(ctx=己, p=0.95) Do not merge `origin/conflicts/staging`; treat it as archaeological evidence only.

(ctx=己, p=0.93) Do not assume ahead-count equals missing work; `git cherry` showed some ahead branches are patch-equivalent already.

(ctx=己, p=0.91) Do not replay old CLJS Layer 4/5 blindly over the current CLJS runtime bridge; compare for missing store/driver semantics first.

## Next

(ctx=己, p=0.96) Review PR #204 first, then create one salvage PR for `c284512` + `d4a88c5` from `origin/backup/reconcile-dev-stable-cherrypick-wip-2026-04-28`.