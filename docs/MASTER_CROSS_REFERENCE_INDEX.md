# Master cross-reference index

This is the navigation hub for the `/home/err/devel` workspace.

## Workspace shape
- Most repositories live under `orgs/<owner>/<repo>/`.
- Additional repos may live under `services/` and `vaults/`.
- `.gitmodules` is the authoritative list of tracked submodules.

## Primary repositories (common entrypoints)
| Repository | Purpose | Path |
|-----------|---------|------|
| Promethean | core framework + packages | `../orgs/riatzukiza/promethean` |
| Agent Shell | Emacs/ACP integration | `../orgs/riatzukiza/agent-shell` |
| OpenCode | OpenCode sources + docs (local clone; excluded from root git) | `../orgs/anomalyco/opencode` |
| open-hax/codex | OAuth / Codex integration | `../orgs/open-hax/codex` |
| Codex TS SDK | TypeScript SDK patterns | `../orgs/moofone/codex-ts-sdk` |
| OpenAI codex | Rust CLI/runtime | `../orgs/openai/codex` |
| open-hax/openhax | open-hax app workspace | `../orgs/open-hax/openhax` |
| riatzukiza/openhax | full-stack app workspace | `../orgs/riatzukiza/openhax` |
| Workspace proxy | OAuth-backed web/proxy tooling | `../services/open-hax-openai-proxy` |

## Shared tooling that lives in this repo
- **PM2 ecosystem generation**: `../ecosystems/*.cljs` → `../ecosystem.config.cjs` (via `pnpm generate-ecosystem`)
- **Release watch automation**: `../.github/workflows/codex-release-watch.yml` + `../scripts/codex-release-monitor.mjs` + `../.opencode/agents/release-impact.md`

## MCP services (TypeScript, useful)
Most useful MCP servers in this workspace are implemented as Node/TypeScript services under `../services/`:

- `../services/mcp-*` (process/files/exec/github/ollama/etc)
- `../services/openplanner` (OpenPlanner API)
- `../services/open-hax-openai-proxy` (OAuth-backed web/proxy tooling)

## Integration patterns (high signal)
### Authentication / SDK
`open-hax/codex` ↔ `moofone/codex-ts-sdk` ↔ `openai/codex`

### Agent development
`agent-shell` ↔ `promethean`

### Web development
`anomalyco/opencode` ↔ `riatzukiza/openhax`

## Related docs
- **[Repository index](../REPOSITORY_INDEX.md)** (root)
- **[Worktrees + submodules](worktrees-and-submodules.md)**
- **[Docker stacks](docker-stacks.md)**
- **[PR mirroring](pr-mirroring.md)**
