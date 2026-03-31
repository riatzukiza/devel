# Devel Workspace

Multi-repository development workspace with git submodules organized under `orgs/` and shared TypeScript/ESLint tooling.

## Repository Structure
- `orgs/` contains submodules grouped by GitHub organization.
- Top-level workspace directories: `packages/`, `services/`, `src/`, `docs/`, `tools/`, `ecosystems/`, `.opencode/`.
- Primary orgs in this workspace: `riatzukiza`, `octave-commons`, `open-hax`, `ussyverse`, `anomalyco`, `moofone`, `openai`, `bhauman`.

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

## Proxx/OpenAI Accounts - CRITICAL
- **JSON files (keys.json, etc.) are ONLY for seeding - ignore them for finding accounts**
- Accounts are stored in PostgreSQL databases/volumes
- Original volume with ~143 OpenAI accounts: `open-hax-openai-proxy_open-hax-openai-proxy-db-data`
- **Never mount the same PostgreSQL volume to multiple containers simultaneously (causes corruption)**
- If volume gets corrupted, try starting a fresh container on it - PostgreSQL may auto-recover
- Each compose file in `services/proxx/` should have its own bridge network for independent operation

## Canonical Kanban Tooling
- The workspace-canonical Kanban tool now lives in `packages/kanban`.
- Access it through `bin/eta-mu-board` (chat shorthand: `@bin/eta-mu-board`).
- Prefer `bin/eta-mu-board` over legacy `pnpm kanban` / `@promethean-os/kanban` references unless you are explicitly repairing the legacy Promethean implementation.
- Common entrypoints:
  - `bin/eta-mu-board fsm show`
  - `bin/eta-mu-board github refine ...`
  - `bin/eta-mu-board github apply ...`

## Project Placement Contract
- Default project mode is rapid prototyping in `packages/*` unless the user explicitly says otherwise.
- `services/*` is devops-exclusive: use it for runtime wrappers, compose files, deployment config, env examples, operator docs, orchestration glue, and stable runtime paths/aliases.
- Do not treat `services/*` as the default canonical home for product/application source code.
- Mature projects graduate into org repos by identity and intent:
  - `orgs/riatzukiza/*` -> mature internal devel-only integrations with independent timelines.
  - `orgs/octave-commons/*` -> mature experimental, research, narrative-driven, or myth-encoded work.
  - `orgs/open-hax/*` -> production-grade products that are portable, documented, tested, and useful beyond this workspace.
  - `orgs/ussyverse/*` -> collective/community works not owned solely by one person.
- Special case: `orgs/octave-commons/promethean` is treated as a corpus of living documentation and documentation-as-code, not as a normal product repo.
- `devel` is the crucible that extracts, tests, and operationalizes useful kernels from the Promethean corpus.
- When code appears both in Promethean and elsewhere, distinguish: slop, corpus artifact, verified extraction, and canonical descendant.
- Canonical source/build/release/deploy contracts should live with the org repo; `devel` remains the giga-repo for composition, local integration, fleet placement, and cross-service orchestration.
- Work that still sits outside the structure should be handled via named exception classes rather than ad-hoc cleanup; see `docs/reference/outside-structure-exception-policy.md`.
- On this machine, `~/devel` fills the role many other setups call `~/projects` or `~/repos`; translate intent through this contract rather than creating a literal `projects/` subtree.
- Reference doc: `docs/reference/devel-placement-contract.md`

## Deployment Semantics
- When the user says `Deploy X`, interpret it as: inspect the target project and, if needed, stand up the full local -> PR -> staging -> PR -> prod delivery flow rather than doing a one-off manual deploy.
- Default Promethean naming convention:
  - staging: `staging.<service-name>.promethean.rest`
  - production: `<service-name>.promethean.rest`
- Default DNS auth source: `CLOUD_FLARE_PROMETHEAN_DOT_REST_DNS_ZONE_TOKEN`.
- Allowed base hosts for Promethean service placement:
  - `ussy.promethean.rest`
  - `ussy2.promethean.rest`
  - `ussy3.promethean.rest`
  - `big.ussy.promethean.rest`
- Prefer the deploy skills `promethean-service-deploy`, `promethean-host-slotting`, `promethean-rest-dns`, and `pr-promotion-workflows` for this flow.
- In pi, the project-local mirrors live under `.pi/skills/`; use `/skill:promethean-service-deploy` to force-load the orchestrator when needed.

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

#### atproto-auth-standardization
Standardize human login, service identity, and inter-service auth around AT Protocol DIDs and Bluesky-backed one-time sign-in while retiring host-local static secrets.

#### break-edit-loop
Protocol to break out of repetitive, failing edit loops by forcing analysis over action.

#### clock-model-evolver
Improve the Hormuz clock model through new signal classes, schema changes, and better rendering or branch logic.

#### devel-workspace-contract
Map legacy `~/projects` or `~/repos` assumptions into the `~/devel` placement contract and choose the correct path in this workspace.

#### emergency-confusion-reset
Protocol for agents to recover when confused, hallucinating tools, or stuck in unproductive loops.

#### giga-workflow
Execute Giga system operations for workspace automation, including watching changes, running submodule tests, and propagating commits

#### hormuz-risk-clock
Maintain and evolve the Hormuz public-signal risk clock by ingesting signals, updating state, and rendering reports.

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

#### total-creative-freedom
When the user says `engage in total creative freedom`, widen the search and solution space, synthesize repo/session context, and deliver the strongest prompt-faithful artifact.

#### sing-the-songs-of-your-people
When the user says `sing the songs of your people`, mine notes, sessions, lore, and code motifs to produce a beautiful but truthful synthesis in the workspace's native voice.

#### grok-intention
When the user says `grok my intention`, `manifest the dream`, or similar dense-intent phrases, recover latent intent from notes, sessions, and repo structure, then turn it into a concrete shape.

#### passwords-csv-browser-auth
Use local ignored `passwords.csv` exports to authenticate browser automation safely without printing or committing secrets.

#### social-publish-bluesky
Turn the latest Hormuz clock snapshot into a concise Bluesky post or thread with dry-run-first behavior.

#### social-publish-discord
Publish Hormuz clock updates into Discord channels with sanitized mentions, optional images, and dry-run-first behavior.

#### social-publish-reddit
Publish longer-form Hormuz clock updates to Reddit while preserving nuance, methodology, and subreddit-specific constraints.

#### social-publish-x
Publish Hormuz clock updates to X as a short post or thread with explicit uncertainty and dry-run-first behavior.

#### task-atomicity-guard
Protocol to keep work atomic and prevent scope creep.

#### verify-resource-existence
Protocol to verify a resource exists before creating a new one.

#### resume-fnord-ats
Maintain ATS-clean and AI-signal ("fnord") variants of resumes/cover letters with deterministic naming, minimal diffs, and a factual-only capability footer.

#### resume-oss-ats-audit
Audit resumes with runnable open-source ATS, parser, and resume-optimization tools; distinguish real parser signal from demo hype and write a reproducible findings report.

#### resume-ats-optimize
Turn audit findings into ATS-clean resume variants by simplifying parser-hostile formatting, standardizing section labels, improving quantification, and preserving truthfulness.

#### resume-ml-eval-research
Research and synthesize credible ML techniques for resume and job-description evaluation, ranking, and improvement, favoring explainable, local, reproducible methods.

#### resume-processing-workbench
Build and use a local resume-processing workbench that ingests resumes and job descriptions, runs parser/score pipelines, and emits reproducible fit/improvement reports.

#### webring-site
Research the live ussyco.de ring, build a distinct single-page site in this workspace, preview it locally, and optionally register it with an API key from the environment.

### Git

#### git-safety-check
Protocol to ensure safe git operations and avoid detached HEAD or dirty commits.

#### github-integration
Perform GitHub operations across all tracked repositories in orgs/**, including issue/PR management, repository synchronization, and automation workflows

#### pr-promotion-workflows
Set up PR-based branch promotion workflows with tiered CI gates, staging/main deploy hooks, and explicit GitHub branch-protection follow-through

#### promethean-host-slotting
Choose staging and production Promethean host slots, subdomains, runtime paths, and compose-project names from the allowed base-host pool

#### promethean-host-runtime-inventory
SSH into Promethean hosts, inventory active Docker/Podman/systemd/Proxmox runtimes, map public subdomains to live services, and write JSON plus markdown inventory artifacts

#### promethean-rest-dns
Create or update *.promethean.rest DNS A records through Cloudflare by copying current allowed base-host IPs while preserving unrelated zone records

#### promethean-service-deploy
Interpret `Deploy X` as bootstrapping or repairing a full local -> PR -> staging -> PR -> prod Promethean deployment flow with DNS, GitHub automation, and live validation

#### submodule-ops
Make safe, consistent changes in a workspace with many git submodules under orgs/**

### Kanban

#### eta-mu-board
Use the workspace kanban CLI at `packages/kanban` via `bin/eta-mu-board` for FSM inspection, GitHub backlog refinement, and managed label application.

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
