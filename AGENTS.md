# Devel Workspace

Multi-repository development workspace with git submodules organized under `orgs/` and TypeScript/ESLint configuration.

---

# 🚀 Quick Reference

## Workspace Commands

| Command | Purpose |
|---------|---------|
| `pnpm lint` | Lint all TypeScript files |
| `pnpm typecheck` | Type check with strict TypeScript |
| `pnpm build` | Build workspace (if src/ exists) |
| `bun run src/hack.ts` | Run the main utility script |

**Skill**: `workspace-lint`, `workspace-typecheck`, `workspace-build`

---

# 🎯 Skill System

## How Skills Work

Skills are specialized capabilities that provide domain expertise. Agents load skills to get:
- Best practices for the domain
- Common patterns and anti-patterns
- Strong hints for the domain
- Output format expectations

### delegate_task Skill Loading

When delegating tasks, ALWAYS pass `load_skills`:

```typescript
delegate_task(
  load_skills=["git-master", "pm2-process-management"],
  category="...",
  prompt="..."
)
```

**Never** call delegate_task with empty `load_skills` unless you've justified why no skills apply.

## MUST LOAD Skills

Some topics require specific skills - agents MUST load these when working with these topics:

### PM2 Process Management Skills ⭐ CRITICAL

**Load skill**: `pm2-process-management`

**Triggered by ANY of**:
- Ecosystem files (`ecosystems/*.cljs`)
- PM2 commands (`pm2 start`, `pm2 stop`, `pm2 restart`, `pm2 logs`, `pm2 delete`)
- Process management ("start all processes", "stop services", "restart app")
- Shadow-cljs compilation (`npx shadow-cljs release clobber`)
- Clobber DSL (`clobber.macro/defapp`)
- Ecosystem config generation
- Process health checks

**Related skills to also consider**:
- `create-pm2-clj-config` - Creating new ecosystem configs
- `render-pm2-clj-config` - Validating configs

### Submodule Operations Skills

**Load skill**: `submodule-ops`

**Triggered by**:
- Working with files under `orgs/**`
- Editing `.gitmodules`
- Running `submodule` CLI commands
- Updating submodule pointers
- Multi-submodule changes

**Related skills**:
- `giga-workflow` - Watching and testing affected submodules
- `nx-integration` - Nx virtual projects for submodules

### Git Operations Skills

**Load skill**: `git-master` ⭐ MUST USE

**Triggered by ANY git operation**:
- `commit`, `rebase`, `squash`, `blame`, `bisect`
- `git log -S`, `git log --all`
- `git restore`, `git checkout`
- `git add`, `git push`, `git pull`

### Browser Automation Skills

**Load skill**: `playwright` or `dev-browser`

**Triggered by**:
- Browser interactions
- Form filling
- Screenshot capture
- Website testing

### Code Quality Skills

| Topic | Skill |
|-------|-------|
| Linting | `workspace-lint` |
| Type checking | `workspace-typecheck` |
| Building | `workspace-build` |

### OpenCode Platform Skills

| Topic | Skill |
|-------|-------|
| Commands | `opencode-command-authoring` |
| Plugins | `opencode-plugin-authoring`, `opencode-plugins` |
| Tools | `opencode-tool-authoring` |
| MCP servers | `mcp-server-integration` |
| LSP servers | `lsp-server-integration` |
| SDK | `opencode-sdk` |
| Configs | `opencode-configs` |
| Agents | `opencode-agents-skills` |
| Skills | `opencode-agents-skills` |
| Models/Providers | `opencode-models-providers` |

## Skill Trigger Phrases Quick Reference

| Skill | Trigger Phrases |
|-------|-----------------|
| `pm2-process-management` | "ecosystem", "pm2", "process", "start all", "restart all", "shadow-cljs" |
| `submodule-ops` | "orgs/", ".gitmodules", "submodule update", "submodule sync" |
| `git-master` | "commit", "rebase", "squash", "blame", "git log", "push", "pull" |
| `playwright` | "browser", "test website", "fill form", "screenshot", "navigate to" |
| `giga-workflow` | "giga-watch", "run-submodule", "commit propagation", "pantheon" |
| `nx-integration` | "nx", "affected tests", "virtual project" |
| `workspace-lint` | "lint", "eslint" |
| `workspace-typecheck` | "typecheck", "typescript", "tsc" |
| `workspace-build` | "build", "compile" |

---

# 🧩 Repo Skills Reference

Use these skills to stay aligned with the workspace workflow:

### Core Operations
- **Skill Authoring** (`.opencode/skills/skill-authoring.md`): create/revise skills
- **Skill Optimizing** (`.opencode/skills/skill-optimizing.md`): optimize existing skills
- **Find Skills** (`.opencode/skills/find-skills.md`): discover new skills for tasks

### OpenCode Development
- **OpenCode Skill Creation** (`.opencode/skills/opencode-skill-creation.md`): new skill docs + AGENTS.md updates
- **OpenCode Agent Authoring** (`.opencode/skills/opencode-agent-authoring.md`): agent behavior guidance
- **OpenCode Command Authoring** (`.opencode/skills/opencode-command-authoring.md`): create/list/run commands
- **OpenCode Plugin Authoring** (`.opencode/skills/opencode-plugin-authoring.md`): create/update plugins
- **OpenCode Tool Authoring** (`.opencode/skills/opencode-tool-authoring.md`): tool definitions
- **OpenCode SDK Workflows** (`.opencode/skills/opencode-sdk.md`): endpoints + SDK regeneration
- **OpenCode Plugins** (`.opencode/skills/opencode-plugins.md`): build/update plugins
- **OpenCode Configs & Rules** (`.opencode/skills/opencode-configs.md`): config behavior, rules, permissions
- **OpenCode Agents & Skills** (`.opencode/skills/opencode-agents-skills.md`): author/update agents/skills
- **OpenCode Models & Providers** (`.opencode/skills/opencode-models-providers.md`): provider/model selection
- **OpenCode Tools, MCP, ACP** (`.opencode/skills/opencode-tools-mcp.md`): tool definitions + protocols

### Server Integration
- **MCP Server Integration** (`.opencode/skills/mcp-server-integration.md`): MCP servers + tools
- **LSP Server Integration** (`.opencode/skills/lsp-server-integration.md`): language servers + intelligence
- **OpenCode Model Variant Management** (`.opencode/skills/opencode-model-variant-management.md`): variants

### Workspace Navigation
- **Workspace Navigation** (`.opencode/skills/workspace-navigation.md`): multi-repo requests
- **Submodule Operations** (`.opencode/skills/submodule-ops.md`): `orgs/**`, `.gitmodules`, pointers

### Process Management
- **PM2 Process Management** (`.opencode/skills/pm2-process-management.md`): pm2 start/stop/restart
- **PM2 Config Rendering** (`.opencode/skills/render-pm2-clj-config.md`): validate/render configs
- **Create PM2 Configs** (`.opencode/skills/create-pm2-clj-config.md`): new ecosystem files

### Automation & Integration
- **Giga Workflow** (`.opencode/skills/giga-workflow.md`): watching + testing affected submodules
- **Nx Integration** (`.opencode/skills/nx-integration.md`): Nx virtual projects
- **Release Watcher** (`.opencode/skills/release-watcher.md`): monitor releases
- **GitHub Integration** (`.opencode/skills/github-integration.md`): GitHub operations

### Code Quality
- **Workspace Build** (`.opencode/skills/workspace-build.md`): build workspace
- **Workspace Lint** (`.opencode/skills/workspace-lint.md`): lint workspace
- **Workspace Typecheck** (`.opencode/skills/workspace-typecheck.md`): typecheck workspace

---

# 🛠️ Domain Guides

## PM2 Ecosystem Management ⭐

**Skill to load**: `pm2-process-management` (REQUIRED for any ecosystem work)

All processes are managed through the ecosystem system. Define apps in `ecosystems/*.cljs` files and compile with shadow-cljs.

```bash
# Compile ecosystems to PM2 config (required after any changes)
pnpm generate-ecosystem
# or
npx shadow-cljs release clobber

# Start all apps from compiled config
pm2 start ecosystem.config.cjs

# Or do both in one command
pnpm generate-ecosystem && pm2 start ecosystem.config.cjs

# Restart all processes after changes
pm2 restart all

# Stop and delete all processes
pm2 delete all
```

### How the Ecosystem Build Works

The ecosystem system converts ClojureScript DSL files into PM2-compatible JSON configuration through this pipeline:

```
1. ECOSYSTEM FILES (ecosystems/*.cljs)
   ├── index.cljs          # Entry point - requires all ecosystem files
   ├── ecosystem.cljs      # Main app definitions (opencode, duck-ui)
   └── cephalon.cljs       # Additional services (cephalon, openskull-cephalon)
        │
        ▼
2. CLOBBER DSL (clobber.macro/defapp)
   Each file uses clobber.macro/defapp to register PM2 apps:
   
   (clobber.macro/defapp "my-service"
     {:script "node"
      :args ["dist/main.js"]
      :cwd "/path/to/service"
      :env {:NODE_ENV "production"}
      :autorestart true})
        │
        ▼
3. SHADOW-CLJS COMPILATION
   npx shadow-cljs release clobber
   
   Compiles CLJS → JavaScript, extracting registered apps
   Output: .clobber/index.cjs (CommonJS module)
        │
        ▼
4. PM2 CONFIG (ecosystem.config.cjs)
   ecosystem.config.cjs requires .clobber/index.cjs
   and exports the compiled ecosystem configuration
        │
        ▼
5. PM2 EXECUTION
   pm2 start ecosystem.config.cjs
   Reads the exported config and starts all processes
```

### Key Points
- Each `.cljs` file in `ecosystems/` defines one or more services with `clobber.macro/defapp`
- Files are loaded via `index.cljs` which requires all ecosystem files
- Side-effect loading: apps are registered when the namespace is required
- The `clobber.macro/ecosystem-output` call must end each file
- `ecosystem.config.cjs` is the PM2 entry point - always use this, not raw .cljs files

### Adding a New Service
1. Create `ecosystems/my-service.cljs` with defapp definition
2. Add `(require [my-service])` to `ecosystems/index.cljs`
3. Run `pnpm generate-ecosystem` to recompile
4. Run `pm2 start ecosystem.config.cjs` to start

### Current Running Services
- `devel/opencode` - OpenCode development server (port 4096)
- `duck-ui` - UI service (Clojure)
- `cephalon` - "Always-running mind" with vector memory

### Individual PM2 Operations
- `pm2 list` or `pm2 status` - List running processes
- `pm2 stop <app-name>` - Stop specific PM2 process
- `pm2 restart <app-name>` - Restart specific PM2 process
- `pm2 delete <app-name>` - Delete PM2 process
- `pm2 logs <app-name>` - View process logs
- `pm2 monit` - Real-time monitoring dashboard
- `pm2 restart all` - Restart all processes

### Ecosystem Configuration
- Ecosystem files live in `ecosystems/*.cljs`
- Each file defines PM2 apps using `clobber.macro/defapp`
- Compile with: `npx shadow-cljs release clobber`
- Output: `.clobber/index.cjs` (CommonJS for PM2)
- PM2 config: `ecosystem.config.cjs` (requires `.clobber/index.cjs`)

### Example ecosystem file (`ecosystems/myapp.cljs`):
```clojure
(ns myapp
  (:require [clobber.macro]))

(clobber.macro/defapp "my-service"
  {:script "node"
   :args ["dist/index.js"]
   :cwd "/path/to/service"
   :env {:NODE_ENV "production"}
   :autorestart true
   :max-restarts 5})
```

> **Deprecation Notice:**
> - Legacy `ecosystem.pm2.edn` format is deprecated. Use `ecosystems/*.cljs`
> - Legacy `ecosystem.config.*` files are deprecated. Use compiled `.clobber/index.cjs`
> - The `clobber` CLI is deprecated. Use `npx shadow-cljs release clobber` directly

**See**:
- `.opencode/skills/pm2-process-management.md` for detailed PM2 workflows
- `ecosystems/` directory for example ecosystem configurations

---

## Submodule Management

**Skill to load**: `submodule-ops` (REQUIRED for any submodule work)

### Submodule Commands
- `submodule sync [--recursive] [--jobs <n>]` - Sync .gitmodules mappings and initialize submodules
- `submodule update [--recursive] [--jobs <n>]` - Update submodules to latest remote refs
- `submodule status [--recursive]` - Show pinned commits and dirty worktrees
- `submodule smart commit "message"` - Intelligent commit across submodule hierarchy with pantheon integration
- `submodule --help` - Show all available commands and options
- `SUBMODULE_JOBS=<n>` - Control parallel job execution (default: 8)

### Submodule Workflows
- `cd orgs/riatzukiza/promethean && pnpm --filter @promethean-os/<pkg> <command>`
- `cd orgs/anomalyco/opencode && bun dev` (opencode development)

### Giga System
- `giga-commit <subRepoPath> <action> <result> [files...]` - Propagate commits across submodules
- `giga-nx-generate` - Generate Nx project configuration for submodules
- `giga-watch` - Watch changes and run affected tests automatically
- `pantheon-commit-msg <action> <result> <repoPath> [version]` - Handle Pantheon commit messages
- `bun run src/giga/giga-watch.ts` - Watch changes and run affected tests
- `bun run src/giga/run-submodule.ts <path> <test|build>` - Run submodule targets

### Core Principles
- **Atomic Operations**: Always commit submodule changes before updating parent workspace
- **Recursive Awareness**: Use `--recursive` only when working with nested submodules intentionally
- **Parallel Execution**: Leverage `SUBMODULE_JOBS` for performance with many submodules
- **Status Awareness**: Always check `bin/submodules-status` before committing workspace changes

---

## OpenCode Commands

**Skills**: `opencode-command-authoring`, `opencode-configs`

- `create-command [--name COMMAND] [--list] [--run COMMAND] [--force]` - Create/list/run opencode commands with frontmatter validation
- `opencode-command --list` - List available opencode commands
- `opencode-command --name COMMAND` - Create new opencode command
- `opencode-command --run COMMAND` - Run existing opencode command

---

## PR Mirroring

- `bun mirror-prs.ts` - Mirror PRs between sst/opencode and riatzukiza/opencode
- See [PR Mirroring Documentation](docs/pr-mirroring.md) for details

---

# 📐 Code Standards

**Skills**: `workspace-lint`, `workspace-typecheck`

## ESLint enforced
- ESM modules only (no require/module.exports)
- Functional programming: prefer const, avoid let, no classes
- TypeScript strict: no any, explicit types, readonly parameters
- Import order: builtin → external → internal → sibling → index
- Max 100 lines per function, 15 cognitive complexity
- Max 4 parameters per function, max 600 lines per file

## Testing
- Use `sleep` from test utils instead of setTimeout
- Mock at module boundaries with esmock
- Tests in src/tests/, deterministic and parallel-friendly

## Development Guidelines
- Submodules organized under `orgs/`: riatzukiza, sst, bhauman, numman-ali, moofone, openai
- TypeScript config: es2022, commonjs, strict mode
- ESLint with functional, sonarjs, promise plugins
- Use Bun APIs when available (Bun.file(), etc.)
- No default exports, prefer named exports
- Avoid try/catch statements when possible

---

# 🗂️ Repository Ecosystem

### 🏗️ Development Infrastructure
- **[orgs/riatzukiza/promethean](orgs/riatzukiza/promethean/)**: Local LLM enhancement system and autonomous agent framework
- **[orgs/open-hax/codex](orgs/open-hax/codex/)**: Open Hax Codex/OAuth authentication suite
- **[orgs/riatzukiza/agent-shell](orgs/riatzukiza/agent-shell/)**: Emacs-based agent shell for ACP (Agent Client Protocol)
- **[orgs/bhauman/clojure-mcp](orgs/bhauman/clojure-mcp/)**: MCP server for Clojure REPL-driven development

### 🔧 Tooling & SDKs
- **[orgs/moofone/codex-ts-sdk](orgs/moofone/codex-ts-sdk/)**: TypeScript SDK for OpenAI Codex with cloud tasks
- **[orgs/openai/codex](orgs/openai/codex/)**: Rust-based Codex CLI and runtime

### 🌐 Web & Frontend
- **[orgs/anomalyco/opencode](orgs/anomalyco/opencode/)**: Multiple opencode development branches and experiments
- **[orgs/riatzukiza/openhax](orgs/riatzukiza/openhax/)**: Full-stack application with Reactant + Fastify

### ⚙️ Configuration & Environment
- **[orgs/riatzukiza/dotfiles](orgs/riatzukiza/dotfiles/)**: System configuration and environment setup
- **[orgs/riatzukiza/**](orgs/riatzukiza/)**: Personal workspace collection

---

# 🔗 Cross-Repository Integration

### High-Value Patterns
- **Authentication**: orgs/open-hax/codex ↔ orgs/moofone/codex-ts-sdk ↔ orgs/openai/codex
- **Agent Development**: orgs/riatzukiza/agent-shell ↔ orgs/bhauman/clojure-mcp ↔ orgs/riatzukiza/promethean
- **Web Development**: orgs/anomalyco/opencode ↔ orgs/riatzukiza/openhax
- **Environment Setup**: orgs/riatzukiza/dotfiles ↔ all development tools
- **PR Mirroring**: sst/opencode ↔ riatzukiza/opencode (automated synchronization)

### Documentation Navigation
- **[Master Cross-Reference Index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**: Complete ecosystem overview and integration patterns
- **[Complete Documentation Analysis](docs/reports/research/git-submodules-documentation.md)**: Comprehensive cross-reference guide
- **[Repository URLs](docs/reports/research/git-submodules-documentation.md#remote-repository-urls--documentation)**: Direct links to all remote documentation
- **[PR Mirroring Documentation](docs/pr-mirroring.md)**: Automated PR synchronization between repositories
- **[Worktrees & Submodules Guide](docs/worktrees-and-submodules.md)**: Comprehensive policies and best practices
- **[Submodule Recovery Plan](spec/submodules-update.md)**: Recovery procedures for submodule failures

---

# 🐛 Troubleshooting Resources

### Nested Submodule Failures
- See `spec/submodules-update.md` for recovery procedures

### Worktree Conflicts
- Reference `docs/worktrees-and-submodules.md` for safe patterns

### Integration Issues
- Cross-reference documentation in individual submodule `CROSS_REFERENCES.md` files
