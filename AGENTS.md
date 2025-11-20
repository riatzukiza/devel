# Devel Workspace

Multi-repository development workspace with git submodules organized under `orgs/` and TypeScript/ESLint configuration.

## Commands

**Workspace:**
- `pnpm lint` - Lint all TypeScript files
- `pnpm typecheck` - Type check with strict TypeScript
- `pnpm build` - Build workspace (if src/ exists)
- `bun run src/hack.ts` - Run the main utility script

**OpenCode Commands:**
- `create-command [--name COMMAND] [--list] [--run COMMAND] [--force]` - Create/list/run opencode commands with frontmatter validation
- `opencode-command --list` - List available opencode commands
- `opencode-command --name COMMAND` - Create new opencode command
- `opencode-command --run COMMAND` - Run existing opencode command

**Submodule workflows:**
- `cd orgs/riatzukiza/promethean && pnpm --filter @promethean-os/<pkg> <command>`
- `cd orgs/sst/opencode && bun dev` (opencode development)

**Giga System:**
- `giga-commit <subRepoPath> <action> <result> [files...]` - Propagate commits across submodules
- `giga-nx-generate` - Generate Nx project configuration for submodules
- `giga-watch` - Watch changes and run affected tests automatically
- `pantheon-commit-msg <action> <result> <repoPath> [version]` - Handle Pantheon commit messages

**Bin utilities:**
- `install-pre-push-hooks.sh` - Installs `.hooks/pre-push-typecheck.sh` into root + all submodules and appends `.nx/` to git excludes.
- `setup-branch-protection [--dry-run]` - Applies baseline GitHub branch protection to every GitHub-backed submodule default branch (`ALSO_DEV=true` also guards `dev`; requires `gh` admin auth).
- `fix-submodules <org>` - Replaces nested git directories with proper submodules under the given org, creating remotes and committing the changes.
- `github-transfer-submodules <org>` - Transfers each `.gitmodules` repo to the target org via `gh transfer`.
- `init-pnpm-submodules` - Initializes pnpm workspace packages lacking git repos, creates private repos under `GITHUB_OWNER` (default `octave-commons`), pushes `main`, and adds them as submodules.
- `opencode-command` - Wrapper for `bin/create-command` with the required `NODE_PATH` for NBB.

**Submodule Management:**
- `submodule sync [--recursive] [--jobs <n>]` - Sync .gitmodules mappings and initialize submodules
- `submodule update [--recursive] [--jobs <n>]` - Update submodules to latest remote refs
- `submodule status [--recursive]` - Show pinned commits and dirty worktrees
- `submodule smart commit "message"` - Intelligent commit across submodule hierarchy with pantheon integration
- `submodule --help` - Show all available commands and options
- `SUBMODULE_JOBS=<n>` - Control parallel job execution (default: 8)
- `bun run src/giga/giga-watch.ts` - Watch changes and run affected tests
- `bun run src/giga/run-submodule.ts <path> <test|build>` - Run submodule targets

**PR Mirroring:**
- `bun mirror-prs.ts` - Mirror PRs between sst/opencode and riatzukiza/opencode
- See [PR Mirroring Documentation](docs/pr-mirroring.md) for details

## Code Style

**ESLint enforced:**
- ESM modules only (no require/module.exports)
- Functional programming: prefer const, avoid let, no classes
- TypeScript strict: no any, explicit types, readonly parameters
- Import order: builtin → external → internal → sibling → index
- Max 100 lines per function, 15 cognitive complexity
- Max 4 parameters per function, max 600 lines per file

**Testing:**
- Use `sleep` from test utils instead of setTimeout
- Mock at module boundaries with esmock
- Tests in src/tests/, deterministic and parallel-friendly

## Repository Ecosystem

### 🏗️ Development Infrastructure
- **[orgs/riatzukiza/promethean](orgs/riatzukiza/promethean/)**: Local LLM enhancement system and autonomous agent framework
- **[orgs/open-hax/codex](orgs/open-hax/codex/)**: Open Hax Codex/OAuth authentication suite
- **[orgs/riatzukiza/agent-shell](orgs/riatzukiza/agent-shell/)**: Emacs-based agent shell for ACP (Agent Client Protocol)
- **[orgs/bhauman/clojure-mcp](orgs/bhauman/clojure-mcp/)**: MCP server for Clojure REPL-driven development

### 🔧 Tooling & SDKs
- **[orgs/moofone/codex-ts-sdk](orgs/moofone/codex-ts-sdk/)**: TypeScript SDK for OpenAI Codex with cloud tasks
- **[orgs/openai/codex](orgs/openai/codex/)**: Rust-based Codex CLI and runtime

### 🌐 Web & Frontend
- **[orgs/sst/opencode](orgs/sst/opencode/)**: Multiple opencode development branches and experiments
- **[orgs/riatzukiza/openhax](orgs/riatzukiza/openhax/)**: Full-stack application with Reactant + Fastify

### ⚙️ Configuration & Environment
- **[orgs/riatzukiza/dotfiles](orgs/riatzukiza/dotfiles/)**: System configuration and environment setup
- **[orgs/riatzukiza/**](orgs/riatzukiza/)**: Personal workspace collection

## Cross-Repository Integration

### 🔗 High-Value Patterns
- **Authentication**: orgs/open-hax/codex ↔ orgs/moofone/codex-ts-sdk ↔ orgs/openai/codex
- **Agent Development**: orgs/riatzukiza/agent-shell ↔ orgs/bhauman/clojure-mcp ↔ orgs/riatzukiza/promethean
- **Web Development**: orgs/sst/opencode ↔ orgs/riatzukiza/openhax
- **Environment Setup**: orgs/riatzukiza/dotfiles ↔ all development tools
- **PR Mirroring**: sst/opencode ↔ riatzukiza/opencode (automated synchronization)

### 📚 Documentation Navigation
- **[Master Cross-Reference Index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**: Complete ecosystem overview and integration patterns
- **[Complete Documentation Analysis](docs/reports/research/git-submodules-documentation.md)**: Comprehensive cross-reference guide
- **[Repository URLs](docs/reports/research/git-submodules-documentation.md#remote-repository-urls--documentation)**: Direct links to all remote documentation
- **[PR Mirroring Documentation](docs/pr-mirroring.md)**: Automated PR synchronization between repositories
- **[Worktrees & Submodules Guide](docs/worktrees-and-submodules.md)**: Comprehensive policies and best practices
- **[Submodule Recovery Plan](spec/submodules-update.md)**: Recovery procedures for submodule failures

### 🔗 Repository Cross-References
Each repository now has comprehensive cross-reference documentation:

#### **Development Infrastructure**
- **[orgs/riatzukiza/promethean/CROSS_REFERENCES.md](orgs/riatzukiza/promethean/CROSS_REFERENCES.md)** - Agent framework cross-references
- **[orgs/riatzukiza/agent-shell/CROSS_REFERENCES.md](orgs/riatzukiza/agent-shell/CROSS_REFERENCES.md)** - ACP protocol integration
- **[orgs/bhauman/clojure-mcp/CROSS_REFERENCES.md](orgs/bhauman/clojure-mcp/CROSS_REFERENCES.md)** - REPL development patterns
- **[orgs/open-hax/codex/CROSS_REFERENCES.md](orgs/open-hax/codex/CROSS_REFERENCES.md)** - Authentication patterns

#### **Tooling & SDKs**
- **[orgs/moofone/codex-ts-sdk/CROSS_REFERENCES.md](orgs/moofone/codex-ts-sdk/CROSS_REFERENCES.md)** - TypeScript SDK integration
- **[orgs/openai/codex/AGENTS.md](orgs/openai/codex/AGENTS.md)** - Rust runtime documentation

#### **Web & Frontend**
- **[orgs/sst/opencode/CROSS_REFERENCES.md](orgs/sst/opencode/CROSS_REFERENCES.md)** - OpenCode development integration
- **[orgs/riatzukiza/openhax/CROSS_REFERENCES.md](orgs/riatzukiza/openhax/CROSS_REFERENCES.md)** - Full-stack patterns
- **[PR Mirroring Automation](docs/pr-mirroring-automation.md)** - Quick reference for PR synchronization

#### **Configuration & Environment**
- **[orgs/riatzukiza/dotfiles/CROSS_REFERENCES.md](orgs/riatzukiza/dotfiles/CROSS_REFERENCES.md)** - Environment setup and configuration

### 🎯 Agent Decision Support
Use cross-reference documentation to:
1. **Choose appropriate tools** based on development requirements
2. **Understand integration patterns** between repositories
3. **Navigate dependencies** and shared tooling
4. **Follow best practices** for each technology stack
5. **Set up development environments** efficiently

## Development

- Submodules organized under `orgs/`: riatzukiza, sst, bhauman, numman-ali, moofone, openai
- TypeScript config: es2022, commonjs, strict mode
- ESLint with functional, sonarjs, promise plugins
- Use Bun APIs when available (Bun.file(), etc.)
- No default exports, prefer named exports
- Avoid try/catch statements when possible

## Submodule Management Best Practices

### Core Principles
- **Atomic Operations**: Always commit submodule changes before updating parent workspace
- **Recursive Awareness**: Use `--recursive` only when working with nested submodules intentionally
- **Parallel Execution**: Leverage `SUBMODULE_JOBS` for performance with many submodules
- **Status Awareness**: Always check `bin/submodules-status` before committing workspace changes

### Workflow Integration
1. **Before Development**: `submodule status` to ensure clean state
2. **During Development**: Work within specific submodule directories using their native tools
3. **After Changes**: `submodule update` to sync to latest remote refs
4. **Before Commit**: `submodule status` again to verify changes are intentional
5. **Integration**: Use Nx targets for cross-submodule testing and building

### Automation Integration
- **Giga System**: Automated watching and testing of affected submodules
- **Nx Plugin**: Virtual project representation for each submodule
- **Commit Propagation**: Automatic handling of submodule pointer updates
- **CI/CD**: Recursive submodule checkout and validation in GitHub Actions

### Troubleshooting Resources
- **Nested Submodule Failures**: See `spec/submodules-update.md` for recovery procedures
- **Worktree Conflicts**: Reference `docs/worktrees-and-submodules.md` for safe patterns
- **Integration Issues**: Cross-reference documentation in individual submodule `CROSS_REFERENCES.md` files
