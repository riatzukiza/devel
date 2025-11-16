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
| **open-hax** | `codex` | Authentication for Codex | `orgs/open-hax/codex` |
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
│   ├── open-hax/                  # open-hax organization
│   │   └── codex/                 # Auth plugin
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

### Issue & PR Projection

Mirror every GitHub issue and pull request for the submodules living under `orgs/**` into the local `issues/org/` tree. The projector requires a valid `GITHUB_TOKEN` (with `repo` scope for private repos) exported in your environment.

```bash
# Project everything (issues + PRs) for every tracked repo
GITHUB_TOKEN=<token> pnpm issues:project

# Regenerate only Promethean issues (leave PRs alone)
GITHUB_TOKEN=<token> pnpm issues:project -- --repo riatzukiza/promethean --type issues

# Clean the output folder and limit to the 10 newest PRs per repo
GITHUB_TOKEN=<token> pnpm issues:project -- --clean --type prs --limit 10
```

Output layout:

```
issues/org/<owner>/<repo>/
  issues/<number>-<slug>/thread.md
  prs/<number>-<slug>/
    thread.md
    reviews/<review-id>.md
    files/<path>.md
```

Each `thread.md` mirrors the GitHub conversation, every `reviews/<id>.md` interleaves inline review comments with their diff hunks, and `files/<path>.md` stores the per-file diffs along with any inline annotations.

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

### Release Monitoring Automation

- `.github/workflows/codex-release-watch.yml` polls `sst/opencode` (`v*`) and `openai/codex` (`rust-v*`) releases daily or on demand.
- `scripts/codex-release-monitor.mjs` clones upstream tags, captures diffs, and drives the `release-impact` OpenCode agent with `release-context.md` + `release-diff.patch` attachments.
- Agent guidance lives in `.opencode/agent/release-impact.md`, enforcing a strict JSON impact schema for automation.
- Findings auto-create GitHub issues labeled `codex-release-watch`; successful runs update `.github/release-watch/state.json` so the next diff always references the last reviewed tag.
- Requires `OPENCODE_API_KEY` secret and (optionally) `RELEASE_WATCH_MODEL` repo var to select a model (defaults to `openai/gpt-5-codex-high`).

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

### Submodule Management CLI

The workspace uses a unified CLI tool for submodule management with Commander.js framework.

#### Main Commands
```bash
# Sync .gitmodules mappings and initialize/update submodules
submodule sync [--recursive] [--jobs <number>]

# Fetch remote refs and update to latest tracked commits
submodule update [--recursive] [--jobs <number>]

# Show pinned commits and dirty submodule worktrees
submodule status [--recursive]

# Smart commit across submodule hierarchy with pantheon integration
submodule smart commit "message" [--dry-run] [--recursive]
```

#### Help and Options
```bash
# Show main help
submodule --help

# Show help for specific command
submodule sync --help
submodule update --help
submodule status --help
```

#### Legacy Support
For backward compatibility, the original scripts still work but show deprecation warnings:
- `bin/submodules-sync` → `submodule sync`
- `bin/submodules-update` → `submodule update`
- `bin/submodules-status` → `submodule status`

#### Core Features
- **Parallel execution**: Uses 8 jobs by default (configurable via `SUBMODULE_JOBS=<n>`)
- **Recursive support**: Pass `--recursive` for nested submodules
- **Error handling**: Comprehensive error reporting and recovery procedures

#### Usage Examples

```bash
# Fast way to clone every tracked submodule after pulling main
submodule sync

# Update workspace to the latest commits published in each submodule
submodule update

# Inspect which submodules have local changes before committing
submodule status

# Smart commit with interactive explanation
submodule smart commit "prepare for release"

# Smart commit dry run to see what would be committed
submodule smart commit "prepare for release" --dry-run

# Use 4 parallel jobs instead of default 8
submodule update --jobs 4

# Include nested submodules (for advanced use cases)
submodule update --recursive

# Use environment variable for jobs (legacy support)
SUBMODULE_JOBS=4 submodule update
```

### Automation Tools

#### Giga System
- **src/giga/run-submodule.ts**: Runs test/build in submodules via package.json scripts or Nx
- **src/giga/giga-watch.ts**: Watches for changes and triggers affected tests/builds automatically
- **src/giga/commit-propagator.ts**: Handles commit and tag propagation between submodules

#### Nx Integration
- **tools/nx-plugins/giga/plugin.ts**: Creates Nx virtual projects for each submodule
- **src/nss/gitmodules.ts**: Parses .gitmodules and discovers nested submodules

#### Workspace Automation
```bash
# Run tests for all submodules via Nx
pnpm nx run-many --target=test --all

# Watch for changes and run affected tests
bun run src/giga/giga-watch.ts

# Run specific submodule target
bun run src/giga/run-submodule.ts "orgs/riatzukiza/promethean" test
```

> **Note:** Pass `--recursive` only when you intentionally need nested submodules (for example inside `orgs/riatzukiza/promethean`). Those repositories must publish their own `.gitmodules` entries or git will report an error. Keeping recursion off by default avoids noise from inner repos that are managed with other tooling. Legacy git-subrepo placeholders inside `orgs/riatzukiza/promethean` and `orgs/riatzukiza/stt` have been removed, so `--recursive` now walks only real submodules.

### Smart Commit Feature

The `submodule smart commit` command provides intelligent, hierarchical commit management:

#### Key Features
- **Breadth-first traversal**: Commits from deepest submodules up to root workspace
- **Pantheon integration**: Generates meaningful commit messages using AI assistance
- **Interactive explanation**: Prompts for change context to enhance commit messages
- **Context propagation**: Child commit messages inform parent commit messages
- **Dry-run mode**: Preview changes without actually committing

#### Algorithm Overview
1. **Analysis**: Discovers all `orgs/**` submodules and builds hierarchy
2. **Depth grouping**: Organizes modules by depth for breadth-first processing
3. **Interactive prompt**: Asks "Why were these changes made?" with your message
4. **Bottom-up commits**: Commits deepest modules first, then aggregates up the tree
5. **Pantheon integration**: Uses AI to generate context-aware commit messages
6. **Root aggregation**: Final commit at workspace level integrating all changes

#### Example Usage
```bash
# Interactive smart commit with context
submodule smart commit "prepare for release"

# See what would be committed without actually doing it
submodule smart commit "prepare for release" --dry-run

# Include nested submodules in smart commit
submodule smart commit "prepare for release" --recursive
```

### Advanced Documentation

For comprehensive submodule management guidance, see:
- **[Worktrees & Submodules Guide](docs/worktrees-and-submodules.md)**: Complete policies, workflows, and troubleshooting
- **[Submodule Recovery Plan](spec/submodules-update.md)**: Recovery procedures for nested submodule failures
- **[Kanban Submodule Analysis](spec/kanban-submodule-comparison.md)**: Case study of divergent histories
- **[AGENTS.md](AGENTS.md)**: Agent-specific submodule management guidance and best practices
- **[CLI Migration Guide](docs/SUBMODULE_CLI_MIGRATION.md)**: Migration from bash scripts to Commander.js CLI

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
- **Authentication**: `orgs/open-hax/codex` ↔ `orgs/moofone/codex-ts-sdk` ↔ `orgs/openai/codex`
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

## riatzukiza Remote READMEs

<!-- BEGIN: RIATZUKIZA-READMES -->
- [riatzukiza/agent-shell](https://github.com/riatzukiza/agent-shell#readme)
- [riatzukiza/book-of-shadows](https://github.com/riatzukiza/book-of-shadows#readme)
- [riatzukiza/desktop](https://github.com/riatzukiza/desktop#readme)
- [riatzukiza/dotfiles](https://github.com/riatzukiza/dotfiles#readme)
- [riatzukiza/goblin-lessons](https://github.com/riatzukiza/goblin-lessons#readme)
- [riatzukiza/openhax](https://github.com/riatzukiza/openhax#readme)
- [riatzukiza/promethean](https://github.com/riatzukiza/promethean#readme)
- [riatzukiza/riatzukiza.github.io](https://github.com/riatzukiza/riatzukiza.github.io#readme)
- [riatzukiza/stt](https://github.com/riatzukiza/stt#readme)
<!-- END: RIATZUKIZA-READMES -->

## Support

For workspace-specific issues:
- Check `AGENTS.md` for development guidelines
- Review individual submodule README files
- Use workspace-level commands for cross-submodule operations
- Navigate using the `orgs/` structure for specific repositories

<!-- PACKAGE-DOC-MATRIX:START -->

> This section is auto-generated by scripts/package-doc-matrix.ts. Do not edit manually.

## Internal Dependencies

_None (external-only)._

## Internal Dependents

_None (external-only)._

_Last updated: 2025-11-16T11:25:38.889Z_

<!-- PACKAGE-DOC-MATRIX:END -->
