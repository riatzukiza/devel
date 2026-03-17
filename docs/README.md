# Workspace documentation

This `docs/` folder contains workspace-level notes, reports, and reference material for `/home/err/devel`.

## Start here
- **[Master cross-reference index](MASTER_CROSS_REFERENCE_INDEX.md)** – navigation hub for the multi-repo workspace
- **[Docker stacks](docker-stacks.md)** – curated `pnpm docker:stack ...` commands and registered stack names
- **[Worktrees + submodules](worktrees-and-submodules.md)** – policies and troubleshooting
- **[Git submodules remote-URL reference](git-submodules-documentation.md)** – submodule remote URLs and cross-links
- **[Submodule CLI migration](SUBMODULE_CLI_MIGRATION.md)** – notes on migrating legacy scripts to the `submodule` CLI

## Automation docs
- **[PR mirroring](pr-mirroring.md)** / **[PR mirroring automation](pr-mirroring-automation.md)**

## Notes
- `docs/notes/` is a scratchpad area; treat it as semi-structured.
- `.opencode/` contains OpenCode configuration (agents/skills/commands); it is **not** managed from `docs/`.

## MCP services
Most MCP servers you actually run live under `services/` (TypeScript/Node). The older centralized Clojure MCP launcher has been removed.
