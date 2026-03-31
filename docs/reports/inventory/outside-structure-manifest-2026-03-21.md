# Outside-structure work manifest — 2026-03-21

## Scope
- Manifest of project-like work that currently lives outside the active placement structure:
  - `packages/*`
  - `services/*`
  - `orgs/riatzukiza/*`
  - `orgs/octave-commons/*`
  - `orgs/open-hax/*`
  - `orgs/ussyverse/*`

Special case: `orgs/octave-commons/promethean is a corpus of living documentation, not a normal product repo`

Machine-readable companion artifact:
- `docs/reports/inventory/outside-structure-manifest-2026-03-21.json`

## Summary counts
- topLevelAliases: **2**
- topLevelStandaloneRoots: **7**
- rootLevelVendorOrForkRepos: **6**
- foreignOrgRepos: **9**
- aggregationTrees: **3**

## Top-level aliases outside the structure

| Path | Resolves to | Suggested handling | Notes |
|---|---|---|---|
| `desktop` | `orgs/riatzukiza/desktop` | document-or-retire-alias | This path resolves into an allowed structured home under orgs/riatzukiza.; It is outside the active placement structure by path, but not by canonical target. |
| `promethean` | `orgs/riatzukiza/promethean` | document-or-retire-alias | This path resolves into an allowed structured home under orgs/riatzukiza.; It is outside the active placement structure by path, but not by canonical target. |

## Top-level standalone roots outside the structure

| Path | Origin | Signals | Suggested handling |
|---|---|---|---|
| `pm2-clj-project` | `git@github.com:riatzukiza/devel.git` | package.json | classify-or-explicit-exception |
| `reconstitute` | `git@github.com:riatzukiza/devel.git` | package.json | classify-or-explicit-exception |
| `reconstitute-mcp` | `git@github.com:riatzukiza/devel.git` | package.json | classify-or-explicit-exception |
| `mcp-social-publisher-live` | `https://github.com/riatzukiza/mcp-social-publisher` | package.json, README | classify-or-explicit-exception |
| `threat-radar-deploy` | `https://github.com/riatzukiza/threat-radar.git` | package.json | classify-or-explicit-exception |
| `verathar-server` | `https://github.com/riatzukiza/verathar-server.git` | Cargo.toml, README | classify-or-explicit-exception |
| `threat-radar-next-step` | `git@github.com:riatzukiza/devel.git` | README | classify-or-explicit-exception |

## Root-level vendor / fork / special checkouts

| Path | Origin | Suggested handling | Notes |
|---|---|---|---|
| `bevy_replicon` | `https://github.com/riatzukiza/bevy_replicon.git` | foreign-fork-exception-or-relocate | Top-level fork/vendor repo outside packages/services/orgs placement paths. |
| `egregoria` | `https://github.com/riatzukiza/Egregoria.git` | foreign-fork-exception-or-relocate | Top-level fork/vendor repo outside packages/services/orgs placement paths. |
| `game_network` | `https://github.com/riatzukiza/game_network.git` | foreign-fork-exception-or-relocate | Top-level fork/vendor repo outside packages/services/orgs placement paths. |
| `ggrs` | `https://github.com/riatzukiza/ggrs.git` | foreign-fork-exception-or-relocate | Top-level fork/vendor repo outside packages/services/orgs placement paths. |
| `lightyear` | `https://github.com/riatzukiza/lightyear.git` | foreign-fork-exception-or-relocate | Top-level fork/vendor repo outside packages/services/orgs placement paths. |
| `gates-pr35-hardening-main` | `git@github.com:octave-commons/gates-of-aker.git` | worktree-exception-or-retire | Special-purpose checkout/worktree for a gates-of-aker hardening branch outside the active placement structure. |

## Foreign org repos outside the four-home model

| Path | Origin | Suggested handling |
|---|---|---|
| `orgs/agustif/codex-linux` | `https://github.com/riatzukiza/codex-linux.git` | explicit-foreign-fork-exception |
| `orgs/anomalyco/opencode` | `https://github.com/riatzukiza/opencode.git` | explicit-foreign-fork-exception |
| `orgs/badlogic/pi-mono` | `https://github.com/riatzukiza/pi-mono.git` | explicit-foreign-fork-exception |
| `orgs/kcrommett/oc-manager` | `https://github.com/riatzukiza/oc-manager.git` | explicit-foreign-fork-exception |
| `orgs/moofone/codex-ts-sdk` | `https://github.com/riatzukiza/codex-ts-sdk.git` | explicit-foreign-fork-exception |
| `orgs/openai/codex` | `https://github.com/riatzukiza/codex.git` | explicit-foreign-fork-exception |
| `orgs/openai/parameter-golf` | `https://github.com/riatzukiza/parameter-golf.git` | explicit-foreign-fork-exception |
| `orgs/shuv/codex-desktop-linux` | `https://github.com/riatzukiza/codex-desktop-linux.git` | explicit-foreign-fork-exception |
| `orgs/private/snorkel-ai` | `git@github.com:riatzukiza/devel.git` | classify-private-exception |

## Aggregation trees outside the structure

### `projects`
- child count: **196**
- suggested handling: **explicit-generated-or-staging-exception**
- This tree contains project-like work outside the active placement structure.
- It looks more like an aggregation, staging, or generated projection area than a canonical project home.
- sample children:
  - `projects/emacs-d`
  - `projects/giga`
  - `projects/orgs-bhauman-clojure-mcp`
  - `projects/orgs-kcrommett-oc-manager`
  - `projects/orgs-moazbuilds`
  - `projects/orgs-moofone-codex-ts-sdk`
  - `projects/orgs-octave-commons-gates-of-aker`
  - `projects/orgs-octave-commons-helm`
  - `projects/orgs-octave-commons-lineara-conversation-export`
  - `projects/orgs-octave-commons-pantheon`
  - `projects/orgs-octave-commons-promethean`
  - `projects/orgs-octave-commons-promethean-agent-system`
  - `projects/orgs-octave-commons-promethean-cli-apply-patch`
  - `projects/orgs-octave-commons-promethean-cli-compiler`
  - `projects/orgs-octave-commons-promethean-cli-ecosystem-dsl`
  - `projects/orgs-octave-commons-promethean-cli-kanban`
  - `projects/orgs-octave-commons-promethean-cli-obsidian-export`
  - `projects/orgs-octave-commons-promethean-cli-promethean`
  - `projects/orgs-octave-commons-promethean-experimental-agent-os-protocol`
  - `projects/orgs-octave-commons-promethean-experimental-ai-learning`

### `workspaces`
- child count: **1**
- suggested handling: **explicit-generated-or-staging-exception**
- This tree contains project-like work outside the active placement structure.
- It looks more like an aggregation, staging, or generated projection area than a canonical project home.
- sample children:
  - `workspaces/openhax-codex`

### `vaults`
- child count: **1**
- suggested handling: **explicit-generated-or-staging-exception**
- This tree contains project-like work outside the active placement structure.
- It looks more like an aggregation, staging, or generated projection area than a canonical project home.
- sample children:
  - `vaults/static_man`

## Interpretation
- Some outside-structure paths are **benign aliases** into allowed homes (`desktop`, `promethean`).
- Some are **standalone project roots** that need explicit placement or exception decisions (`mcp-social-publisher-live`, `threat-radar-deploy`, `verathar-server`, etc.).
- Some are **foreign forks / mirrors** that need an explicit exception policy rather than forced relocation into the four-home model.
- Some are **aggregation or staging trees** (`projects`, `workspaces`, `vaults`) that likely need a named exception class in the contract if they are meant to persist.
