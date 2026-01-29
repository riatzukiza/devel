# Agent: Submodule Giga System

## Goal
Automate Giga system operations: watch for changes, run affected tests/builds, and propagate submodule pointer updates across the workspace hierarchy.

## Scope
- Work with `src/giga/` scripts and workspace automation under `orgs/**`
- Manage watch cycles, affected test execution, and commit propagation
- Coordinate with Pantheon for AI-generated commit messages

## Workflow Hints
- **Giga Watch**: `bun run src/giga/giga-watch.ts` watches `orgs/**` for changes and runs affected tests/builds automatically
- **Run Submodule**: `bun run src/giga/run-submodule.ts <subPath> <target>` runs test/build/typecheck/lint in a specific submodule
- **Commit Propagator**: `bun run src/giga/commit-propagator.ts` commits submodule changes and propagates to parent repos
- **Pantheon**: Use `PANTHEON_CLI` environment variable for AI commit message generation
- **NX Integration**: Use `giga:nx:generate` to create Nx virtual projects for submodules

## Repository Pointers
- Giga scripts: `src/giga/`
- Giga Nx plugin: `tools/nx-plugins/giga/`
- Submodule scripts: `src/submodule/smart-commit.ts`

## Required Skills (Use When Applicable)
- `.opencode/skills/submodule-ops.md`
- `.opencode/skills/giga-workflow.md`
- `.opencode/skills/github-integration.md`

## References
- Giga system documentation in workspace `AGENTS.md`
- Pantheon commit message generator: `src/giga/pantheon.ts`
- Commit propagator: `src/giga/commit-propagator.ts`
- Giga watch: `src/giga/giga-watch.ts`

## Common Workflows

### Watch for Changes and Run Tests
```bash
# Start Giga watch (automatically runs affected tests)
bun run src/giga/giga-watch.ts
```

### Run Target in Single Submodule
```bash
# Test a submodule
bun run src/giga/run-submodule.ts orgs/riatzukiza/promethean test

# Build a submodule
bun run src/giga/run-submodule.ts orgs/sst/opencode build

# Typecheck a submodule
bun run src/giga/run-submodule.ts orgs/bhauman/clojure-mcp typecheck

# Lint a submodule
bun run src/giga/run-submodule.ts orgs/moofone/codex-ts-sdk lint
```

### Propagate Submodule Changes
```bash
# Commit submodule changes and propagate to parent repos
bun run src/giga/commit-propagator.ts

# Use custom Pantheon CLI for commit messages
PANTHEON_CLI="pantheon-cli" bun run src/giga/commit-propagator.ts
```

### Use Pantheon for Commit Messages
```bash
# Generate commit message with AI
PANTHEON_CLI="pantheon" bun run src/giga/pantheon.ts "watch-test" "success" "orgs/riatzukiza/promethean" "v1.0.0"
```

## Important Constraints
- **Bun.watch**: Giga watch requires `Bun.watch` (unavailable on some platforms) - falls back to manual mode
- **Parallel Jobs**: Use `SUBMODULE_JOBS=<n>` to control parallel execution (default: 8)
- **Affected Tests**: When using Giga watch with Nx, prefers `nx affected --target=test` before `build`
- **Dry-run Mode**: Pantheon supports dry-run for previewing changes without committing
- **Dirty Snapshot**: When workspace gets chaotic, capture everything on `dirty/stealth` branch

## Error Handling
- **Stashed Changes**: Script handles local stashes during branch sync operations
- **Missing Targets**: Gracefully skips repos without requested target scripts
- **No Changes**: Commits submodule pointer updates even without local changes
- **Network Issues**: Mirroring operations handle GitHub API errors gracefully
