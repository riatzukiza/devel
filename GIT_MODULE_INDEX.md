# GIT_MODULE_INDEX — devel submodule map (stealth)

Verified 2026-09-11 via `ssh stealth` (`ls orgs/`, `.gitmodules` head,
`git submodule status`, per-org `.git` counts). `.gitmodules` carries **505
submodule entries**; the table below indexes the parent/child topology and
the entries most relevant to current work, not all 505.

## Parent

| Field | Value |
|---|---|
| Path | `~/devel` on host **stealth** |
| Repo / remote | `git@github.com:riatzukiza/devel.git` |
| Branch | `device/stealth` (created from tip of `feat/fork-tales-v2-submodule`) |
| Grandparent | home-directory superproject (`~`), which tracks `devel` as a submodule on the same branch |
| Role | Development superproject: pnpm/shadow-cljs workspace, org-partitioned submodule tree, creative production, kanban planning, services |

## Children (by org)

| Org (`orgs/<org>/`) | Nested `.git` repos found | Notes |
|---|---|---|
| `agustif` | 1 | e.g. `codex-linux` (`heads/main`) |
| `lakeraven` | 3 | |
| `octave-commons` | 16 | daimoi, eros-eris-field(+app), eta-mu-sol, fork_tales, fork_tales_v2, gates-of-aker, helm, lineara_conversation_export, pantheon, promethean, promethean-agent-system, shibboleth, simulacron, ... |
| `open-hax` | 11 | axxium, commanoxx, depenoxx, eta-mu, openplanner, proxx, tooloxx, vexx, ... |
| `reference` | 0 | plain directory, no nested repos |
| `riatzukiza` | 5 | ollama-benchmarks, openhax, promethean, riatzukiza.github.io, desktop, book-of-shadows, goblin-lessons |
| `shuv` | 167 | GitNexus, bridle, kapture, ... |
| `stakira` | 1 | |
| `ussyverse` | 276 | largest subtree |

## Key submodule entries

Format: `| path | repo/remote | branch | role | one-line |`
(branches shown as observed in `git submodule status` / `.gitmodules`;
many submodules declare `branch = device/stealth` in `.gitmodules`).

| path | repo/remote | branch | role | one-line |
|---|---|---|---|---|
| `orgs/octave-commons/fork_tales` | `octave-commons/fork_tales` | `feat/ci-kanban-sync-1781035168` | story implementation | original Fork Tales repo (kanban: 56 cards) |
| `orgs/octave-commons/fork_tales_v2` | `octave-commons/fork_tales_v2` | `Pi/c28c84c/2026-07-27T20-22-00Z-185-g1c28d22` (DRIFT +) | story implementation v2 | newly mirrored submodule; namesake of the feat branch this device branch came from |
| `orgs/octave-commons/promethean` | `octave-commons/promethean` | `pi/eta-mu-kanban-octave-promethean-20260528-13-g2c878b6a56` (DRIFT +) | agent platform | promethean agent system (kanban: 101 cards) |
| `orgs/octave-commons/shibboleth` | `octave-commons/shibboleth` | `Π/2026-03-20/194859-91ea4b8-16-gecde6df` (DRIFT +) | identity/auth | shibboleth auth module (kanban: 21 cards) |
| `orgs/octave-commons/eta-mu-sol` | `octave-commons/eta-mu-sol` | NOT INITIALIZED (DRIFT −) | eta-mu sol variant | registered in `.gitmodules`, absent on disk |
| `orgs/octave-commons/daimoi` | `octave-commons/daimoi` | `pi/eta-mu-kanban-octave-daimoi-20260528-10-ged63571` | domain lib | daimoi core (spec in `kanban/daimoi-core-spec.md`) |
| `orgs/octave-commons/gates-of-aker` | `octave-commons/gates-of-aker` | `v0.0.0-alpha.0-105-g8578d5d` | game/project | aker project (kanban: 163+87+12 cards) |
| `orgs/octave-commons/pantheon` | `octave-commons/pantheon` | `pi/eta-mu-kanban-octave-pantheon-20260528` (DRIFT, listed +) | pantheon services | (kanban: 1 card) |
| `orgs/octave-commons/simulacron` | `octave-commons/simulacron` | `pi/eta-mu-kanban-octave-simulacron-20260528-10-g671614b` | simulation | (kanban: 3 cards) |
| `orgs/open-hax/eta-mu` | `open-hax/eta-mu` | `Π/device/yoga/2026-07-10T232338-1-ge919c7b` (DRIFT +) | agent tooling runtime | eta-mu extensions live in `packages/eta-mu-extensions` (27 kanban cards) |
| `orgs/open-hax/proxx` | `open-hax/proxx` | pointer modified (dirty) | provider routing service | paired with `services/proxx` runtime (126 kanban cards) |
| `orgs/open-hax/openplanner` | `open-hax/openplanner` | pointer modified (dirty) | planner + Knoxx host | Knoxx at `packages/agents/knoxx` |
| `orgs/open-hax/vexx` | `open-hax/vexx` | `pi/fork-tax/20260515-vexx-2bbfabab-13-gc20ed4b` (DRIFT +) | tooling | fork-tax tagged |
| `orgs/riatzukiza/promethean` | `riatzukiza/promethean` | `device/stealth` (declared) | promethean mirror | riatzukiza-side promethean |
| `orgs/riatzukiza/openhax` | `riatzukiza/openhax` | pointer modified (dirty) | openhax mirror | |
| `orgs/riatzukiza/ollama-benchmarks` | `riatzukiza/ollama-benchmarks` | `device/stealth` (declared) | benchmarks | pointer modified (dirty) |
| `orgs/riatzukiza/riatzukiza.github.io` | `riatzukiza/riatzukiza.github.io` | `device/stealth` (declared) | website | pointer modified (dirty) |
| `orgs/riatzukiza/goblin-lessons` | `riatzukiza/goblin-lessons` | `device/stealth` (declared) | content | |
| `orgs/shuv/GitNexus` | `shuv/GitNexus` | pointer modified (dirty) | git tooling | shuv org subtree = 167 repos |
| `orgs/shuv/bridle` / `kapture` | `shuv/...` | pointer modified (dirty) | shuv tooling | |
| `orgs/agustif/codex-linux` | `agustif/codex-linux` | `heads/main` | codex fork | |
| `orgs/open-hax/axxium` | `open-hax/axxium` | `heads/main` | tooling | |
| `orgs/open-hax/commanoxx` | `open-hax/commanoxx` | `feat/ci-automation-1781026507` | command tooling | |
| `orgs/open-hax/depenoxx` | `open-hax/depenoxx` | `remotes/origin/disable-opencode-workflows` | dependency tooling | |
| `.emacs.d` | (emacs config) | `v0.200.0-6663-ga1b98eb7d` | editor | submodule at repo root |
| `.ημ/03_ARTIFACTS/narrative_audio` | (eta-mu artifact) | `pi/fork-tax/20260526T191143Z/...` | audio artifacts | fork-tax tagged artifact dir |

## Drift summary

`git submodule status` reports 6 drifted / uninitialized entries (prefix `-`
or `+`): `eta-mu-sol` (−, missing), `fork_tales_v2`, `promethean`,
`shibboleth` (octave-commons), `eta-mu` (sitting on a **yoga** tag),
`vexx`. This is documented state — do not `git submodule update` to "fix" it
(see AGENTS.md). ~20 more submodule paths show as modified in `git status`
because their HEADs have moved since the last superproject commit.

## Entry format

`| path | repo/remote | branch | role | one-line |`
