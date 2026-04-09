# Machine Migration Manifest

**Source:** devel @ `staging` → `8accf8c`
**Tag:** `Π/2026-04-08/184500-bc9b4ea`
**Date:** 2026-04-08

## Quick Restore

```bash
git clone git@github.com:riatzukiza/devel.git
cd devel
git checkout staging
git submodule update --init
```

## Submodules on Non-Default Branches

These submodules are checked out on branches other than `main`. After `git submodule update --init`, switch them:

| Submodule | Branch | Remote |
|---|---|---|
| `orgs/open-hax/uxx` | `feat/merge-proxy-console-theme` | origin (open-hax) |
| `orgs/open-hax/proxx` | `fix/glm-model-routing-and-session-stickiness` | origin (open-hax) |
| `orgs/open-hax/cljs-plugin-template` | `temp-merge` | origin (open-hax) |
| `orgs/open-hax/voxx` | `chore/checkpoint-voxx` | origin (open-hax) |
| `orgs/octave-commons/lineara_conversation_export` | `device/stealth` | ⚠️ NO remote tracking |
| `orgs/octave-commons/mythloom` | `main` | ⚠️ NO remote tracking |
| `orgs/riatzukiza/ollama-benchmarks` | `device/stealth` | origin (riatzukiza) |
| `orgs/octave-commons/promethean-agent-system` | `device/stealth` | origin (octave-commons) |

## Fork-Tax Preservation Branches

These branches exist specifically to preserve work that couldn't merge to protected branches:

| Repo | Branch | Why |
|---|---|---|
| `mcp-social-publisher-live` | `fork-tax/20260408-machine-migration` | main protected |
| `orgs/octave-commons/gates-of-aker` | `fork-tax/20260408-machine-migration` | main non-ff behind |
| `threat-radar-deploy` | `fork-tax/20260408-machine-migration` | main protected |
| `bevy_replicon` | `fork-tax/20260408-machine-migration` | main diverged |

## Fork Remotes (Not in .gitmodules)

| Submodule | Fork Remote | Why |
|---|---|---|
| `orgs/openai/codex` | `https://github.com/riatzukiza/codex.git` | riatzukiza fork of openai/codex |

To restore codex fork remote:
```bash
cd orgs/openai/codex
git remote add fork https://github.com/riatzukiza/codex.git
```

## Preserved Stashes

These stashes exist in submodules and were NOT absorbed:

| Location | Stash | Description |
|---|---|---|
| ROOT | `stash@{0}` | WIP on staging: v4.1 uncertainty ranges |
| `orgs/open-hax/proxx` | `stash@{0}` | docs/usage-modes-and-versioning: wip bridge changes |
| `orgs/open-hax/proxx` | `stash@{1}` | tmp/pr154-updated: pre-merge-test-fixes |
| `orgs/open-hax/proxx` | `stash@{2}` | staging: federation-audit-witness-fix |
| `orgs/octave-commons/gates-of-aker` | `stash@{0}` | fix/colony-regression-hardening: temp before pr139 merge fix |
| `orgs/octave-commons/gates-of-aker` | `stash@{1}` | hacks: auto stash before merge |

## Residuals (Not Committed)

| Item | Reason |
|---|---|
| `orgs/open-hax/openplanner` nested sub-submodules | Deep recursion: packages/eros-eris-field, packages/graph-weaver, packages/myrmex, packages/vexx |
| `orgs/open-hax/workbench` shadow-cljs cache | Build artifacts only |
| `orgs/octave-commons/fork_tales` LaTeX artifacts | Regenerable from source |
| `orgs/octave-commons/shibboleth` LaTeX artifacts | Regenerable from source |

## Not Initialized (53 submodules)

These were not locally checked out and can be restored with `git submodule update --init <path>`:

`.emacs.d`, `gates-pr35-hardening-main`, `orgs/agustif/codex-linux`, `orgs/anomalyco/opencode`, `orgs/badlogic/pi-mono`, `orgs/kcrommett/oc-manager`, `orgs/moofone/codex-ts-sdk`, `orgs/octave-commons/daimoi`, `orgs/octave-commons/graph-runtime`, `orgs/octave-commons/graph-weaver-aco` (pointer-only), `orgs/octave-commons/simulacron`, `orgs/octave-commons/myrmex` (pointer-only), `orgs/octave-commons/helm`, `orgs/octave-commons/pantheon`, `orgs/octave-commons/promethean` (pointer-only), `orgs/open-hax/agent-actors`, `orgs/open-hax/clients`, `orgs/open-hax/codex`, `orgs/open-hax/museeks`, `orgs/open-hax/opencode-skills`, `orgs/open-hax/openhax`, `orgs/open-hax/plugins/codex`, `orgs/open-hax/privaxxy`, `orgs/open-hax/tooloxx/services/hormuz-clock-mcp`, `orgs/shuv/codex-desktop-linux`, `orgs/shuv/our-gpus` (pointer-only), `orgs/shuv/shuvcrawl` (pointer-only), `orgs/ussyverse/kanban`, `orgs/ussyverse/openclawssy`, `orgs/ussyverse/routussy` (pointer-only), `orgs/riatzukiza/agent-shell`, `orgs/riatzukiza/book-of-shadows`, `orgs/riatzukiza/desktop`, `orgs/riatzukiza/dotfiles`, `orgs/riatzukiza/goblin-lessons`, `orgs/riatzukiza/openhax`, `orgs/riatzukiza/promethean`, `orgs/riatzukiza/riatzukiza.github.io`, `orgs/riatzukiza/stt`, `orgs/openai/parameter-golf`, `vaults/static_man`, `threat-radar-deploy` (on fork-tax branch)

## Diverged from Remote (Not Force-Pushed)

| Repo | Status |
|---|---|
| `ggrs` | Local behind remote (main) |
| `lightyear` | Local behind remote (main) |