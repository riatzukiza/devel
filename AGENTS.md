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

## SKILLS

The following skills are available in this workspace. They are organized by category.

### Clojure

#### clojure-namespace-architect
Resolves Clojure namespace-path mismatches and classpath errors with definitive path conversion

#### clojure-quality
Auto-fix Clojure delimiters and validate syntax with OpenCode tools.

#### clojure-syntax-rescue
Protocol to recover from Clojure/Script syntax errors, specifically bracket mismatches and EOF errors.

### General

#### apology-action-protocol
Protocol to stop apology loops and focus on verified fixes.

#### break-edit-loop
Protocol to break out of repetitive, failing edit loops by forcing analysis over action.

#### emergency-confusion-reset
Protocol for agents to recover when confused, hallucinating tools, or stuck in unproductive loops.

#### giga-workflow
Execute Giga system operations for workspace automation, including watching changes, running submodule tests, and propagating commits

#### lint-gate
Protocol to enforce zero lint/type errors before marking work done.

#### lsp-server-integration
Add and configure Language Server Protocol (LSP) servers to provide language intelligence in OpenCode

#### mcp-server-integration
Add and configure Model Context Protocol (MCP) servers with correct protocol compliance and tool registration

#### nx-integration
Use Nx to detect affected projects and run targets across multiple submodules in the workspace

#### release-watcher
Monitor upstream releases for OpenAI codex and SST opencode repositories, detect changes, and create GitHub issues for release impact analysis

#### shadow-cljs-debug
Protocol to debug and fix shadow-cljs compilation errors.

#### skill-authoring
Create or revise skills so they are reusable, scoped, and load correctly in OpenCode and Codex

#### skill-optimizing
Improve existing or new skills using the workspace optimization guide and template checks for clarity, scope, and reliability

#### task-atomicity-guard
Protocol to keep work atomic and prevent scope creep.

#### verify-resource-existence
Protocol to verify a resource exists before creating a new one.

### Git

#### git-safety-check
Protocol to ensure safe git operations and avoid detached HEAD or dirty commits.

#### github-integration
Perform GitHub operations across all tracked repositories in orgs/**, including issue/PR management, repository synchronization, and automation workflows

#### submodule-ops
Make safe, consistent changes in a workspace with many git submodules under orgs/**

### Kanban

#### work-on-accepted-task
Execute the best next work for a task currently in `accepted`.

#### work-on-blocked-task
Execute the best next work for a task currently in `blocked`.

#### work-on-breakdown-task
Execute the best next work for a task currently in `breakdown`.

#### work-on-document-task
Execute the best next work for a task currently in `document`.

#### work-on-done-task
Execute the best next work for a task currently in `done`.

#### work-on-icebox-task
Execute the best next work for a task currently in `icebox`.

#### work-on-in_progress-task
Execute the best next work for a task currently in `in_progress`.

#### work-on-in_review-task
Execute the best next work for a task currently in `in_review`.

#### work-on-incoming-task
Execute the best next work for a task currently in `incoming`.

#### work-on-ready-task
Execute the best next work for a task currently in `ready`.

#### work-on-rejected-task
Execute the best next work for a task currently in `rejected`.

#### work-on-testing-task
Execute the best next work for a task currently in `testing`.

#### work-on-todo-task
Execute the best next work for a task currently in `todo`.

### OpenCode

#### opencode-agent-authoring
Create or update OpenCode agent guidance with clear triggers, behavior, and constraints

#### opencode-agents-skills
Author or update agents and skills that align with OpenCode guidance and repository conventions

#### opencode-apply-reconstituted-diffs
Apply reconstructed diff patches safely and validate results

#### opencode-command-authoring
Create and manage OpenCode commands with valid frontmatter and predictable execution

#### opencode-configs
Update OpenCode configuration, rules, commands, and permissions in line with official documentation

#### opencode-extract-diffs
Extract and normalize diff snapshots from OpenCode session artifacts

#### opencode-model-variant-management
Add new models, providers, or model variants with correct configuration, authentication, and validation

#### opencode-models-providers
Select, validate, or update model/provider configurations with authoritative provider documentation

#### opencode-plugin-authoring
Create or update OpenCode plugins with correct packaging, runtime behavior, and documentation

#### opencode-plugins
Build or modify OpenCode plugins with correct packaging and runtime behavior

#### opencode-reconstituter
Run the reconstitute CLI to index, search, and reconstruct project context from OpenCode sessions

#### opencode-recover-project
Recover project state using OpenCode sessions, snapshots, and reconstituter outputs

#### opencode-review-past-sessions
Review OpenCode session history to recover decisions, intent, and prior changes

#### opencode-sdk
Implement or regenerate OpenCode SDKs safely after server or API changes

#### opencode-semantic-find-session
Find relevant OpenCode sessions using semantic search and filtering

#### opencode-session-search
Search and index OpenCode sessions using ChromaDB vector embeddings for semantic similarity retrieval and conversation reconstitute workflows

#### opencode-skill-creation
Create new OpenCode skills that validate, load reliably, and follow repository conventions

#### opencode-tool-authoring
Design and implement OpenCode tools with correct schemas, execution behavior, and documentation

#### opencode-tools-mcp
Implement or adjust OpenCode tools, MCP servers, and ACP integrations with correct protocols

### PM2

#### create-pm2-clj-config
Create new pm2-clj ecosystem configuration files from scratch or templates for PM2 process management

#### create-pm2-ecosystem
Create new PM2 ecosystem configuration files for the clobber-based system with proper defapp definitions

#### pm2-process-management
Start, stop, restart, and manage PM2 processes using the ecosystem-based configuration system

#### render-pm2-clj-config
Render pm2-clj ecosystem files to JSON for validation and debugging without starting processes

### Testing

#### test-preservation
Protocol to forbid deleting or skipping tests to make builds pass.

#### testing-bun
Set up and write tests using Bun's built-in test runner for maximum performance and TypeScript support

#### testing-clojure-cljs
Set up and write tests for Clojure and ClojureScript projects using cljs.test, cljs-init-tests, and shadow-cljs

#### testing-e2e
Write end-to-end tests that verify complete user workflows and critical system paths across the full stack

#### testing-general
Apply testing best practices, choose appropriate test types, and establish reliable test coverage across the codebase

#### testing-integration
Write integration tests that verify multiple components work together correctly with real dependencies

#### testing-nx
Configure and run tests across multiple projects using Nx affected detection for efficient workspace testing

#### testing-typescript-ava
Set up and write tests using Ava test runner for TypeScript with minimal configuration and fast execution

#### testing-typescript-vitest
Set up and write tests using Vitest for TypeScript projects with proper configuration and TypeScript support

#### testing-unit
Write fast, focused unit tests for individual functions, classes, and modules with proper isolation and mocking

### Workspace

#### workspace-build
Build all affected submodules across the workspace, including running tests for changed files, using Nx for affected project detection

#### workspace-code-standards
Apply workspace TypeScript and ESLint standards, including functional style and strict typing rules

#### workspace-commands
Run common workspace-level commands for linting, typechecking, building, and utilities

#### workspace-dependency-check
Protocol to diagnose pnpm workspace module resolution failures.

#### workspace-lint
Lint all TypeScript and markdown files across the entire workspace, including all submodules under orgs/**

#### workspace-navigation
Locate the right repo, file, and pattern quickly in a multi-repo workspace with many submodules

#### workspace-typecheck
Type check all TypeScript files across the entire workspace, including all submodules under orgs/**, using strict TypeScript settings


