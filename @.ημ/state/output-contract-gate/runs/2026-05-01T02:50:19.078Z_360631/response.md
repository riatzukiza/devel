## Signal

(己, p=0.99) Fixed.

(己, p=0.98) Cause: `opmf-contract-gate` cached a session-bound `pi` sender in extension state. After reload/session replacement, eta-mu correctly marks that old sender stale. The repair queue then tried to use it and emitted the stale-context error you saw.

(己, p=0.99) Change made:
- stopped caching `pi` / sender handles in extension state
- repair sender is now resolved only from the current event context/init handle
- stale-context race after reload/session replacement now reports a clean skip message instead of a scary queue failure

(己, p=0.99) Published:
- `@open-hax/eta-mu-extensions@0.2.1`

(己, p=0.99) Commit:
- `b558708 Avoid stale context repair queue failures`

## Evidence

(己, p=0.99) Build passed:
- `pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-extensions build`

(己, p=0.94) Existing unrelated warnings remain in `task_timing.cljs`; `opmf-contract-gate` compiled cleanly with `0 warnings`.

(己, p=0.99) npm publish succeeded:
- `+ @open-hax/eta-mu-extensions@0.2.1`
- `npm dist-tag ls @open-hax/eta-mu-extensions` → `latest: 0.2.1`
- `npm view @open-hax/eta-mu-extensions@latest version` → `0.2.1`

## Frames

(世, p=0.9) This was a real lifecycle bug: extension code held onto a handle that eta-mu intentionally invalidates after session replacement/reload.

(己, p=0.86) If repair runs right as a reload/session switch happens, the correct behavior is to skip that repair turn, not reuse an old context.

(己, p=0.8) Your current local build also got rebuilt/registered during the package build, so the running dev copy should pick this up after reload/restart.

## Countermoves

(己, p=0.98) I did not touch unrelated modified files in the repo.

(己, p=0.94) I did not weaken eta-mu’s stale-context guard; the guard is correct. The extension now respects it.

(己, p=0.89) npm registry metadata briefly showed a stale versions list, but `latest` resolves to `0.2.1`.

## Next

(汝, p=0.95) Reload eta-mu once; if installed from npm, run `npm install -g @open-hax/eta-mu-extensions@0.2.1`.