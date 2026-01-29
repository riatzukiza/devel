# Promethean OS module registry spec

## Scope
Target repository: `/home/err/devel/promethean`

## Intent
Reframe Promethean as an OS-level orchestrator and document modules as OS components (kernel, services, tools, libraries, pipelines), with migration guidance toward Clojure-first infrastructure.

## Requirements
1. Build a module registry covering all workspace roots in `pnpm-workspace.yaml`.
2. Classify each module by type: kernel/glue, service, library, pipeline, CLI, tool, experimental, legacy.
3. Capture key interfaces for each module (CLI, HTTP, stdio, config files, shared packages).
4. Mark consolidation targets (duplicate MCP stacks, overlapping tooling, deprecated paths).
5. Provide migration notes toward Clojure-first implementations where applicable.

## Inputs
- `pnpm-workspace.yaml` for workspace boundaries.
- `nx.json` for project layout/targets.
- Root `package.json` scripts for orchestration layer.
- `README.md` for declared system goals.
- `services/mcp/` and `docs/design/pantheon/` for MCP and agent OS design history.

## Module registry (draft structure)
Each entry should include:
- `name`
- `path`
- `category`
- `runtime` (Clojure, TypeScript/Node, mixed)
- `interfaces` (CLI/HTTP/stdio/config/etc.)
- `dependencies` (workspace packages or external services)
- `role` (OS kernel/glue vs capability library)
- `status` (core, active, experimental, legacy)
- `migration_notes` (Clojure consolidation target or leave as adapter)

## Module registry (initial pass)
Notes:
- `runtime` and `interfaces` are inferred from package scripts and bin flags; verify before acting on them.
- Stryker temp directories, worktrees, and test-docs are excluded.

| name | path | category | runtime | interfaces | status |
| --- | --- | --- | --- | --- | --- |
| .opencode | .opencode | .opencode | node/ts | lib | active |
| @promethean-os/apply-patch | cli/apply-patch | cli | node/ts | build | active |
| @promethean-os/compiler | cli/compiler | cli | node/ts | build | active |
| @promethean-os/docs-cli | cli/docs | cli | node/ts | build | active |
| @promethean-os/ecosystem-dsl | cli/ecosystem-dsl | cli | node/ts | build | active |
| @promethean-os/kanban | cli/kanban | cli | node/ts | build+cli+service | active |
| @promethean-os/kanban-plugin-content | cli/kanban/packages/kanban-plugin-content | cli | node/ts | build | active |
| @promethean-os/kanban-plugin-git-index | cli/kanban/packages/kanban-plugin-git-index | cli | node/ts | build | active |
| @promethean-os/kanban-plugin-heal | cli/kanban/packages/kanban-plugin-heal | cli | node/ts | build | active |
| @promethean-os/kanban-sdk | cli/kanban/packages/kanban-sdk | cli | node/ts | build | active |
| @promethean-os/kanban-transition-rules | cli/kanban/packages/kanban-transition-rules | cli | node/ts | build | active |
| @promethean/obsidian-export | cli/obsidian-export | cli | node/ts | build | active |
| @promethean-os/ai-learning | experimental/ai-learning | experimental | node/ts | build+service | experimental |
| @promethean-os/auth-service | experimental/auth-service | experimental | node/ts | build+service | experimental |
| @promethean-os/cephalon | experimental/cephalon | experimental | node/ts | build+service | experimental |
| @promethean-os/compliance-monitor | experimental/compliance-monitor | experimental | node/ts | build+service | experimental |
| @promethean-os/docs-system | experimental/docs-system | experimental | node/ts | build+cli+service | experimental |
| @promethean-os/eidolon-field | experimental/eidolon-field | experimental | node/ts | service | experimental |
| @promethean-os/embedding-cache | experimental/embedding-cache | experimental | node/ts | build | experimental |
| @promethean-os/enso-agent-communication | experimental/enso-agent-communication | experimental | node/ts | build+service | experimental |
| @promethean-os/enso-browser-gateway | experimental/enso-browser-gateway | experimental | node/ts | service | experimental |
| @promethean-os/enso-protocol | experimental/enso-protocol | experimental | node/ts | build+service | experimental |
| heartbeat-service | experimental/heartbeat | experimental | node/ts | service | experimental |
| @promethean-os/llm | experimental/llm | experimental | node/ts | build | experimental |
| @promethean-os/omni-tools | experimental/omni-tools | experimental | mixed | build+cli+service | experimental |
| @promethean-os/pantheon | experimental/pantheon | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-coordination | experimental/pantheon/packages/coordination | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-core | experimental/pantheon/packages/core | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-ecs | experimental/pantheon/packages/ecs | experimental | node/ts | build | experimental |
| @promethean-os/pantheon-generator | experimental/pantheon/packages/generator | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-llm-claude | experimental/pantheon/packages/llm-claude | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-llm-openai | experimental/pantheon/packages/llm-openai | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-mcp | experimental/pantheon/packages/mcp | experimental | node/ts | build | experimental |
| @promethean-os/pantheon-orchestrator | experimental/pantheon/packages/orchestrator | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-persistence | experimental/pantheon/packages/persistence | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-protocol | experimental/pantheon/packages/protocol | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-state | experimental/pantheon/packages/state | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-ui | experimental/pantheon/packages/ui | experimental | node/ts | build+service | experimental |
| @promethean-os/pantheon-workflow | experimental/pantheon/packages/workflow | experimental | node/ts | build | experimental |
| @promethean-os/pipeline-automation | experimental/pipeline-automation | experimental | node/ts | build+service | experimental |
| @promethean-os/plugin-hooks | experimental/plugin-hooks | experimental | node/ts | build | experimental |
| @promethean-os/scar | experimental/scar | experimental | node/ts | build+service | experimental |
| @promethean-os/voice-service | experimental/voice | experimental | node/ts | build | experimental |
| @promethean-os/benchmark | packages/benchmark | packages | node/ts | build | active |
| @promethean-os/broker | packages/broker | packages | node/ts | build | active |
| @promethean-os/discord | packages/discord | packages | node/ts | build | active |
| @promethean-os/ds | packages/ds | packages | node/ts | build | active |
| @promethean-os/duck-audio | packages/duck-audio | packages | node/ts | build | active |
| @promethean-os/effects | packages/effects | packages | node/ts | build | active |
| @promethean-os/embedding | packages/embedding | packages | node/ts | build | active |
| @promethean-os/event | packages/event | packages | node/ts | build | active |
| @promethean-os/file-indexer | packages/file-indexer | packages | node/ts | build | active |
| @promethean-os/frontend | packages/frontend | packages | mixed | build+service | active |
| @promethean-os/fs | packages/fs | packages | node/ts | build | active |
| @promethean-os/fsm | packages/fsm | packages | node/ts | build | active |
| @promethean-os/github-sync | packages/github-sync | packages | node/ts | build | active |
| @promethean-os/http | packages/http | packages | node/ts | build | active |
| @promethean-os/legacy | packages/legacy | packages | node/ts | build | legacy |
| @promethean-os/level-cache | packages/level-cache | packages | node/ts | build | active |
| @promethean-os/lmdb-cache | packages/lmdb-cache | packages | node/ts | build | active |
| @promethean-os/logger | packages/logger | packages | node/ts | build+service | active |
| @promethean-os/markdown | packages/markdown | packages | node/ts | build | active |
| @promethean-os/math-utils | packages/math-utils | packages | node/ts | build+service | active |
| @promethean-os/messaging | packages/messaging | packages | node/ts | build | active |
| @promethean-os/migrations | packages/migrations | packages | node/ts | build | active |
| @promethean-os/ollama-queue | packages/ollama-queue | packages | node/ts | build | active |
| @promethean-os/pantheon-ecs | packages/pantheon-ecs | packages | node/ts | build | active |
| @promethean-os/persistence | packages/persistence | packages | node/ts | build | active |
| @promethean-os/platform | packages/platform | packages | node/ts | build | active |
| @promethean-os/pm2-helpers | packages/pm2-helpers | packages | node/ts | build | active |
| @promethean-os/providers | packages/providers | packages | node/ts | build | active |
| @promethean-os/report-forge | packages/report-forge | packages | node/ts | build+cli+service | active |
| @promethean-os/security | packages/security | packages | node/ts | build | active |
| @promethean-os/test-utils | packages/test-utils | packages | node/ts | build | active |
| @promethean-os/trello | packages/trello | packages | node/ts | build+service | active |
| @promethean-os/utils | packages/utils | packages | node/ts | build | active |
| @promethean-os/boardrev | pipelines/boardrev | pipelines | node/ts | build+cli | active |
| @promethean-os/buildfix | pipelines/buildfix | pipelines | node/ts | build+cli | active |
| @promethean-os/codemods | pipelines/codemods | pipelines | node/ts | build+cli | active |
| @promethean-os/codepack | pipelines/codepack | pipelines | node/ts | build | active |
| @promethean-os/cookbookflow | pipelines/cookbookflow | pipelines | node/ts | build+cli | active |
| @promethean-os/pipeline-core | pipelines/core | pipelines | node/ts | build | active |
| @promethean-os/docops | pipelines/docops | pipelines | node/ts | build+cli | active |
| @promethean-os/lint-taskgen | pipelines/lint-taskgen | pipelines | node/ts | build+cli+service | active |
| @promethean-os/piper | pipelines/piper | pipelines | node/ts | build+cli+service | active |
| @promethean-os/readmeflow | pipelines/readmeflow | pipelines | node/ts | build+cli | active |
| @promethean-os/semverguard | pipelines/semverguard | pipelines | node/ts | build+cli | active |
| @promethean-os/simtasks | pipelines/simtask | pipelines | node/ts | build+cli | active |
| @promethean-os/sonarflow | pipelines/sonarflow | pipelines | node/ts | build+cli | active |
| @promethean-os/symdocs | pipelines/symdocs | pipelines | node/ts | build+cli | active |
| @promethean-os/testgap | pipelines/testgap | pipelines | node/ts | build+cli | active |
| promethean | . | root | mixed | build+cli+service | active |
| @promethean/auto-run-scripts | scripts | scripts | node/ts | lib | active |
| @promethean-os/autocommit | services/autocommit | services | node/ts | build+cli+service | active |
| @promethean-os/file-indexer-service | services/file-indexer-service | services | node/ts | build | active |
| @promethean-os/frontend-service | services/frontend-service | services | node/ts | build+service | active |
| @promethean-os/knowledge-graph | services/knowledge-graph | services | node/ts | build+service | active |
| @promethean-os/knowledge-graph-domain | services/knowledge-graph/packages/knowledge-graph-domain | services | node/ts | build | active |
| @promethean-os/knowledge-graph-simulation | services/knowledge-graph/packages/knowledge-graph-simulation | services | node/ts | build | active |
| @promethean-os/knowledge-graph-storage | services/knowledge-graph/packages/knowledge-graph-storage | services | node/ts | build | active |
| @promethean-os/knowledge-graph-ui | services/knowledge-graph/packages/knowledge-graph-ui | services | node/ts | build+service | active |
| @promethean-os/mcp | services/mcp | services | node/ts | build+service | active |
| @promethean-os/mcp-dev-ui-frontend | services/mcp-dev-ui-frontend | services | node/ts | build+service | active |
| @promethean-os/mcp-express-server | services/mcp-express-server | services | node/ts | build+service | active |
| @promethean-os/mcp-kanban-bridge | services/mcp-kanban-bridge | services | node/ts | build+cli+service | active |
| @promethean-os/openai-server | services/openai-server | services | node/ts | build | active |
| @promethean-os/sentinel | services/sentinel | services | node/ts | build+service | active |
| @promethean-os/tools | tools | tools | node/ts | lib | active |

## Initial category map (non-exhaustive)
### Kernel / glue
- Root orchestrator scripts (`package.json`, `scripts/`, `tools/`)
- Pipelines (automation/scheduler layer)

### Services
- `services/sentinel`
- `services/openai-server`
- `services/frontend-service`
- `services/file-indexer-service`
- `services/mcp-kanban-bridge`
- `services/mcp-dev-ui-frontend`
- `services/mcp` (legacy MCP stack; consolidation target)

### Libraries
- `packages/*` (utils, fs, messaging, security, persistence, caching, etc.)

### CLI
- `cli/kanban` + subpackages
- `cli/apply-patch`, `cli/docs`, `cli/compiler`, `cli/ecosystem-dsl`, `cli/obsidian-export`

### Pipelines
- `pipelines/*` (buildfix, codemods, docops, lint-taskgen, piper, readmeflow, semverguard, simtask, sonarflow, symdocs, testgap, etc.)

### Experimental
- `experimental/pantheon` (agent OS concepts + MCP overlap)
- `experimental/llm`, `experimental/pipeline-automation`, `experimental/scar`, `experimental/enso-*`, `experimental/voice`, `experimental/ai-learning`, etc.

## Consolidation targets
- MCP: unify `services/mcp` with `experimental/pantheon/packages/mcp` under the Clojure agent system.
- Agent OS: treat pantheon docs as canonical and migrate older TS implementations into Clojure agents/tools.
- Pipelines: align automation with agent-driven workflows.

## Migration principles
1. New core logic goes into Clojure agent system first; TS remains as adapters.
2. Deprecate duplicated services when a Clojure equivalent exists and is stable.
3. Keep Promethean OS responsible for orchestration, policy, configuration, and integration.

## Definition of done
- A populated registry table exists with all workspace modules and categories.
- Consolidation targets and migration notes are identified.
- Open questions and risks are captured for follow-up.
