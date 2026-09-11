# devel — Stealth Development Tree

This is the **development workspace on the `stealth` host**: a pnpm +
shadow-cljs monorepo of git submodules organized by GitHub org under `orgs/`,
plus creative production directories, kanban planning, services, and lore.

- **Remote:** `git@github.com:riatzukiza/devel.git`
- **Active branch:** `device/stealth` (device-scoped; never switch branches)
- **Superproject:** this repo is itself a **submodule of the home directory
  superproject** on `stealth` (see [GIT_MODULE_INDEX.md](GIT_MODULE_INDEX.md)).

## Quick start

```bash
cd ~/devel
git submodule update --init --checkout    # materialize nested repos
pnpm install                              # workspace deps
pnpm -w typecheck                         # strict TS check
pnpm -w lint                              # TS + markdown lint
```

Use `eta-mu kanban` to manage tasks; see `kanban/` for workspace-level specs
and `docs/agile/tasks/` for epics/tasks.

## Concepts

- **Superproject / submodule tree.** `orgs/<org>/<repo>` entries are real git
  repositories registered in `.gitmodules` (505 submodule entries). Treat each
  as an independent repo with its own branch state.
- **Device federation.** Each device (yoga, stealth, ...) carries a
  `device/<hostname>` branch of `devel` and of participating submodules. Work
  is device-local until promoted; cross-device sync happens via push/PR, not
  by switching branches.
- **Kanban as planning source.** Markdown cards under `kanban/` and
  `docs/agile/tasks/` sync to GitHub issues via `eta-mu kanban sync github`
  (see AGENTS.md for the sync table and throttling rules).
- **Vertical domain-driven slices.** Agent tooling is organized by domain
  (discord, music, openplanner, contracts), not horizontal layers — see
  [DEVEL.md](DEVEL.md) for the Knoxx style rules.
- **Eta-mu runtime.** Agent extension tooling lives at
  `orgs/open-hax/eta-mu/packages/eta-mu-extensions`; reference:
  `docs/reference/eta-mu-runtime.md`.

## Structure

| Path | Role |
|---|---|
| `orgs/` | Submodule tree by GitHub org: `agustif`, `lakeraven`, `octave-commons`, `open-hax`, `reference`, `riatzukiza`, `shuv`, `stakira`, `ussyverse` |
| `kanban/` | Workspace-level kanban cards + specs (openhax.kanban.json config) |
| `docs/` | Epics, agile tasks, reference docs |
| `services/` | Deployable services + PM2/compose runtime state (e.g. `services/proxx`) |
| `packages/`, `tests/`, `tools/`, `types/` | Workspace code, tests, tooling, shared types |
| `Lore/` + `LORE/` | Creative lore; `Lore/fork-tales/` is the Fork Tales story world (characters, world-state snapshots, plot logs, USTX vocal projects) |
| `Music/`, `Vocals/`, `Voice/`, `Audio/`, `Graphics/`, `Blaze/` | Creative production assets |
| `config/`, `contracts/`, `data/`, `resources/` | Configuration, contracts, data, resources |
| `receipts.edn`, `receipts.log` | Append-only execution evidence (Receipt River) |
| `AGENTS.md` | Agent behavior contract (skills, workflows, output contract) |
| `DEVEL.md` | Knoxx agent style guide (CLJS vertical slices) |
| `PROCESS.md` | Process charter; links to the epiphany process in `~/spaces/foresight` |
| `STYLE.md`, `GLOSSARY.md`, `GIT_MODULE_INDEX.md` | Style, domain vocabulary, submodule map |

## Development

- TypeScript: pnpm workspace, strict typecheck + lint gates (zero errors
  before done).
- ClojureScript: shadow-cljs; follow the modern-pattern rules in DEVEL.md
  (`js-await`, data-oriented tools, vertical slices).
- Tests run per-submodule; many orgs have their own CI. Do not run workspace
  builds casually — the tree is large and mid-work.
- PM2 manages long-running processes (`ecosystem.pm2.edn`,
  `ecosystem.config.cjs`); compose files are versioned and checked in.

## Status

- **Branch:** `device/stealth`, created from the tip of
  `feat/fork-tales-v2-submodule` (that feat branch still exists upstream; do
  not delete or switch).
- **Dirty state (verified 2026-09-11):** 74 uncommitted entries — 62 modified,
  11 untracked, 1 deletion (`orgs/octave-commons/pandora/AGENTS.md`). Bulk of
  it: ~20 modified submodule pointers (fork_tales, fork_tales_v2, daimoi,
  promethean, shibboleth, eta-mu, proxx, openplanner, ...) plus Fork Tales
  lore files (kaelen characters, world-state snapshots, plot logs) and
  `.opencode/agents` edits.
- **Inferred active work:** `fork-tales-v2-submodule` — mirroring
  `fork_tales_v2` as a submodule (HEAD commit:
  `99edb60 feat(octave-commons): mirror fork_tales_v2 as submodule`) plus
  ongoing Fork Tales lore/vocal production.
- **Submodule drift:** 6 submodules checked out at non-registered commits
  (see [GIT_MODULE_INDEX.md](GIT_MODULE_INDEX.md)); eta-mu currently sits on a
  `Π/device/yoga` tag — commit pointers intentionally or carefully.

## Docs

- [AGENTS.md](AGENTS.md) — agent contract for this tree
- [PROCESS.md](PROCESS.md) — process charter
- [STYLE.md](STYLE.md) — code style index
- [GLOSSARY.md](GLOSSARY.md) — domain vocabulary
- [GIT_MODULE_INDEX.md](GIT_MODULE_INDEX.md) — parent/child module map
- `docs/reference/eta-mu-runtime.md` — eta-mu extension build/deploy

## License

Workspace code follows each submodule's own licensing. Libraries produced in
this workspace are released under GNU LGPL v3 or later; services and
standalone applications under GNU GPL v3 or later.
