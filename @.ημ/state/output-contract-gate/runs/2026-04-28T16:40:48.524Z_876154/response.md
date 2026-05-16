## Signal
(己, p=0.86) Your local state shows **`fix/ollama-cloud-glm-routing` is ahead of its remote by 2 commits** and has **uncommitted changes**, while **local `main` is ahead of `origin/main` by 2 merges that are not pushed** (good: you can avoid making `origin/main` even worse).  
(己, p=0.84) The least-risk recovery pattern here is: **freeze the stable branch tip**, then **restore `main` via PR(s)** using either **reverts** (if “bad code” is already on `origin/main`) or **forward-fix** (cherry-pick the known-good set onto a fresh branch off `origin/main`). Avoid “merge staging into the stable branch” as your primary move; it amplifies conflicts and multiplies history noise.

Concrete playbook (safe, reversible):

1) **Protect the stable branch state (backup + tag)**
- (己, p=0.78) Commit your current working tree on `fix/ollama-cloud-glm-routing` (you have many modified files + 2 untracked paths).
- Then create a backup branch + annotated tag at the stable tip and push them:
  - `git switch fix/ollama-cloud-glm-routing`
  - commit (message like “WIP: stabilize ollama-cloud routing + SIGTERM shutdown”)
  - `git branch backup/fix-ollama-cloud-glm-routing-2026-04-28`
  - `git tag -a stable/fix-ollama-cloud-glm-routing-2026-04-28 -m "Known-good stable tip"`
  - push branch + tag

2) **Do NOT push local main right now**
- (己, p=0.9) Your local `main` contains *unpushed* merges:
  - `247f626 Merge remote-tracking branch 'origin/staging'`
  - `80eaa2b Merge pull request #179 …`
- If you push these blindly, you’ll likely worsen the “main is unstable” situation and make later forensics harder.

3) **Pick one of two recovery strategies for `origin/main`**
- **Strategy A (revert PRs):** best if `origin/main` already contains the break and you can identify the merge(s) that introduced it.
  - Create `restore/main-via-reverts` from `origin/main`
  - Revert the offending commits (for merges: `git revert -m 1 <merge_sha>`)
  - Push branch, open PR into `main`, let CI prove stability.
- **Strategy B (forward-fix PR):** best if “stable branch” contains the correct behavior and you want `main` to become that behavior without rewriting history.
  - Create `restore/main-from-stable-cherrypicks` off `origin/main`
  - Cherry-pick only the minimal stable commit range from your stable branch (see Evidence for merge-base)
  - Resolve conflicts once, push, PR into `main`.

4) **Only after `main` is stable, reconcile `staging`**
- (己, p=0.8) Given the divergence, prefer “**cherry-pick a known-good patchset onto staging**” rather than “merge staging into the stable branch”.
- If staging is the “future” integration line, do: branch from `origin/staging` → cherry-pick minimal routing fixes → PR to `staging`.

## Evidence
(己, p=0.95) Repo status on `orgs/open-hax/proxx`:
- You are on `fix/ollama-cloud-glm-routing…origin/fix/ollama-cloud-glm-routing [ahead 2]` with many modified files and 2 untracked paths:
  - `docs/notes/2026.04.26.13.13.58.md`
  - `src/lib/provider-strategy/strategies/embeddings.ts`

(己, p=0.92) Local `main` is ahead of `origin/main` by these two commits (unpushed):
- `247f626 Merge remote-tracking branch 'origin/staging'`
- `80eaa2b Merge pull request #179 from open-hax/fix/ollama-cloud-glm-routing`

(己, p=0.88) Divergence info:
- merge-base(`main`, `fix/ollama-cloud-glm-routing`) = `98a09d0e9283cfa98ac00229be64ab268c342e98`
- Unique-to-branch includes: `6eacc78 Fix Ollama NDJSON cumulative streaming deltas`, `39adff1 Graceful shutdown on SIGTERM…`, etc.
- Unique-to-main includes: merges from other lines plus a staging merge.

## Frames
(己, p=0.74) Frame 1: “Main is unstable because a staging merge (or similar) imported breaking changes; stable branch avoided that line.”  
(己, p=0.66) Frame 2: “Main is unstable due to a specific feature merge; staging conflicts are a symptom, not the cause.”  
(己, p=0.6) Frame 3: “Both lines have partial fixes; the branch looks stable locally but will break once rebased/CI’d against current staging dependencies.”

## Countermoves
(己, p=0.86) Countermove: treat “stable” as a hypothesis—**prove it with CI/tests** on a branch based off `origin/main` (or `origin/staging`) before declaring victory.  
(己, p=0.84) Countermove: avoid history-salad merges while debugging—**use revert PRs or cherry-pick patchsets** so you can bisect and explain what changed.  
(己, p=0.8) Countermove: freeze evidence—**tag the stable tip** before attempting any conflict-heavy integration.

## Next
(汝, p=0.78) Create and push a backup tag for the current stable tip: `stable/fix-ollama-cloud-glm-routing-2026-04-28` (after committing your current working tree), so we can safely proceed to either a revert-PR or cherry-pick-PR to restore `main`.