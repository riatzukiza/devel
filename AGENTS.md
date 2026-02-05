# Devel Workspace

Multi-repository development workspace with git submodules organized under `orgs/` and shared TypeScript/ESLint tooling.

## Repository Structure
- `orgs/` contains submodules grouped by GitHub organization.
- Top-level workspace directories: `src/`, `docs/`, `tools/`, `ecosystems/`, `.opencode/`.
- Primary orgs in this workspace: `riatzukiza`, `anomalyco`, `open-hax`, `moofone`, `openai`, `bhauman`.

### Key Submodules
- `orgs/riatzukiza/promethean` - local LLM enhancement system and agent framework
- `orgs/anomalyco/opencode` - opencode development tools
- `orgs/riatzukiza/agent-shell` - Emacs-based agent shell for ACP
- `orgs/bhauman/clojure-mcp` - Clojure MCP server
- `orgs/open-hax/codex` - OAuth/auth integration
- `orgs/moofone/codex-ts-sdk` - TypeScript SDK
- `orgs/openai/codex` - Rust-based Codex CLI/runtime

### Documentation Navigation
- `docs/MASTER_CROSS_REFERENCE_INDEX.md` for ecosystem overview
- `docs/reports/research/git-submodules-documentation.md` for remote URLs

### Key Submodules
- `orgs/riatzukiza/promethean` - local LLM enhancement system and agent framework
- `orgs/anomalyco/opencode` - opencode development tools
- `orgs/riatzukiza/agent-shell` - Emacs-based agent shell for ACP
- `orgs/bhauman/clojure-mcp` - Clojure MCP server
- `orgs/open-hax/codex` - OAuth/auth integration
- `orgs/moofone/codex-ts-sdk` - TypeScript SDK
- `orgs/openai/codex` - Rust-based Codex CLI/runtime

### Documentation Navigation
- `docs/MASTER_CROSS_REFERENCE_INDEX.md` for ecosystem overview
- `docs/reports/research/git-submodules-documentation.md` for remote URLs

## Tech Stack
- Node.js with `pnpm` and `bun` tooling.
- TypeScript (ES2022, CommonJS, strict mode) and ESLint (functional, sonarjs, promise).
- Clojure/ClojureScript with shadow-cljs and clobber ecosystem builds.
- PM2 for process management.
- Nx for affected detection and workspace automation.
- Rust in `orgs/openai/codex`.

## Skills and Trigger Words
Skills live under `.opencode/skills/**/SKILL.md`. Use the skill name as a baseline trigger phrase and follow the trigger words below for common tasks.

### Trigger Words Quick Reference
| Skill | Trigger Words |
| --- | --- |
| `pm2-process-management` | "pm2", "ecosystem", "start all", "restart all", "shadow-cljs" |
| `create-pm2-ecosystem` | "create ecosystem", "add service", "defapp" |
| `submodule-ops` | "orgs/", ".gitmodules", "submodule update", "submodule sync" |
| `git-master` | "commit", "rebase", "squash", "blame", "git log", "push", "pull" |
| `playwright` | "browser", "test website", "fill form", "screenshot", "navigate" |
| `workspace-commands` | "pnpm lint", "pnpm typecheck", "pnpm test", "pnpm build", "build:octavia", "src/hack.ts" |
| `workspace-code-standards` | "code style", "lint rules", "TypeScript standards" |
| `workspace-lint` | "lint", "eslint" |
| `workspace-typecheck` | "typecheck", "typescript", "tsc" |
| `workspace-build` | "build", "compile" |
| `opencode-command-authoring` | "create-command", "opencode-command" |
| `github-integration` | "GitHub", "issues", "PR mirroring", "gh" |
| `release-watcher` | "release watch", "codex release", "opencode release" |
| `testing-general` | "testing strategy", "test coverage" |
| `testing-unit` | "unit test" |
| `testing-integration` | "integration test" |
| `testing-e2e` | "e2e test", "end-to-end" |

### Skills Index

#### Core Operations
- `skill-authoring`
- `skill-optimizing`
- `find-skills`
- `workspace-commands`
- `workspace-code-standards`
- `workspace-navigation`
- `workspace-dependency-check`
- `lint-gate`
- `test-preservation`
- `task-atomicity-guard`
- `break-edit-loop`
- `apology-action-protocol`
- `emergency-confusion-reset`
- `verify-resource-existence`

#### OpenCode Development
- `opencode-skill-creation`
- `opencode-agent-authoring`
- `opencode-agents-skills`
- `opencode-command-authoring`
- `opencode-plugin-authoring`
- `opencode-tool-authoring`
- `opencode-sdk`
- `opencode-plugins`
- `opencode-configs`
- `opencode-tools-mcp`
- `opencode-models-providers`
- `opencode-model-variant-management`
- `opencode-reconstituter`
- `opencode-session-search`
- `opencode-semantic-find-session`
- `opencode-review-past-sessions`
- `opencode-recover-project`
- `opencode-apply-reconstituted-diffs`
- `opencode-extract-diffs`

#### Server Integration
- `mcp-server-integration`
- `lsp-server-integration`

#### Process Management
- `pm2-process-management`
- `create-pm2-ecosystem`
- `create-pm2-clj-config`
- `render-pm2-clj-config`
- `pm2-server-control`
- `shadow-cljs-debug`

#### Submodules and Automation
- `submodule-ops`
- `giga-workflow`
- `nx-integration`
- `github-integration`
- `release-watcher`

#### Code Quality and Testing
- `workspace-lint`
- `workspace-typecheck`
- `workspace-build`
- `testing-general`
- `testing-unit`
- `testing-integration`
- `testing-e2e`
- `testing-bun`
- `testing-typescript-ava`
- `testing-typescript-vitest`
- `testing-clojure-cljs`
- `clojure-namespaces`
- `clojure-quality`
- `clojure-syntax-rescue`

#### Workflow and Kanban State
- `agile-process`
- `spec-authoring`
- `update-task-status`
- `kanban-state-backlog`
- `kanban-state-icebox`
- `kanban-state-in-progress`
- `kanban-state-review`
- `kanban-state-testing`
- `kanban-state-document`
- `kanban-state-done`
- `kanban-state-todo`
- `validate-task-status`
- `validate-ready-to-todo`
- `validate-ready-to-breakdown`
- `validate-breakdown-to-ready`
- `validate-breakdown-to-blocked`
- `validate-breakdown-to-icebox`
- `validate-breakdown-to-rejected`
- `validate-incoming-to-accepted`
- `validate-incoming-to-icebox`
- `validate-incoming-to-rejected`
- `validate-accepted-to-breakdown`
- `validate-accepted-to-icebox`
- `validate-in_progress-to-breakdown`
- `validate-in_progress-to-in_review`
- `validate-in_progress-to-todo`
- `validate-in_review-to-in_progress`
- `validate-in_review-to-testing`
- `validate-in_review-to-breakdown`
- `validate-in_review-to-todo`
- `validate-testing-to-in_progress`
- `validate-testing-to-in_review`
- `validate-testing-to-document`
- `validate-document-to-in_review`
- `validate-document-to-done`
- `work-on-icebox-task`
- `work-on-incoming-task`
- `work-on-todo-task`
- `work-on-in_progress-task`
- `work-on-in_review-task`
- `work-on-testing-task`
- `work-on-document-task`
- `work-on-ready-task`
- `work-on-accepted-task`
- `work-on-rejected-task`
- `work-on-blocked-task`
- `work-on-breakdown-task`
- `work-on-done-task`

Trigger words for additional skills follow their skill names and the "Use This Skill When" sections in each `SKILL.md`.
