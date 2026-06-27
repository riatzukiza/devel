# Submodule CLI

Git submodule management with hierarchical commit workflows.

## OVERVIEW

`src/submodule/` contains the unified `submodule` CLI for managing the workspace's git submodules.

## WHERE TO LOOK

| File | Purpose |
|------|---------|
| `smart-commit.ts` | AI-assisted hierarchical commits across submodules |

## COMMANDS

```bash
# Sync .gitmodules mappings and initialize
submodule sync

# Fetch remote refs, update to latest
submodule update

# Show pinned commits + dirty worktrees
submodule status

# Smart commit with AI explanation
submodule smart commit "message" [--dry-run]
```

## SMART COMMIT

**Algorithm**:
1. Breadth-first traversal of submodule hierarchy
2. Depth grouping for bottom-up processing
3. Interactive prompt: "Why were these changes made?"
4. Pantheon AI generates context-aware messages
5. Commits deepest first, aggregates upward

**Options**:
- `--dry-run`: Preview without committing
- `--recursive`: Include nested submodules

## PATTERNS

```bash
# Standard workflow
submodule sync          # Sync mappings
submodule update        # Update to latest
submodule smart commit "prepare release"

# Inspect before committing
submodule status
submodule smart commit "fix" --dry-run
```

## GOTCHAS

- Nested submodules exist in `orgs/riatzukiza/promethean/**`
- `--recursive` required for deep submodule trees
- Pantheon integration requires local LLM endpoint
