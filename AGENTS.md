# Devel Workspace

Multi-repository development workspace with git submodules organized under `orgs/` and TypeScript/ESLint configuration.

## Commands

**Workspace:**
- `pnpm lint` - Lint all TypeScript files
- `pnpm typecheck` - Type check with strict TypeScript
- `pnpm build` - Build workspace (if src/ exists)
- `bun run src/hack.ts` - Run the main utility script

**Submodule workflows:**
- `cd orgs/riatzukiza/promethean && pnpm --filter @promethean-os/<pkg> <command>`
- `cd orgs/sst/opencode && bun dev` (opencode development)

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
- **[orgs/numman-ali/opencode-openai-codex-auth](orgs/numman-ali/opencode-openai-codex-auth/)**: OpenAI Codex OAuth authentication plugin
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
- **Authentication**: orgs/numman-ali/opencode-openai-codex-auth ↔ orgs/moofone/codex-ts-sdk ↔ orgs/openai/codex
- **Agent Development**: orgs/riatzukiza/agent-shell ↔ orgs/bhauman/clojure-mcp ↔ orgs/riatzukiza/promethean
- **Web Development**: orgs/sst/opencode ↔ orgs/riatzukiza/openhax
- **Environment Setup**: orgs/riatzukiza/dotfiles ↔ all development tools

### 📚 Documentation Navigation
- **[Master Cross-Reference Index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**: Complete ecosystem overview and integration patterns
- **[Complete Documentation Analysis](docs/reports/research/git-submodules-documentation.md)**: Comprehensive cross-reference guide
- **[Repository URLs](docs/reports/research/git-submodules-documentation.md#remote-repository-urls--documentation)**: Direct links to all remote documentation

### 🔗 Repository Cross-References
Each repository now has comprehensive cross-reference documentation:

#### **Development Infrastructure**
- **[orgs/riatzukiza/promethean/CROSS_REFERENCES.md](orgs/riatzukiza/promethean/CROSS_REFERENCES.md)** - Agent framework cross-references
- **[orgs/riatzukiza/agent-shell/CROSS_REFERENCES.md](orgs/riatzukiza/agent-shell/CROSS_REFERENCES.md)** - ACP protocol integration
- **[orgs/bhauman/clojure-mcp/CROSS_REFERENCES.md](orgs/bhauman/clojure-mcp/CROSS_REFERENCES.md)** - REPL development patterns
- **[orgs/numman-ali/opencode-openai-codex-auth/CROSS_REFERENCES.md](orgs/numman-ali/opencode-openai-codex-auth/CROSS_REFERENCES.md)** - Authentication patterns

#### **Tooling & SDKs**
- **[orgs/moofone/codex-ts-sdk/CROSS_REFERENCES.md](orgs/moofone/codex-ts-sdk/CROSS_REFERENCES.md)** - TypeScript SDK integration
- **[orgs/openai/codex/AGENTS.md](orgs/openai/codex/AGENTS.md)** - Rust runtime documentation

#### **Web & Frontend**
- **[orgs/sst/opencode/CROSS_REFERENCES.md](orgs/sst/opencode/CROSS_REFERENCES.md)** - OpenCode development integration
- **[orgs/riatzukiza/openhax/CROSS_REFERENCES.md](orgs/riatzukiza/openhax/CROSS_REFERENCES.md)** - Full-stack patterns

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
