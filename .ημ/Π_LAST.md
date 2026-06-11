# Π fork-tax snapshot — 20260611T191822Z

- Repository: **riatzukiza/devel** (git@github.com:riatzukiza/devel.git)
- Source branch: `feat/ci-automation-1781026522`
- Snapshot commit: `5153f528daa62518db71ef98d3aa34f1c6ac3238`
- Π tag: `fork-tax/20260611-axxium-remote-guard`

## Scope (12 tracked files)

### Submodule pointer updates (8)
- `orgs/agustif/codex-linux`
- `orgs/octave-commons/gates-of-aker`, `promethean`
- `orgs/open-hax/eta-mu`, `openplanner`
- `orgs/riatzukiza/TANF-app`
- `orgs/shuv/mcporter`, `shuvgeist`

### Service file changes (3)
- `services/llamacpp-stack/docker-compose.yml` — fix model dir env var
- `services/openplanner/compose/proxx.yml` — fix DB URL interpolation
- `services/openplanner/ecosystem.host.config.cjs` — add knoxx MongoDB config

### Remote guard (1)
- `.git/hooks/pre-push` — now blocks push if origin URL != riatzukiza/devel

## Axxium fix

Axxium is properly a submodule (`mode 160000`, `.gitmodules` → `git@github.com:open-hax/axxium.git`).
Previous `Π_STATE.sexp` incorrectly recorded `(repo "open-hax/axxium")` — agents were
reading that and setting the parent remote to axxium's URL. Now corrected to
`(repo "riatzukiza/devel")` with explicit `(remote ...)` field.

Pre-push hook added to block any future accidental remote changes.

## Excluded (secrets — NOT committed)

- `passwords.csv`, provider account/federation JSONs, secrets scripts

## Concurrent dirt (intentionally untouched)

- ~1600 untracked files (audio, lore, graphics, kanban, music) — left as residual per guardrails.

## Handoff artifacts updated

- `.ημ/Π_LAST.md` — this file
- `.ημ/Π_STATE.sexp` — machine-readable state
