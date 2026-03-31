# Repository index (workspace root)

This workspace is a multi-repo development environment. Most source repos live under `orgs/<owner>/<repo>/`; `services/` increasingly serves as the home for runtime/devops wrappers and operational config.

## Authoritative inventory
- `.gitmodules` (source of truth for tracked submodules)
- `orgs/` (organization-grouped working trees)
- `services/` and `vaults/` (runtime/devops wrappers plus some additional tracked repos)

Useful commands:
```bash
# Show all submodule paths
git config -f .gitmodules --get-regexp '^submodule\..*\.path$'

# Show URLs
git config -f .gitmodules --get-regexp '^submodule\..*\.url$'
```

## Common entrypoints
| Area | Path | Notes |
|------|------|-------|
| Promethean | `orgs/riatzukiza/promethean` | primary framework / workspace tooling |
| Agent Shell | `orgs/riatzukiza/agent-shell` | Emacs/ACP integration |
| OpenCode (upstream/dev) | `orgs/anomalyco/opencode` | OpenCode sources + docs (local clone; excluded from root git) |
| open-hax codex plugin | `orgs/open-hax/codex` | OAuth / Codex integration |
| Codex TS SDK | `orgs/moofone/codex-ts-sdk` | SDK integration patterns |
| OpenAI codex | `orgs/openai/codex` | Rust CLI/runtime |
| open-hax proxy source | `orgs/open-hax/proxx` | canonical proxy source repo |
| open-hax proxy devops | `services/proxx` | compose/config/runtime home for the proxy |
| voxx source | `orgs/open-hax/voxx` | canonical voice gateway source repo |
| voxx devops | `services/voxx` | compose/config/runtime home for voxx |
| OpenPlanner | `services/openplanner` | events + FTS search backend used by session indexer |
| MCP services | `services/mcp-*` | useful TypeScript MCP servers (process/files/exec/github/ollama/etc) |

## Cross references
- **[Master cross-reference index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**
- **[Worktrees + submodules](docs/worktrees-and-submodules.md)**
