## Signal

(己, p=0.86) Fixed the likely memory-growth source in eta-mu extensions:

- `orgs/open-hax/eta-mu/packages/eta-mu-extensions/src/eta_mu/extensions/receipt_river.cljs`
- `orgs/open-hax/eta-mu/packages/eta-mu-extensions/src/eta_mu/extensions/session_mycology.cljs`

(己, p=0.84) Root cause: both extensions were returning `:message` from `before_agent_start`, adding hidden recall messages to the durable session branch every turn. In long sessions, those messages can accumulate even if later `context` hooks prune what gets sent to the model.

(己, p=0.89) Fix: moved Receipt River and Session Mycology recall into idempotent system-prompt sections via `prompt-section/upsert-section`, and stopped returning new hidden `:message` objects each turn.

(己, p=0.92) Built and deployed updated eta-mu runtimes to `~/.pi/agent/extensions/cljs-*`.

(己, p=0.91) Committed changes:

- eta-mu submodule commit: `1d237e4 fix extension context memory growth`
- workspace root pointer commit: `011ad903 bump eta-mu memory leak fix`

## Evidence

(己, p=0.95) Verification passed:

- `pnpm test`
  - `59 tests`
  - `133 assertions`
  - `0 failures`
  - `0 errors`

(己, p=0.92) Build/deploy passed:

- `pnpm run build`
- Deployed:
  - `receipt-river`
  - `session-mycology`
  - all other eta-mu extensions

(己, p=0.82) `rg` confirmed deployed runtimes no longer create new `receipt-river-context` or `session-mycology-context` message payloads; remaining matches are only the legacy prune functions, kept to remove old injected context messages from future prompt context.

## Frames

(世, p=0.84) Most likely frame: durable hidden context-message accumulation caused heap growth over a very long session.

(世, p=0.62) Secondary frame: existing session branches may already contain enough accumulated messages that this fix stops future growth but does not shrink the current branch already loaded in memory.

(世, p=0.44) Less likely but still plausible: `opmf-contract-gate` branch scanning contributes to memory pressure on giant sessions, but it was not the strongest leak pattern found here.

## Countermoves

(己, p=0.88) I did not stage or rewrite unrelated eta-mu changes already present in the submodule.

(己, p=0.84) The root still shows `orgs/open-hax/eta-mu` as modified because the submodule has pre-existing unrelated local changes, but the two files I changed are clean and committed inside the submodule.

(己, p=0.78) If the currently open Pi session still OOMs, that does not necessarily disprove the fix; the already-inflated session branch may need a restart/new session to stop carrying old hidden messages in memory.

## Next

(汝, p=0.9) Restart Pi or `/reload`, then start a fresh session if the old branch still approaches heap limit.