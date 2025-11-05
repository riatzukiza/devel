# Devel Workspace

A multi-repository development workspace with git submodules and TypeScript/ESLint configuration. This workspace serves as the central development environment for multiple interconnected projects and tools.

## Overview

This workspace contains 19+ git repositories organized as submodules, providing a unified development environment for:

- **Promethean OS**: A comprehensive operating system and development framework
- **Opencode**: Development tools and AI-powered coding assistants  
- **Agent Shell**: Emacs-based AI agent integration framework
- **Dotfiles**: Personal development environment configuration
- **Various tools and utilities**: Supporting libraries and applications

## Repository Structure

### Primary Submodules

| Submodule | Purpose | URL |
|-----------|---------|-----|
| `promethean` | Main OS and framework development | `git@github.com:riatzukiza/promethean.git` |
| `stt/opencode` | Opencode development tools | `git@github.com:sst/opencode.git` |
| `dotfiles` | Personal configuration files | `git@github.com:riatzukiza/dotfiles.git` |
| `agent-shell` | Emacs AI agent framework | `git@github.com:riatzukiza/agent-shell.git` |
| `clojure-mcp` | Clojure MCP integration | `git@github.com:bhauman/clojure-mcp.git` |

### Secondary Submodules

| Submodule | Purpose |
|-----------|---------|
| `openai/codex` | OpenAI Codex integration |
| `opencode-openai-codex-auth` | Authentication for Codex |
| `moofone/codex-ts-sdk` | TypeScript SDK for Codex |
| `riatzukiza/*` | Personal projects and repositories |

### Nested Structure

```
devel/
├── promethean/                    # Main framework
│   ├── packages/                 # Component packages
│   ├── .emacs/                   # Emacs configuration
│   └── git-subrepo-source/       # Git subrepo tools
├── stt/                          # SST organization
│   ├── opencode/                 # Main opencode repo
│   └── opencode_*/               # Feature branches/experiments
├── riatzukiza/                   # Personal projects
│   ├── openhax/
│   ├── desktop/
│   ├── book-of-shadows/
│   └── goblin-lessons/
├── agent-shell/                  # Emacs AI framework
├── dotfiles/                     # Configuration files
├── clojure-mcp/                  # Clojure integration
└── src/                          # Workspace-level code
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
cd promethean && pnpm install
cd stt/opencode && bun install
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
cd promethean && pnpm --filter @promethean-os/<pkg> <command>

# Opencode development
cd stt/opencode && bun dev

# Agent shell development (Emacs Lisp)
cd agent-shell && emacs agent-shell.el
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

### Opencode Integration

AI-powered development tools:
- TUI-based development environment
- GitHub Actions and VS Code extensions
- Multi-language SDK support
- Agent-based workflow automation

### Agent Shell

Emacs-based framework for AI agent integration:
- Support for multiple AI providers (OpenAI, Anthropic, Google)
- Interactive development workflows
- Extensible agent architecture

## Working with Submodules

### Common Operations

```bash
# Update all submodules to latest
git submodule update --remote --merge

# Work in specific submodule
cd promethean
git checkout main
git pull origin main

# Commit submodule changes
git add promethean
git commit -m "Update promethean to latest"

# Initialize new submodule
git submodule add <repository-url> <path>
```

### Branch Management

Each submodule maintains its own branch structure:
- `main`: Stable development branch
- Feature branches in respective repositories
- Workspace tracks specific commits for reproducibility

## Development Workflow

1. **Start**: Navigate to the relevant submodule for your task
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

1. Identify the appropriate submodule for your changes
2. Follow the code style guidelines in `AGENTS.md`
3. Ensure all linting and type checking passes
4. Update submodule references when making significant changes
5. Test changes across affected submodules

## Support

For workspace-specific issues:
- Check `AGENTS.md` for development guidelines
- Review individual submodule README files
- Use workspace-level commands for cross-submodule operations
