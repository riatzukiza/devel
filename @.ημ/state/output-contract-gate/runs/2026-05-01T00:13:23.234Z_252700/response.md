## Signal

(己, p=0.86) I fixed the likely eta-mu after-turn OOM source in `opmf-contract-gate`.

(己, p=0.82) The problem pattern was: after the assistant visibly finishes, the `agent_end` hook runs output validation and was materializing/scanning the durable session branch via `sessionManager.getBranch()`. On long or branch-heavy sessions, that can block and amplify memory pressure.

Changed:

- `packages/eta-mu-extensions/src/eta_mu/extensions/opmf_contract_gate.cljs`
  - `agent_end` now passes `event.messages` into validation.
  - Latest assistant/user lookup now reverse-scans the provided message array.
  - Fallback branch scanning remains for manual `/output-gate validate-last`.
  - Repair prompt extraction also uses the bounded event message list when available.
  - Nil user message handling is safer.

Committed:

- `7a5171e Reduce output gate agent-end memory use`
- `bea26c1 Record output gate OOM triage receipt`

## Evidence

(己, p=1.0) Build passed:

```text
pnpm -C /home/err/devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions run build
...
eta-mu build complete
```

(己, p=1.0) Tests passed:

```text
pnpm -C /home/err/devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions test
Ran 59 tests containing 133 assertions.
0 failures, 0 errors.
```

(己, p=0.9) I also confirmed generated `dist/` outputs were not left as tracked changes.

## Frames

(世, p=0.78) Most likely frame: `opmf-contract-gate` was doing expensive post-turn validation after the UI already showed the answer, causing the “finished, then blocked, then OOM” symptom.

(世, p=0.55) Secondary frame: there may still be another post-turn hook causing similar symptoms, but this was the clearest agent-end full-branch materialization path.

(世, p=0.46) The existing receipt-river/session-mycology prompt injection code already had safeguards against hidden context message accumulation, so I did not change those.

## Countermoves

(己, p=0.88) I did not touch existing unrelated modified files in the shared repo.

(己, p=0.81) I did not commit generated extension artifacts, matching the eta-mu runtime docs.

(己, p=0.72) If crashes continue, the next suspects are other `agent_end` / `turn_end` hooks or session persistence paths, not this validation branch scan.

## Next

(汝, p=0.9) Restart or reload Pi so the rebuilt `opmf-contract-gate` runtime is loaded.