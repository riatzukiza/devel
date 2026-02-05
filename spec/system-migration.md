---
uuid: 2a35e8c0-c1e8-4390-accb-71d5086c977a
title: spec/system-migration.md
slug: system-migration
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.409448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# spec/system-migration.md

## Objective
- Move the existing configuration-centric `orgs/riatzukiza/promethean/system` tree into `/system` at the workspace root.
- Expose `@promethean-os/ecosystem-dsl` from the root `devel` workspace so it can operate against the newly located `/system/daemons` folder.

## Requirements
1. Relocate the `README.md`, `markdown-dsl.md`, and the `daemons/{devops,mcp,services}` tree from `orgs/riatzukiza/promethean/system` into `/system` without losing their current contents or README/DSL metadata.
2. Preserve the older `/system/daemon` configuration (e.g., `unified-indexer.edn`, `daemon/mcp/serena.edn`) by archiving it under `/system/legacy` so nothing is accidentally discarded.
3. Update runtime references to `system/daemons` so that commands executed from inside `orgs/riatzukiza/promethean` now point to the root-level `/system/daemons` path (e.g., `package.json` scripts, `packages/heartbeat` helpers).
4. Ensure the root `package.json` can invoke `@promethean-os/ecosystem-dsl` by declaring the package (via the local path `orgs/riatzukiza/promethean/packages/ecosystem-dsl`) and exposing at least one script that runs the DSL against `/system/daemons`.
5. Keep the DSL grammar documentation (markdown DSL spec) and README adjacent to the migrated `system` tree so the structure remains understandable.

## Code references
- `orgs/riatzukiza/promethean/system/README.md:1-32` defines the unit/daemon concepts that must travel with the tree.
- `orgs/riatzukiza/promethean/system/markdown-dsl.md:1-94` spells out the Markdown grammar that the root `system/` files will continue to follow.
- `orgs/riatzukiza/promethean/system/daemons/services/unified-indexer.edn:1-30` is one of the core generated configs we replicate at root.
- `system/daemon/unified-indexer.edn:1-28` and `system/daemon/mcp/serena.edn` describe the legacy configuration that should be archived under `/system/legacy` rather than discarded.
- `orgs/riatzukiza/promethean/package.json:76` (`gen:ecosystem`) will have to be adjusted to use the new `../../../system/daemons` path.
- `orgs/riatzukiza/promethean/packages/heartbeat/index.js:69`, `/packages/heartbeat/index.ts:109`, and `packages/heartbeat/README.md:22` currently resolve `system/daemons` relative to the package and will need the new root path.
- `orgs/riatzukiza/promethean/packages/ecosystem-dsl/package.json:1-52` explains the CLI scripts we can expose through the root workspace.
- `orgs/riatzukiza/promethean/packages/ecosystem-dsl/README.md:71-116` documents how to run `ecosystem-dsl` against a `system/` directory, so the new root scripts should mirror those flags.

## Issues / PRs
- No open issue or pull request currently tracks this migration; the closest references are documentation notes about `system/daemons` (`CLAUDE.md`, `README.md`, changelog fragments) which will now be updated by referencing the new root path.

## Definition of done
- `/system` at the workspace root contains the README, Markdown DSL spec, and the entire `daemons/{devops,mcp,services}` tree from `orgs/riatzukiza/promethean/system`.
- The old `/system/daemon` directory is moved to `/system/legacy` so those configurations are still accessible.
- Scripts inside `orgs/riatzukiza/promethean` that previously targeted `./system/daemons` now point to the root-level `../../../system/daemons` (or equivalent) and continue to produce the generated ecosystem config.
- The root `package.json` declares `@promethean-os/ecosystem-dsl` via the local path, and there is at least one `ecosystem:*` script that invokes the DSL against `/system/daemons`.
- Documentation and README references still describe the DSL (Markdown grammar and generation commands) without losing the context of the new `system/` location.
