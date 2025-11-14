# Git Submodules Documentation Analysis

## Executive Summary

This document provides a comprehensive analysis of the git submodules in the `/home/err/devel` multi-repository workspace, enabling agents to cross-reference dependencies, reuse tooling, and make informed decisions about development workflows.

## Repository Overview

The workspace contains **13 primary submodules** organized into several categories:

### 🏗️ Development Infrastructure
- **promethean** - Local LLM enhancement system and autonomous agent framework
- **open-hax/codex** - Open Hax Codex OAuth authentication plugin for opencode
- **agent-shell** - Emacs-based agent shell for ACP (Agent Client Protocol)
- **clojure-mcp** - MCP server for Clojure REPL-driven development

### 🔧 Tooling & SDKs
- **moofone/codex-ts-sdk** - TypeScript SDK for OpenAI Codex with cloud tasks
- **openai/codex** - Rust-based Codex CLI and runtime

### 🌐 Web & Frontend
- **stt** - Multiple opencode development branches and experiments
- **riatzukiza/openhax** - Full-stack application with Reactant + Fastify
- **opencode-hub** - Centralized opencode coordination

### ⚙️ Configuration & Environment
- **dotfiles** - System configuration and environment setup
- **riatzukiza/** - Personal workspace collection (desktop, book-of-shadows, etc.)

## Remote Repository URLs & Documentation

### Core Development Infrastructure

#### [promethean](https://github.com/riatzukiza/promethean)
**Purpose**: Local LLM enhancement system using cloud LLMs to make local models smarter
**Key Features**:
- Cloud LLM orchestration for local model enhancement
- Autonomous agent framework with task management
- Comprehensive package-based architecture
- AGENTS.md with detailed development practices

**Documentation Links**:
- [Main AGENTS.md](https://github.com/riatzukiza/promethean/blob/main/AGENTS.md)
- [README.md](https://github.com/riatzukiza/promethean/blob/main/README.md)
- [Package Documentation](https://github.com/riatzukiza/promethean/tree/main/docs)

**Cross-Reference Value**: High for agent orchestration, task management, and development workflow patterns

---

#### [open-hax/codex](https://github.com/open-hax/codex)
**Purpose**: OAuth authentication plugin enabling ChatGPT Plus/Pro backend access for opencode
**Key Features**:
- 7-step fetch flow for OpenAI platform → ChatGPT backend transformation
- OAuth token management with automatic refresh
- CODEX_MODE bridge for CLI parity
- Comprehensive request/response transformation pipeline

**Documentation Links**:
- [Main AGENTS.md](https://github.com/open-hax/codex/blob/main/AGENTS.md)
- [README.md](https://github.com/open-hax/codex/blob/main/README.md)
- [Architecture Documentation](https://github.com/open-hax/codex/tree/main/docs)

**Cross-Reference Value**: Critical for authentication patterns, OAuth flows, and backend API integration

---

#### [agent-shell](https://github.com/riatzukiza/agent-shell)
**Purpose**: Emacs shell for interacting with LLM agents via Agent Client Protocol (ACP)
**Key Features**:
- Native Emacs integration with comint-shell
- Multi-agent support (Claude Code, Codex, Gemini CLI, Goose, Qwen Code)
- Environment variable management and authentication
- Devcontainer support for containerized development

**Documentation Links**:
- [Main README.org](https://github.com/riatzukiza/agent-shell/blob/main/README.org)
- [Installation Guide](https://github.com/riatzukiza/agent-shell#setup)

**Cross-Reference Value**: High for agent protocol implementation, Emacs integration, and multi-agent workflows

---

#### [clojure-mcp](https://github.com/bhauman/clojure-mcp)
**Purpose**: MCP server for REPL-driven Clojure development with AI assistance
**Key Features**:
- nREPL integration with syntax-aware editing
- Comprehensive Clojure tooling (linting, formatting, paren balancing)
- Agent tools for autonomous code exploration
- Shadow-CLJS support for ClojureScript development

**Documentation Links**:
- [Main README.md](https://github.com/bhauman/clojure-mcp/blob/main/README.md)
- [Configuration Guide](https://github.com/bhauman/clojure-mcp/blob/main/doc/CONFIG.md)
- [Customization Documentation](https://github.com/bhauman/clojure-mcp/blob/main/doc/custom-mcp-server.md)

**Cross-Reference Value**: Essential for Clojure development, REPL patterns, and MCP server implementation

---

### Tooling & SDKs

#### [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk)
**Purpose**: TypeScript SDK for OpenAI Codex with cloud tasks and native Rust integration
**Key Features**:
- Native NAPI bindings to codex-rs for maximum performance
- Cloud tasks for remote code generation with best-of-N attempts
- Multi-conversation management with session persistence
- Real-time rate limit monitoring

**Documentation Links**:
- [Main README.md](https://github.com/moofone/codex-ts-sdk/blob/main/README.md)
- [Architecture Documentation](https://github.com/moofone/codex-ts-sdk/blob/main/docs/architecture.md)
- [Cloud Tasks API](https://github.com/moofone/codex-ts-sdk/blob/main/docs/cloud-tasks.md)

**Cross-Reference Value**: High for TypeScript integration, Codex SDK patterns, and cloud task workflows

---

#### [openai/codex](https://github.com/openai/codex)
**Purpose**: Rust-based Codex CLI and runtime for local AI-assisted development
**Key Features**:
- Native Rust performance with NAPI bindings
- Plan-based code generation with local execution
- Comprehensive tool ecosystem for file operations
- Enterprise-ready architecture with connection pooling

**Documentation Links**:
- [Main AGENTS.md](https://github.com/openai/codex/blob/main/AGENTS.md)
- [README.md](https://github.com/openai/codex/blob/main/README.md)
- [Rust Documentation](https://github.com/openai/codex/tree/main/codex-rs/docs)

**Cross-Reference Value**: Critical for Rust patterns, CLI tooling, and local AI development

---

### Web & Frontend Development

#### [stt](https://github.com/sst/opencode)
**Purpose**: Multiple opencode development branches and experimental features
**Key Features**:
- Multiple development branches for different features
- Bug fixes and experimental enhancements
- Clojure syntax highlighting improvements
- Windows virus false positive fixes

**Documentation Links**:
- [Main Repository](https://github.com/sst/opencode)
- [Individual Branch AGENTS.md files](https://github.com/sst/opencode/tree/main)

**Cross-Reference Value**: High for opencode development, feature branching strategies, and web development patterns

---

#### [riatzukiza/openhax](https://github.com/riatzukiza/openhax)
**Purpose**: Full-stack application with Reactant (ClojureScript) + Fastify backend
**Key Features**:
- Event-driven WebSocket communication
- GitHub API integration via Octokit
- Shadow-CLJS frontend with Reagent components
- Fastify TypeScript backend with Zod validation

**Documentation Links**:
- [Main AGENTS.md](https://github.com/riatzukiza/openhax/blob/main/AGENTS.md)
- [README.md](https://github.com/riatzukiza/openhax/blob/main/README.md)

**Cross-Reference Value**: High for full-stack patterns, ClojureScript/TypeScript integration, and real-time communication

---

#### [opencode-hub](https://github.com/numman-ali/opencode-hub)
**Purpose**: Centralized coordination system for opencode development and distribution
**Key Features**:
- Package management and distribution
- Development workflow coordination
- Centralized configuration management

**Documentation Links**:
- [Main README.md](https://github.com/numman-ali/opencode-hub/blob/main/README.md)
- [Package Documentation](https://github.com/numman-ali/opencode-hub/tree/main/docs)

**Cross-Reference Value**: Medium for package management, distribution patterns, and development coordination

---

### Configuration & Environment

#### [dotfiles](https://github.com/riatzukiza/dotfiles)
**Purpose**: System configuration, environment setup, and development tooling
**Key Features**:
- Cross-platform configuration (Linux/macOS)
- Development environment standardization
- Tool configuration and aliases
- AGENTS.md integration for opencode

**Documentation Links**:
- [Configuration AGENTS.md](https://github.com/riatzukiza/dotfiles/blob/main/.config/opencode/AGENTS.md)
- [Main Repository](https://github.com/riatzukiza/dotfiles)

**Cross-Reference Value**: High for environment setup, configuration management, and development standardization

---

## Dependency Relationships & Tooling Reuse

### 🔗 High-Value Cross-References

#### Authentication & OAuth Patterns
- **open-hax/codex** → **openai/codex**: OAuth implementation mirrors Codex CLI patterns
- **open-hax/codex** → **moofone/codex-ts-sdk**: TypeScript SDK integration patterns
- **agent-shell** → All agents: Universal authentication and environment management

#### Agent & Protocol Implementation
- **agent-shell** → **clojure-mcp**: ACP protocol implementation reference
- **promethean** → **clojure-mcp**: Agent orchestration and tool management patterns
- **promethean** → **open-hax/codex**: Plugin architecture and request transformation

#### Development Workflow Integration
- **clojure-mcp** → **promethean**: REPL-driven development patterns for agent enhancement
- **stt** → **open-hax/codex**: Plugin development and testing workflows
- **riatzukiza/openhax** → **agent-shell**: Emacs integration patterns for development

#### TypeScript & Rust Integration
- **moofone/codex-ts-sdk** → **openai/codex**: Native binding patterns and API compatibility
- **open-hax/codex** → **moofone/codex-ts-sdk**: SDK usage patterns and integration

### 🛠️ Recommended Tooling Reuse Patterns

#### For Authentication Development
1. **Reference**: `open-hax/codex` for OAuth flow implementation
2. **Patterns**: 7-step fetch flow, token refresh, request transformation
3. **Integration**: Use with `moofone/codex-ts-sdk` for TypeScript clients

#### For Agent Development
1. **Reference**: `agent-shell` for ACP protocol implementation
2. **Patterns**: Multi-agent support, environment management, container integration
3. **Integration**: Combine with `clojure-mcp` for language-specific tools

#### For Local AI Development
1. **Reference**: `promethean` for agent orchestration patterns
2. **Patterns**: Cloud LLM enhancement, task management, autonomous workflows
3. **Integration**: Use with `openai/codex` for local execution

#### For Full-Stack Development
1. **Reference**: `riatzukiza/openhax` for ClojureScript/TypeScript integration
2. **Patterns**: Event-driven architecture, WebSocket communication, real-time updates
3. **Integration**: Combine with `agent-shell` for development workflow

## Navigation Paths for Agents

### 🚀 Quick Start Decision Tree

#### **Need Authentication?**
→ `open-hax/codex` → OAuth patterns & token management
→ `moofone/codex-ts-sdk` → TypeScript SDK integration

#### **Building Agent Tools?**
→ `agent-shell` → ACP protocol & multi-agent support
→ `promethean` → Agent orchestration & task management
→ `clojure-mcp` → Language-specific tool implementation

#### **Local AI Integration?**
→ `openai/codex` → Rust CLI patterns & native bindings
→ `promethean` → Cloud LLM orchestration
→ `moofone/codex-ts-sdk` → TypeScript integration

#### **Web Development?**
→ `stt` → Opencode development & feature branching
→ `riatzukiza/openhax` → Full-stack ClojureScript/TypeScript
→ `opencode-hub` → Package management & distribution

#### **Environment Setup?**
→ `dotfiles` → System configuration & tooling
→ `agent-shell` → Multi-environment support

### 📚 Documentation Access Patterns

#### **Implementation Patterns**
1. **Architecture Reference**: `promethean/docs/` for system design
2. **API Integration**: `open-hax/codex/AGENTS.md` for request flows
3. **Protocol Implementation**: `agent-shell/README.org` for ACP patterns
4. **Language Tools**: `clojure-mcp/README.md` for MCP server implementation

#### **Development Workflows**
1. **REPL-Driven**: `clojure-mcp` for interactive development
2. **Cloud-Enhanced**: `promethean` for local LLM enhancement
3. **Container-Based**: `agent-shell` for DevContainer support
4. **TypeScript Integration**: `moofone/codex-ts-sdk` for SDK patterns

## AGENTS.md File Locations & Updates

### Current AGENTS.md Files
| Location | Purpose | Last Updated |
|----------|---------|--------------|
| `/home/err/devel/AGENTS.md` | Workspace-level commands and style | Current |
| `/home/err/devel/openai/codex/AGENTS.md` | Rust/Codex development patterns | Current |
| `/home/err/devel/orgs/open-hax/codex/AGENTS.md` | OAuth plugin development | Current |
| `/home/err/devel/promethean/AGENTS.md` | Agent orchestration practices | Current |
| `/home/err/devel/stt/opencode/AGENTS.md` | Opencode development | Current |
| `/home/err/devel/riatzukiza/openhax/AGENTS.md` | Full-stack development | Current |

### Recommended AGENTS.md Enhancements

#### **Missing AGENTS.md Files to Create**:
1. `agent-shell/AGENTS.md` - For ACP protocol patterns
2. `clojure-mcp/AGENTS.md` - For MCP server development
3. `moofone/codex-ts-sdk/AGENTS.md` - For TypeScript SDK patterns
4. `stt/AGENTS.md` - For opencode development coordination
5. `riatzukiza/openhax/AGENTS.md` - ✅ Already exists
6. `opencode-hub/AGENTS.md` - For package management patterns

#### **Cross-Reference Sections to Add**:
Each AGENTS.md should include:
- **Related Repositories**: Links to complementary submodules
- **Integration Patterns**: How to combine with other tools
- **Dependency Decisions**: When to choose this tool over alternatives
- **Workflow Integration**: How this fits into larger development pipelines

## Conclusion

This multi-repository workspace provides a comprehensive ecosystem for AI-assisted development, from low-level Rust tooling to high-level agent orchestration. The submodules are well-architected for cross-compatibility and tool reuse, with clear separation of concerns:

- **Infrastructure Layer**: Authentication, protocols, and agent frameworks
- **Tooling Layer**: SDKs, CLIs, and development utilities  
- **Application Layer**: Web applications, coordination systems, and user interfaces
- **Configuration Layer**: Environment setup and system integration

Agents can use this documentation to make informed decisions about which tools to use for specific tasks, how to integrate them effectively, and what patterns to follow for consistent development across the ecosystem.

The modular architecture enables selective adoption of components while maintaining compatibility, making it ideal for both focused development and comprehensive AI-assisted workflows.