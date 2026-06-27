
## Commands
- `pnpm dev` - Start both frontend (8700) and backend (8787) in dev mode
- `pnpm build` - Build both frontend and backend for production  
- `pnpm start` - Start production backend server
- `pnpm clean` - Clean all build artifacts
- `cd packages/opencode-reactant && pnpm dev` - Frontend only
- `cd services/agentd && pnpm dev` - Backend only
- `npx shadow-cljs compile app` - Compile ClojureScript
- `npx shadow-cljs release app` - Production frontend build

## Testing Gate
- A task is not done while any relevant automated test suite is failing.
- For coding-agent changes, run `pnpm --filter @open-hax/eta-mu-cli test` and resolve all failures before reporting completion.
- For eta-mu extension changes, run `pnpm -C packages/eta-mu-extensions test` and resolve all failures before reporting completion.
- If a full suite cannot be run, state that the task is not complete and record the exact blocker instead of claiming done.

### Frontend status checks (Chrome DevTools)
- Open http://localhost:8700, launch DevTools (Cmd/Ctrl+Opt+I), and reload with "Disable cache" to avoid stale CLJS bundles.
- Console: watch for red errors; enable "Pause on exceptions" to catch runtime ClojureScript issues. Warnings are okay if shadow-cljs hot reload stays connected.
- Network: filter to `WS` to confirm the WebSocket to :8787 upgrades (101) and keeps exchanging frames; XHR/fetch calls should stay 200/304 (401 usually means missing backend env vars).
- Application > Storage: clear local/session storage when UI state looks stuck before reloading.
- Performance: use Performance panel (and React DevTools if installed) to confirm renders stay responsive during event bursts; persistent growth in detached nodes hints at leaks.

## Code Style
- **TypeScript**: ES modules, camelCase functions, async/await, Zod validation, Fastify server
- **ClojureScript**: Reagent components, kebab-case functions, atoms for state, Tailwind CSS
- **Imports**: Use ES6 imports, no default exports, explicit file extensions (.js)
- **Types**: Strict TypeScript enabled, avoid `any`, use Zod schemas
- **Naming**: camelCase for TS, kebab-case for CLJS, descriptive variable names
- **Error handling**: Try/catch only when necessary, proper error logging via bus events
- **Formatting**: Consistent indentation, no unnecessary destructuring, single-responsibility functions

## Architecture
- Event-driven with WebSocket communication between frontend/backend
- GitHub API via Octokit, Git operations via simple-git
- Frontend: Reagent + Shadow-CLJS, Backend: Fastify + TypeScript
- State management: atoms in ClojureScript, event bus in TypeScript

### 🔗 Cross-Repository Integration
- **[CROSS_REFERENCES.md](./CROSS_REFERENCES.md)** - Complete cross-references to all related repositories
- **[Workspace AGENTS.md](../../AGENTS.md)** - Main workspace documentation
- **[Repository Index](../../REPOSITORY_INDEX.md)** - Complete repository overview

### Related Repositories
- **[promethean](../../promethean/)**: Agent orchestration and AI enhancement
- **[agent-shell](../../agent-shell/)**: Development workflow and agent integration
- **[open-hax/codex](../../open-hax/codex/)**: Authentication patterns
- **[moofone/codex-ts-sdk](../../moofone/codex-ts-sdk/)**: TypeScript SDK integration
- **[stt](../../stt/)**: Web development patterns and components
- **[opencode-hub](../../opencode-hub/)**: Package management and distribution
- **[clojure-mcp](../../clojure-mcp/)**: ClojureScript development patterns
- **[dotfiles](../../dotfiles/)**: Development environment setup

## Knowledge Graph (self-documenting)
- Root: `AGENTS.md` (this file) links operational conventions and connects all docs.
- Workspace docs: [Workspace AGENTS](../../AGENTS.md) ↔ [Repository Index](../../REPOSITORY_INDEX.md) ↔ [CROSS_REFERENCES.md](./CROSS_REFERENCES.md).
- Backend/agentd: [spec/agentd-tests.md](./spec/agentd-tests.md) → vitest harness/tests; [spec/run-readiness.md](./spec/run-readiness.md) → install/run checklist; [spec/pm2-ecosystem.md](./spec/pm2-ecosystem.md) → PM2 setup.
- CLJS runtime rewrite: [kanban/epics/eta-mu-cljs-runtime-rewrite.md](./kanban/epics/eta-mu-cljs-runtime-rewrite.md) ↔ [docs/cljs-runtime-rewrite-architecture-inventory.md](./docs/cljs-runtime-rewrite-architecture-inventory.md) ↔ [docs/cljs-runtime-rewrite-shadow-spine-plan.md](./docs/cljs-runtime-rewrite-shadow-spine-plan.md).
- Frontend/opencode-reactant: [packages/opencode-reactant/README.md](./packages/opencode-reactant/README.md) ↔ [DEVELOPMENT.md](./packages/opencode-reactant/DEVELOPMENT.md) ↔ [CROSS_REFERENCES.md](./packages/opencode-reactant/CROSS_REFERENCES.md).
- Notes: [docs/notes/*](./docs/notes/) hold dated investigations; treat as append-only references.
- Memories: [.serena/memories/*.md](./.serena/memories/) capture conventions, error-handling plans, and suggested commands.

Use this graph bidirectionally: when adding a new document, link it here and back to its nearest neighbors (component, spec, or guide) to keep the graph consistent.


## RELEVANT SKILLS
These skills are configured for this directory's technology stack and workflow.

### clojure-namespace-architect
Resolves Clojure namespace-path mismatches and classpath errors with definitive path conversion

### clojure-quality
Auto-fix Clojure delimiters and validate syntax with OpenCode tools.

### clojure-syntax-rescue
Protocol to recover from Clojure/Script syntax errors, specifically bracket mismatches and EOF errors.

### create-pm2-clj-config
Create new pm2-clj ecosystem configuration files from scratch or templates for PM2 process management

### create-pm2-ecosystem
Create new PM2 ecosystem configuration files for the clobber-based system with proper defapp definitions

### git-safety-check
Protocol to ensure safe git operations and avoid detached HEAD or dirty commits.

### github-integration
Perform GitHub operations across all tracked repositories in orgs/**, including issue/PR management, repository synchronization, and automation workflows

### pm2-process-management
Start, stop, restart, and manage PM2 processes using the ecosystem-based configuration system

### render-pm2-clj-config
Render pm2-clj ecosystem files to JSON for validation and debugging without starting processes

### submodule-ops
Make safe, consistent changes in a workspace with many git submodules under orgs/**

### testing-general
Apply testing best practices, choose appropriate test types, and establish reliable test coverage across the codebase

### work-on-in_progress-task
Execute the best next work for a task currently in `in_progress`.

### work-on-todo-task
Execute the best next work for a task currently in `todo`.

### workspace-lint
Lint all TypeScript and markdown files across the entire workspace, including all submodules under orgs/**

