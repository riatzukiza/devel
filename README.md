# Devel Workspace

A multi-repository development workspace with git submodules organized under `orgs/` and TypeScript/ESLint configuration. This workspace serves as the central development environment for multiple interconnected projects and tools.

## Overview

This workspace contains 19+ git repositories organized as submodules under the `orgs/` directory structure, providing a unified development environment for:

- **Promethean OS**: A comprehensive operating system and development framework
- **Opencode**: Development tools and AI-powered coding assistants  
- **Agent Shell**: Emacs-based AI agent integration framework
- **Dotfiles**: Personal development environment configuration
- **Various tools and utilities**: Supporting libraries and applications

## Repository Structure

### Organization-Based Structure

All submodules are now organized under `orgs/` by their respective GitHub organizations:

| Organization | Repository | Purpose | Path |
|--------------|------------|---------|------|
| **riatzukiza** | `promethean` | Main OS and framework development | `orgs/riatzukiza/promethean` |
| **riatzukiza** | `dotfiles` | Personal configuration files | `orgs/riatzukiza/dotfiles` |
| **riatzukiza** | `agent-shell` | Emacs AI agent framework | `orgs/riatzukiza/agent-shell` |
| **riatzukiza** | `openhax` | Full-stack application | `orgs/riatzukiza/openhax` |
| **riatzukiza** | `stt` | SST organization mirror | `orgs/riatzukiza/stt` |
| **riatzukiza** | `desktop` | Desktop configuration | `orgs/riatzukiza/desktop` |
| **riatzukiza** | `book-of-shadows` | Personal documentation | `orgs/riatzukiza/book-of-shadows` |
| **riatzukiza** | `goblin-lessons` | Educational content | `orgs/riatzukiza/goblin-lessons` |
| **riatzukiza** | `riatzukiza.github.io` | Personal website | `orgs/riatzukiza/riatzukiza.github.io` |
| **sst** | `opencode` | Opencode development tools | `orgs/sst/opencode` |
| **bhauman** | `clojure-mcp` | Clojure MCP integration | `orgs/bhauman/clojure-mcp` |
| **numman-ali** | `opencode-openai-codex-auth` | Authentication for Codex | `orgs/numman-ali/opencode-openai-codex-auth` |
| **moofone** | `codex-ts-sdk` | TypeScript SDK for Codex | `orgs/moofone/codex-ts-sdk` |
| **openai** | `codex` | OpenAI Codex integration | `orgs/openai/codex` |

### Directory Structure

```
devel/
├── orgs/                          # Organization-based submodules
│   ├── riatzukiza/                # riatzukiza's repositories
│   │   ├── promethean/            # Main framework
│   │   ├── dotfiles/              # Configuration files
│   │   ├── agent-shell/           # Emacs AI framework
│   │   ├── openhax/               # Full-stack app
│   │   ├── stt/                   # SST org mirror
│   │   ├── desktop/               # Desktop config
│   │   ├── book-of-shadows/       # Documentation
│   │   ├── goblin-lessons/        # Educational content
│   │   └── riatzukiza.github.io/ # Personal site
│   ├── sst/                       # SST organization
│   │   └── opencode/              # Main opencode repo
│   ├── bhauman/                   # bhauman's repositories
│   │   └── clojure-mcp/           # Clojure integration
│   ├── numman-ali/                # numman-ali's repositories
│   │   └── opencode-openai-codex-auth/ # Auth plugin
│   ├── moofone/                   # moofone's repositories
│   │   └── codex-ts-sdk/          # TypeScript SDK
│   └── openai/                    # OpenAI organization
│       └── codex/                 # Codex CLI/runtime
├── src/                           # Workspace-level code
├── docs/                          # Documentation
└── tools/                         # Workspace tools
```

## Development Setup

### Prerequisites

- **Node.js**: Latest LTS version
- **pnpm**: Package manager (v10.14.0)
- **Bun**: Runtime for opencode development
- **Git**: For submodule management

### Initial Setup

```bash
# Clone and initialize submodules
git clone <workspace-url>
git submodule update --init --recursive

# Install dependencies
pnpm install

# Setup development environment
cd orgs/riatzukiza/promethean && pnpm install
cd orgs/sst/opencode && bun install
```

## Development Commands

### Workspace Level

```bash
# Lint all TypeScript files across workspace
pnpm lint

# Type check with strict TypeScript
pnpm typecheck

# Build workspace (if src/ exists)
pnpm build
```

### Submodule Workflows

```bash
# Promethean package development
cd orgs/riatzukiza/promethean && pnpm --filter @promethean-os/<pkg> <command>

# Opencode development
cd orgs/sst/opencode && bun dev

# Agent shell development (Emacs Lisp)
cd orgs/riatzukiza/agent-shell && emacs agent-shell.el

# Clojure MCP development
cd orgs/bhauman/clojure-mcp && <clojure-command>

# Codex TypeScript SDK development
cd orgs/moofone/codex-ts-sdk && pnpm <command>
```

## Code Style and Standards

### ESLint Configuration

The workspace enforces strict code quality through ESLint with the following rules:

- **ESM modules only**: No `require`/`module.exports`
- **Functional programming**: Prefer `const`, avoid `let`, no classes
- **TypeScript strict**: No `any`, explicit types, readonly parameters
- **Import order**: builtin → external → internal → sibling → index
- **Function limits**: Max 100 lines per function, 15 cognitive complexity

### TypeScript Configuration

- **Target**: ES2022
- **Module**: CommonJS (Node.js compatible)
- **Strict mode**: Enabled with all type-checking options
- **Module resolution**: Node.js style

### Testing Standards

- Use `sleep` from test utils instead of `setTimeout`
- Mock at module boundaries with `esmock`
- Tests in `src/tests/` directory
- Deterministic and parallel-friendly test design

## Key Components

### Promethean Framework

The core development framework containing:
- Package-based architecture with `pnpm workspaces`
- Emacs configuration layers for development
- MCP (Model Context Protocol) integrations
- Comprehensive tooling and utilities
- **Location**: `orgs/riatzukiza/promethean/`

### Opencode Integration

AI-powered development tools:
- TUI-based development environment
- GitHub Actions and VS Code extensions
- Multi-language SDK support
- Agent-based workflow automation
- **Location**: `orgs/sst/opencode/`

### Agent Shell

Emacs-based framework for AI agent integration:
- Support for multiple AI providers (OpenAI, Anthropic, Google)
- Interactive development workflows
- Extensible agent architecture
- **Location**: `orgs/riatzukiza/agent-shell/`

### Clojure MCP Integration

MCP server for Clojure REPL-driven development:
- Seamless REPL integration
- Enhanced development experience
- **Location**: `orgs/bhauman/clojure-mcp/`

## Working with Submodules

### Common Operations

```bash
# Update all submodules to latest
git submodule update --remote --merge

# Work in specific submodule
cd orgs/riatzukiza/promethean
git checkout main
git pull origin main

# Commit submodule changes
git add orgs/riatzukiza/promethean
git commit -m "Update promethean to latest"

# Initialize new submodule
git submodule add <repository-url> orgs/<org>/<repo>
```

### Submodule Helper Scripts

Executable helpers live in `bin/` so you can run them from anywhere without remembering long git commands. Each script respects the optional `SUBMODULE_JOBS=<n>` environment variable to control parallel git jobs and accepts `--recursive` when you explicitly need to include nested submodules that provide their own `.gitmodules` entries.

| Script | Purpose |
| --- | --- |
| `bin/submodules-sync` | Re-sync `.gitmodules` mappings and run `git submodule update --init` with sensible defaults |
| `bin/submodules-update` | Fetch remote refs for every submodule and fast-forward the recorded commits |
| `bin/submodules-status` | Show the currently pinned commits plus any dirty submodule worktrees |

Usage examples:

```bash
# Fast way to clone every tracked submodule after pulling main
bin/submodules-sync

# Update workspace to the latest commits published in each submodule
bin/submodules-update

# Inspect which submodules have local changes before committing
bin/submodules-status
```

> **Note:** Pass `--recursive` only when you intentionally need nested submodules (for example inside `orgs/riatzukiza/promethean`). Those repositories must publish their own `.gitmodules` entries or git will report an error. Keeping recursion off by default avoids noise from inner repos that are managed with other tooling. Legacy git-subrepo placeholders inside `orgs/riatzukiza/promethean` and `orgs/riatzukiza/stt` have been removed, so `--recursive` now walks only real submodules.

### Branch Management

Each submodule maintains its own branch structure:
- `main`: Stable development branch
- Feature branches in respective repositories
- Workspace tracks specific commits for reproducibility

## Development Workflow

1. **Start**: Navigate to the relevant submodule under `orgs/` for your task
2. **Develop**: Use submodule-specific commands and tools
3. **Test**: Run tests within the submodule context
4. **Integrate**: Update workspace submodule references
5. **Commit**: Commit both submodule changes and workspace updates

## Configuration Files

- `package.json`: Workspace-level dependencies and scripts
- `eslint.config.mjs`: Shared ESLint configuration
- `tsconfig.json`: TypeScript compiler settings
- `.gitmodules`: Submodule configuration and URLs
- `AGENTS.md`: Development guidelines and agent configurations

## Cross-Repository Documentation

The workspace maintains comprehensive cross-reference documentation:

### Documentation Navigation
- **[Master Cross-Reference Index](docs/MASTER_CROSS_REFERENCE_INDEX.md)**: Complete ecosystem overview
- **[Repository Index](REPOSITORY_INDEX.md)**: All repositories and their purposes
- **Individual CROSS_REFERENCES.md files**: Located in each repository

### Integration Patterns
- **Authentication**: `orgs/numman-ali/opencode-openai-codex-auth` ↔ `orgs/moofone/codex-ts-sdk` ↔ `orgs/openai/codex`
- **Agent Development**: `orgs/riatzukiza/agent-shell` ↔ `orgs/bhauman/clojure-mcp` ↔ `orgs/riatzukiza/promethean`
- **Web Development**: `orgs/sst/opencode` ↔ `orgs/riatzukiza/openhax`
- **Environment Setup**: `orgs/riatzukiza/dotfiles` ↔ all development tools

## Git Cheatsheet

### Find deleted files/folders

```bash
# With commit messages and blobs
git log --all --pretty=oneline -- services/js/health

# Just the blobs
git log --all -- services/js/broker
```

### Restore from blob

```bash
git restore --source <blob> -- <path/to/file>
```

### POST JSON with curl

```bash
curl -s -X POST http://hostname:port/path/to/thing \
  -H 'content-type: application/json' \
  -d "{}"
```

## Contributing

When contributing to this workspace:

1. Identify the appropriate submodule under `orgs/` for your changes
2. Follow the code style guidelines in `AGENTS.md`
3. Ensure all linting and type checking passes
4. Update submodule references when making significant changes
5. Test changes across affected submodules
6. Respect the organization-based structure when suggesting new submodules

## Support

For workspace-specific issues:
- Check `AGENTS.md` for development guidelines
- Review individual submodule README files
- Use workspace-level commands for cross-submodule operations
- Navigate using the `orgs/` structure for specific repositories
