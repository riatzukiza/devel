# Π Recursive Fork Tax Snapshot — devel root

- Timestamp: 20260516T185547Z
- Branch: pi/fork-tax/2026-04-15-170411
- Base: 6146d1ed
- Scope: recursive bottom-up preservation of selected active repos plus staged/safe root creative, audio, docs, service, receipt, and handoff artifacts.

## Recursive child commits preserved

- `orgs/open-hax/eta-mu` → `9edc4c59` (`pi/fork-tax/20260516-eta-mu-9edc4c59`, branch `pi/fork-tax/20260516-eta-mu-recursive`)
- `orgs/open-hax/proxx` → `446317dc` (`pi/fork-tax/20260516-proxx-446317dc`)
- `orgs/open-hax/openplanner` → `10782a4a` (`pi/fork-tax/20260516-openplanner-10782a4a`)
- `orgs/open-hax/openplanner/packages/agents/knoxx` → `a770d959` (`pi/fork-tax/20260516-knoxx-a770d959`)
- `orgs/open-hax/openplanner/packages/graph/webgl-graph-view` → `492e00d0` (`pi/fork-tax/20260516-webgl-graph-view-492e00d0`)
- `orgs/open-hax/uxx` → `d76dc9e7` (`pi/fork-tax/20260516-uxx-d76dc9e7`)

## Root work included

- Existing staged creative/graphics/audio/lore/voice artifacts and reorganizations.
- Fork Tales audio audit docs, schemas, scripts, rubrics, examples, and local skill registrations.
- Service compose/runtime changes under `services/**`, including OpenPlanner/Proxx/llamacpp/musicgen/utau-renderer state already staged or safely stageable. Large UTAU voicebank zip archives are preserved through Git LFS pointers.
- Root `AGENTS.md`, `opencode.jsonc`, `receipts.edn`, `receipts.log`, `send_msg.py` (credential moved to `DISCORD_BOT_TOKEN` env lookup), and `.ημ` handoff/manifest artifacts.
- Staged OpenUtau submodule registration at the upstream commit already in the root index.

## Verification

- Child checks:
  - webgl: `git diff --cached --check` passed.
  - knoxx: `git diff --cached --check` passed; prior receipts cover backend compile/runtime health.
  - openplanner: `git diff --cached --check` passed after child commits.
  - proxx: `git diff --cached --check` and `pnpm exec tsx --test src/tests/proxy-headers.test.ts` passed.
  - uxx: `git diff --cached --check` passed.
  - eta-mu: `git diff --cached --check`; `pnpm --dir packages/eta-mu-extensions test`; `pnpm --dir packages/coding-agent test test/agent-session-runtime-events.test.ts` passed.
- Root `git diff --cached --check` passed after staging this snapshot and whitespace-normalizing staged text/SVG/voicebank metadata files.
- Staged high-risk secret heuristic scan passed after replacing a hardcoded Discord bot token in `send_msg.py` with an environment lookup.
- Pre-commit large-blob guard was satisfied by moving the two oversized UTAU zip archives to Git LFS pointers instead of overriding the guard.
- Benchmark transcript Base64HighEntropyString false positives were marked with inline allowlist comments, and `services/utau-renderer/openutau/OpenUtau.deps.json` is preserved through a Git LFS pointer to avoid scanning dependency hash metadata as source text; `.secrets.baseline` was restored unchanged and no hook bypass was used.
- Post-push UTAU Git LFS tracking was narrowed to exact oversized/pointer-managed artifacts so existing normal-tracked archives do not become dirty solely because of broad attributes.

## Residual dirt intentionally not absorbed

- Deletion-only/noisy worktrees and clones under `.worktrees/**`, `inbox/**`, `tmp/**`, and `orgs/ussyverse/monorepo/projects/**` were left untouched as separate or unsafe scopes.
- `orgs/open-hax/proxx/.worktrees/**` and `orgs/open-hax/openplanner/packages/agents/knoxx/.worktrees/**` were left for their owning branches.
- `orgs/stakira/OpenUtau` local source change and `.opencode/openutau-patched/**` build binaries were not committed or pushed; only the root's pre-staged submodule registration is preserved.
- `.config/BetterDiscord` was left untracked as personal/runtime config.
- Untracked external repo directories such as `orgs/facebookresearch/demucs`, `orgs/maxrmorrison/torchcrepe`, `orgs/spotify/basic-pitch`, and `orgs/ussyverse/citewiser` were left unabsorbed rather than vendored accidentally.
- Dirty private/no-remote repos were documented in `.ημ/recursive-fork-tax-dirty-inventory.json` and left untouched.

No destructive cleanup, repo-wide reset, repo-wide restore, or blanket unstaging was performed.

## Final corrective root commit

- A small follow-up root commit narrows `.gitattributes` LFS patterns and refreshes the tracked-tree manifest/receipts without force-pushing the already-pushed root snapshot.
