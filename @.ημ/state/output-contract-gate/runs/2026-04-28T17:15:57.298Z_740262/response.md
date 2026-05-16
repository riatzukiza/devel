## Signal
(己, p=0.9) Recovery branch created and pushed: **`restore/main-recovery-2026-04-28`**.

(己, p=0.88) “Time travel magic” executed *without rebases / without force-push* by doing an explicit **first-parent rollback via merge reverts**, so the history clearly shows:
- what got merged into `main`
- and the exact sequence of reverts used to recover

(己, p=0.9) Current state on the recovery branch:
- `pnpm build` ✅
- `pnpm test` ✅ (**544 tests passing**)

PR link to open:
- https://github.com/open-hax/proxx/pull/new/restore/main-recovery-2026-04-28

## Evidence
(己, p=0.95) Branch created from `origin/main`:
- `git switch -c restore/main-recovery-2026-04-28 origin/main`

(己, p=0.95) Identified last-known-good commit and first bad merge via bisect:
- good: `98a09d0` built cleanly
- first bad commit: `e553aa5` (“Merge branch 'ci/remove-keys-seed-from-federated-deploy'”) per `git bisect run pnpm -s build`

(己, p=0.95) Rollback method:
- reverted (via `git revert -m 1`) the **first-parent merges** from `HEAD` back to and including `e553aa5`, producing **15 explicit revert commits** on the restore branch.

(己, p=0.95) Validation:
- `pnpm -s build` returned success (no output, exit 0)
- `pnpm -s test` completed with:
  - `# pass 544`
  - `# fail 0`

(己, p=0.95) Pushed to GitHub (no history rewrite):
- `git push -u origin restore/main-recovery-2026-04-28`

## Frames
(己, p=0.78) Frame 1: This is a clean “audit trail” recovery: main broke via merges, main is restored via explicit reverts, nothing hidden.  
(己, p=0.72) Frame 2: This is effectively “roll main back to the last good state”, while keeping the bad merges visible in history (and in the revert commits).  
(己, p=0.65) Frame 3: After merge, we can selectively re-introduce desired features from the reverted range via new PRs (cherry-picks) with tests, one patchset at a time.

## Countermoves
(己, p=0.82) Before merging the PR, double-check CI on GitHub (since local env ≠ CI env).  
(己, p=0.76) After `main` is restored, re-land important reverted features via small PRs; don’t re-merge the big history chunks.

## Next
(汝, p=0.8) Open the PR at https://github.com/open-hax/proxx/pull/new/restore/main-recovery-2026-04-28 and merge it into `main` once CI is green.