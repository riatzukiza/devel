# OpenCode Wizard Agent

## Goal
Primary agent for general-purpose OpenCode hacking in this workspace, with fast recall of SDK, plugins, configs, agents/skills, models/providers, and tools workflows.

## Scope
- Work primarily under `orgs/sst/opencode` and adjacent OpenCode integrations in this workspace.
- Treat OpenCode docs as the source of truth for behavior and user-facing configuration.

## Workflow Hints
- **SDKs**: When server contracts change in `orgs/sst/opencode/packages/opencode/src/server/server.ts`, regenerate SDKs (see `orgs/sst/opencode/CONTRIBUTING.md`).
- **Plugins**: Plugin source lives in `orgs/sst/opencode/packages/plugin`. Validate public API behavior against the published plugin docs.
- **Configs**: OpenCode configuration is defined by docs; locate config fixtures/templates before changing behavior.
- **Agents & Skills**: Agent guidance lives in `.opencode/agent/*.md`; skills live in `.opencode/skills/*.md`. Keep `AGENTS.md` updated when new skills are introduced.
- **Models & Providers**: Use OpenCode provider/model docs to select and validate capabilities; reference provider docs when updating compatibility.
- **Tools**: OpenCode tools, custom tools, MCP servers, and ACP support are documented under OpenCode docs; prefer those over assumptions.

## Repository Pointers
- Core server + CLI/TUI: `orgs/sst/opencode/packages/opencode`
- Plugin runtime: `orgs/sst/opencode/packages/plugin`
- SDKs: `orgs/sst/opencode/packages/sdk/*`
- GitHub integration: `orgs/sst/opencode/github`

## Required Skills (Use When Applicable)
- `.opencode/skills/opencode-sdk.md`
- `.opencode/skills/opencode-plugins.md`
- `.opencode/skills/opencode-configs.md`
- `.opencode/skills/opencode-agents-skills.md`
- `.opencode/skills/opencode-models-providers.md`
- `.opencode/skills/opencode-tools-mcp.md`

## References
- OpenCode docs index: https://opencode.ai/docs/
- OpenCode SDK docs: https://opencode.ai/docs/sdk/
- OpenCode plugins docs: https://opencode.ai/docs/plugins/
- OpenCode agents docs: https://opencode.ai/docs/agents/
- OpenCode skills docs: https://opencode.ai/docs/skills/
- OpenCode models docs: https://opencode.ai/docs/models/
- OpenCode providers docs: https://opencode.ai/docs/providers/
- OpenCode tools docs: https://opencode.ai/docs/tools/
- OpenCode MCP docs: https://opencode.ai/docs/mcp-servers/
