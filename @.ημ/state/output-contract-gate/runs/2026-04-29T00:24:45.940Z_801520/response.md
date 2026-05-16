## Signal
(己, p=0.93) Mirrored **mojomast’s public GitHub repos** into this monorepo under `orgs/ussyverse/*` as **git submodules**, and ensured **SSH URLs**.

(己, p=0.9) Created forks under **`riatzukiza`** (where possible / as GitHub allows), then repointed the monorepo so the steady-state workflow matches what we did for `orgs/shuv/*`:

- (己, p=0.9) `.gitmodules` for mojomast-derived submodules now points to your fork-first SSH URL:
  - `git@github.com:riatzukiza/<fork-repo>.git`
- (己, p=0.9) inside each `orgs/ussyverse/<repo>` checkout:
  - `origin` = your fork
  - `upstream` = `git@github.com:mojomast/<repo>.git`

(己, p=0.92) Added docs:
- `orgs/ussyverse/FORKING.md`
- `orgs/ussyverse/MISSING_REPOS.md`

(己, p=0.95) Committed the changes:
- commit `436bf1a6` — `orgs/ussyverse: mirror mojomast public repos, fork-first URLs`

## Evidence
(己, p=0.9) GitHub API inventory: `275` public repos visible under `mojomast`.  
(己, p=0.88) Submodules present in `.gitmodules` under `orgs/ussyverse/*`: `276` total, where:
- `273` are mojomast-derived + mirrorable (forked + added as submodules)
- `3` pre-existing non-mojomast entries (`kanban`, `monorepo`, `routussy`) were left in place; I also converted `kanban` + `routussy` to SSH URLs for consistency.

(己, p=0.9) Missing as submodules due to empty/unborn default branch (documented in `orgs/ussyverse/MISSING_REPOS.md`):
- `devussy2`
- `devussy-push-test`

(己, p=0.9) All `orgs/ussyverse/*` submodule URLs in `.gitmodules` are now non-HTTP (SSH) (`0` https:// entries remain under that prefix).

## Frames
(己, p=0.72) Frame A: “Do the same thing” = mirror repos as submodules + fork-first URLs + `origin/upstream` remotes; completed.
(己, p=0.66) Frame B: Some mojomast repos are themselves forks; GitHub fork-network behavior means “forking mojomast’s fork” can reuse an existing fork you already have under `riatzukiza` (still fine as long as `origin` is writable and `upstream` targets mojomast for PRs).
(己, p=0.6) Frame C: Empty repos can’t be represented as usable submodules because there’s no commit to pin; recorded as missing.

## Countermoves
(己, p=0.86) If you want *every* mojomast repo present even when empty, the only robust approach is a placeholder README commit upstream (or we track them via metadata instead of submodules).
(己, p=0.84) If you later transfer forks to an org, you’ll want a follow-up pass to rewrite `.gitmodules` URLs again (fork owner changes) and re-run the per-submodule remote normalization.

## Next
(汝, p=0.85) Tell me whether you want the same “fork-first rewrite” applied only to mojomast-derived entries (current behavior) or to **all** of `orgs/ussyverse/*` regardless of source owner, and I’ll normalize anything remaining accordingly.