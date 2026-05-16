## Signal

(ctx=己, p=0.97) Fixed `opmf_contract_gate.cljs`.

(ctx=己, p=0.96) Root cause: `sendUserMessage` can return `undefined`, but the gate assumed it was promise-like and called `.then`; additionally, repair messages sent during/near agent processing need an explicit delivery mode.

(ctx=己, p=0.96) Change made:
- Calls `sendUserMessage` with `#js {:deliverAs "followUp"}`.
- Treats the return value as maybe-sync/maybe-promise before calling `.then`.
- Catches queueing errors and reports them via UI notify instead of surfacing `Cannot read properties of undefined`.

(ctx=己, p=1.0) Committed the fix:

`343126c Fix output contract gate repair queuing`

## Evidence

(ctx=己, p=1.0) Edited:

`orgs/open-hax/eta-mu/packages/eta-mu-extensions/src/eta_mu/extensions/opmf_contract_gate.cljs`

(ctx=己, p=1.0) Verified with:

`pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-extensions test`

Result: `60 tests`, `137 assertions`, `0 failures`, `0 errors`.

(ctx=己, p=0.98) Also ran:

`pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-extensions build`

Result: build completed. Existing `task_timing.cljs` infer warnings remain unrelated to this fix.

## Frames

(ctx=己, p=0.9) Frame 1: This was an API drift bug: `sendUserMessage` behavior/options changed or became stricter around active agent processing.

(ctx=己, p=0.86) Frame 2: This was also a robustness bug: lifecycle hooks should not assume extension API calls return Promises unless documented/observed.

(ctx=己, p=0.8) Frame 3: The runtime error text mentioning `streamingBehavior` maps conceptually to pi’s extension-side `deliverAs` option.

## Countermoves

(ctx=己, p=0.95) I only staged/committed the touched gate file, respecting the existing workspace changes.

(ctx=己, p=0.92) I did not touch the many pre-existing modified/deleted files shown by `git status`.

(ctx=己, p=0.88) If the gate still misbehaves after reload, the next suspect is whether runtime expects `"steer"` instead of `"followUp"` for self-repair timing, but `"followUp"` is the safer mode for “after current work completes.”

## Next

(ctx=汝, p=0.9) Run `/reload` in pi so the updated eta-mu extension is loaded.