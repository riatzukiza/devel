# Devel Workspace

Multi-repository development workspace with git submodules and TypeScript/ESLint configuration.

## Commands

**Workspace:**
- `pnpm lint` - Lint all TypeScript files
- `pnpm typecheck` - Type check with strict TypeScript
- `pnpm build` - Build workspace (if src/ exists)
- `bun run src/hack.ts` - Run the main utility script

**Submodule workflows:**
- `cd promethean && pnpm --filter @promethean-os/<pkg> <command>`
- `cd stt/opencode && bun dev` (opencode development)

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
- **[promethean](promethean/)**: Local LLM enhancement system and autonomous agent framework
- **[opencode-openai-codex-auth](opencode-openai-codex-auth/)**: OpenAI Codex OAuth authentication plugin
- **[agent-shell](agent-shell/)**: Emacs-based agent shell for ACP (Agent Client Protocol)
- **[clojure-mcp](clojure-mcp/)**: MCP server for Clojure REPL-driven development

### 🔧 Tooling & SDKs
- **[moofone/codex-ts-sdk](moofone/codex-ts-sdk/)**: TypeScript SDK for OpenAI Codex with cloud tasks
- **[openai/codex](openai/codex/)**: Rust-based Codex CLI and runtime

### 🌐 Web & Frontend
- **[stt](stt/)**: Multiple opencode development branches and experiments
- **[riatzukiza/openhax](riatzukiza/openhax/)**: Full-stack application with Reactant + Fastify
- **[opencode-hub](opencode-hub/)**: Centralized opencode coordination and distribution

### ⚙️ Configuration & Environment
- **[dotfiles](dotfiles/)**: System configuration and environment setup
- **[riatzukiza/**](riatzukiza/)**: Personal workspace collection

## Cross-Repository Integration

### 🔗 High-Value Patterns
- **Authentication**: opencode-openai-codex-auth ↔ moofone/codex-ts-sdk ↔ openai/codex
- **Agent Development**: agent-shell ↔ clojure-mcp ↔ promethean
- **Web Development**: stt ↔ riatzukiza/openhax ↔ opencode-hub
- **Environment Setup**: dotfiles ↔ all development tools

### 📚 Documentation Navigation
- **[Master Cross-Reference Index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**: Complete ecosystem overview and integration patterns
- **[Complete Documentation Analysis](docs/reports/research/git-submodules-documentation.md)**: Comprehensive cross-reference guide
- **[Repository URLs](docs/reports/research/git-submodules-documentation.md#remote-repository-urls--documentation)**: Direct links to all remote documentation

### 🔗 Repository Cross-References
Each repository now has comprehensive cross-reference documentation:

#### **Development Infrastructure**
- **[promethean/CROSS_REFERENCES.md](promethean/CROSS_REFERENCES.md)** - Agent framework cross-references
- **[agent-shell/CROSS_REFERENCES.md](agent-shell/CROSS_REFERENCES.md)** - ACP protocol integration
- **[clojure-mcp/CROSS_REFERENCES.md](clojure-mcp/CROSS_REFERENCES.md)** - REPL development patterns
- **[opencode-openai-codex-auth/CROSS_REFERENCES.md](opencode-openai-codex-auth/CROSS_REFERENCES.md)** - Authentication patterns

#### **Tooling & SDKs**
- **[moofone/codex-ts-sdk/CROSS_REFERENCES.md](moofone/codex-ts-sdk/CROSS_REFERENCES.md)** - TypeScript SDK integration
- **[openai/codex/AGENTS.md](openai/codex/AGENTS.md)** - Rust runtime documentation

#### **Web & Frontend**
- **[stt/CROSS_REFERENCES.md](stt/CROSS_REFERENCES.md)** - OpenCode development integration
- **[opencode-hub/CROSS_REFERENCES.md](opencode-hub/CROSS_REFERENCES.md)** - Package management
- **[riatzukiza/openhax/CROSS_REFERENCES.md](riatzukiza/openhax/CROSS_REFERENCES.md)** - Full-stack patterns

#### **Configuration & Environment**
- **[dotfiles/CROSS_REFERENCES.md](dotfiles/CROSS_REFERENCES.md)** - Environment setup and configuration

### 🎯 Agent Decision Support
Use cross-reference documentation to:
1. **Choose appropriate tools** based on development requirements
2. **Understand integration patterns** between repositories
3. **Navigate dependencies** and shared tooling
4. **Follow best practices** for each technology stack
5. **Set up development environments** efficiently

## Development

- Submodules: promethean, stt/, dotfiles, clojure-mcp, agent-shell, opencode-openai-codex-auth, moofone/codex-ts-sdk, openai/codex, riatzukiza/openhax, opencode-hub
- TypeScript config: es2022, commonjs, strict mode
- ESLint with functional, sonarjs, promise plugins
- Use Bun APIs when available (Bun.file(), etc.)
- No default exports, prefer named exports
- Avoid try/catch statements when possible