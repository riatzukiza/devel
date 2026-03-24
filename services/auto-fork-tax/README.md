# Auto Fork Tax Ops Notes

This service layer is the ops wrapper around `src/auto-fork-tax/cli.ts`.

## Purpose
- run Π snapshots on a 6-hour cadence
- open a PR per snapshot
- target the most recent compatible snapshot branch when safe
- use `pi` against `https://ussy.promethean.rest` for review text
- refuse giant generated artifacts before commit/push

## Safety protocol
- run in a **dedicated automation clone**, not your interactive dev clone
- use cron/systemd timer, **not filesystem watch mode**
- no auto-merge
- dirty submodules block snapshotting unless explicitly overridden
- PR chain only advances when the previous recorded snapshot head is an ancestor of the current head

## Bootstrap
From the source workspace:

```bash
pnpm forktax:auto bootstrap-clone --root /home/err/devel --clone-dir ~/.local/share/pi-auto-fork-tax/devel
```

This produces a **target clone** for clean git state and a **suggested cron line** that runs the CLI from the source workspace checkout while targeting the clean clone via `--root`.

## Cron
For a same-machine setup, the practical pattern is:

```bash
0 */6 * * * cd /home/err/devel && pnpm tsx src/auto-fork-tax/cli.ts cycle --root ~/.local/share/pi-auto-fork-tax/devel --apply --review --post-comment >> ~/.local/share/pi-auto-fork-tax/devel/.ημ/auto-fork-tax/cron.log 2>&1
```

Use `pnpm forktax:auto bootstrap-clone ...` to emit the exact command for your paths.

## Systemd timer
See:
- `services/auto-fork-tax/auto-fork-tax.service`
- `services/auto-fork-tax/auto-fork-tax.timer`
- `services/auto-fork-tax/auto-fork-tax.env.example`

## Review model
Suggested fast baseline:
- `open-hax-compat/glm-5`

Higher-cost / slower option:
- `open-hax-completions/gpt-5.4`
