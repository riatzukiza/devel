# Giga - Workspace Automation

Nx-powered automation for multi-submodule workspace management.

## OVERVIEW

`src/giga/` contains tools for:
- **giga-watch.ts**: File watcher triggering affected builds/tests
- **commit-propagator.ts**: Commit/tag propagation across submodule hierarchy
- **run-submodule.ts**: Execute package.json scripts or Nx targets in submodules
- **generate-nx-projects.ts**: Create Nx virtual projects for each submodule
- **pantheon.ts**: AI-assisted commit message generation

## WHERE TO LOOK

| File | Purpose |
|------|---------|
| `giga-watch.ts` | Watch for file changes, run affected tests/builds |
| `commit-propagator.ts` | Propagate commits/tags upward through submodule tree |
| `run-submodule.ts` | Execute commands in specific submodules |
| `generate-nx-projects.ts` | Generate Nx project graph from `.gitmodules` |

## PATTERNS

```bash
# Watch and run affected
bun run src/giga/giga-watch.ts

# Run test in specific submodule
bun run src/giga/run-submodule.ts "orgs/riatzukiza/promethean" test

# Propagate commits
# See submodule smart-commit (uses pantheon AI)
```

## Nx INTEGRATION

- Virtual Nx projects created per submodule
- Affected detection spans all `orgs/**` submodules
- Targets: `test`, `build`, `lint` from submodule package.json

## CONVENTIONS

- Output format: JSON for machine parsing
- Error handling: Propagate submodule errors with context
- Pantheon integration: AI commit messages via local LLM
