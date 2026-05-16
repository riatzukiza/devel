## Signal
(己, p=0.9) Open PR triage after reconciliation:

| PR | Branch | Recommendation | Why |
|---:|---|---|---|
| #190 | `reconcile/dev-stable-tree-over-recovered-main-2026-04-28` → `staging` | Keep, primary reconciliation PR | This is the branch we just stabilized. It contains recovered-main ancestry plus `dev/stable` and the follow-up fix commit. |
| #189 | `restore/main-recovery-2026-04-28` → `staging` | Close as superseded by #190 | Its head is already an ancestor of #190. #190 includes the recovery history and the dev/stable reconciliation. |
| #188 | `fix/ollama-cloud-glm-routing` → `staging` | Close as superseded by #190 | Its head is already an ancestor of #190. The work landed through `dev/stable`. |
| #187 | `feat/cljs-data-layer` → `staging` | Keep intent, but replace current PR after #190 | It has 9 unique CLJS/data-layer commits not in #190, but current PR is old and failing. Best path: new replay branch from post-#190 staging/reconcile. |
| #182 | `feat/stuff` → `staging` | Stale current PR; salvage selectively | It has 13 unique commits not in #190, but the PR is huge/dirty and contains old staging merge residue. Extract useful commits into a new branch later. |
| #181 | `staging` → `main` | Keep as promotion lane, but do not merge yet | This is downstream. It should only be usable after #190 lands into `staging` and checks rerun. |
| #180 | `feat/embeddings-strategy-hf-tei-ovm-npu` → `staging` | Keep intent, replace current PR after #190 | It has 2 unique embedding-provider commits not in #190, but current PR is old/dirty/failing. Replay later onto the reconciled base. |

(己, p=0.86) Immediate action order:

1. Fix #190 lint.
2. Merge #190 into `staging`.
3. Let #181 update/rerun as the staging→main promotion PR.
4. Close #189 and #188 as superseded.
5. Replace/replay #187, #182, #180 one at a time after staging is stable.

## Evidence
(己, p=0.95) `gh pr list` found these open PRs:

- #190 `Reconcile/dev stable tree over recovered main 2026 04 28`
- #189 `Restore/main recovery 2026 04 28`
- #188 `Fix/ollama cloud glm routing`
- #187 `Feat/cljs data layer`
- #182 `Feat/stuff`
- #181 `Staging`
- #180 `feat(embeddings): add HF cloud, TEI, and ovm-npu strategies`

(己, p=0.95) Ancestor checks against #190:

- #189 head is ancestor of #190: yes
- #188 head is ancestor of #190: yes
- #181 `staging` head is ancestor of #190: yes
- #187 head is not ancestor of #190; has 9 unique commits
- #182 head is not ancestor of #190; has 13 unique commits
- #180 head is not ancestor of #190; has 2 unique commits

(己, p=0.9) #190 current failures:

- `main-lint` fails with:
  - `src/lib/federation/on-demand-projections.ts:71:12` unused caught `error`
  - `src/tests/on-demand-projections.test.ts:62:10` unexpected `any`
- `staging-promotion-gate` fails because #190 head is not yet an ancestor of `origin/staging`; this is expected for a PR into staging and may be workflow/branch-protection noise, but it is currently reported as a failure.

(己, p=0.86) Unique commits worth preserving later:

- #187:
  - CLJS data-layer Layer 4/5, boot, pipeline, store fixes.
- #182:
  - UI/runtime fixes, Vitest smoke tests, pnpm setup, proxy/test fixes.
- #180:
  - HF cloud / TEI / ovm-npu embedding strategy work.

## Frames
(己, p=0.78) Frame 1: #190 is the new trunk-candidate; anything already contained in it is stale as a PR.  
(己, p=0.72) Frame 2: #187/#182/#180 are not garbage; their current PR branches are stale, but their feature intent still has salvage value.  
(己, p=0.68) Frame 3: #181 is not a feature PR; it is the promotion lane. It should follow #190, not compete with it.

## Countermoves
(己, p=0.82) Do not merge #189 or #188 now; that would duplicate/scramble history already represented by #190.  
(己, p=0.78) Do not try to fix all stale PRs before #190; that reopens the divergence wound. Stabilize the trunk candidate first.  
(己, p=0.74) Do not close #187/#182/#180 without preserving the branch names/commit lists; they contain real work even if the PRs are stale.

## Next
(汝, p=0.84) Fix the two lint errors on #190, push that branch, then close #189 and #188 as superseded.