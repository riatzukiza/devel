# Master Cross-Reference Index

## 🌐 Repository Ecosystem Overview

This document provides a comprehensive index of all cross-references and interconnections between repositories in the development workspace. It serves as the central navigation hub for understanding dependencies, integration patterns, and shared tooling across the entire ecosystem.

## 📋 Repository Matrix

| Repository | Purpose | Primary Language | Key Dependencies |
|------------|---------|------------------|------------------|
| **[promethean](promethean/)** | Agent orchestration & enhancement | Clojure/TypeScript | clojure-mcp, agent-shell |
| **[stt](stt/)** | OpenCode development branches | TypeScript | opencode-hub, riatzukiza/openhax |
| **[agent-shell](agent-shell/)** | Emacs-based ACP shell | Emacs Lisp | promethean, clojure-mcp |
| **[clojure-mcp](clojure-mcp/)** | MCP server for Clojure | Clojure | promethean, agent-shell |
| **[opencode-openai-codex-auth](opencode-openai-codex-auth/)** | OAuth authentication | TypeScript | moofone/codex-ts-sdk |
| **[moofone/codex-ts-sdk](moofone/codex-ts-sdk/)** | TypeScript SDK | TypeScript | opencode-openai-codex-auth |
| **[opencode-hub](opencode-hub/)** | Package coordination | TypeScript | stt, riatzukiza/openhax |
| **[riatzukiza/openhax](riatzukiza/openhax/)** | Full-stack application | TypeScript | opencode-hub, stt |
| **[dotfiles](dotfiles/)** | Environment configuration | Shell/Emacs Lisp | All repositories |

## 🔗 Integration Patterns

### 🏗️ Development Infrastructure Pipeline

```
promethean (Agent Framework)
    ↕
agent-shell (ACP Protocol)
    ↕
clojure-mcp (REPL Development)
    ↕
dotfiles (Environment Setup)
```

**Key Integration Points:**
- **Agent Orchestration**: promethean ↔ agent-shell for ACP protocol communication
- **REPL Integration**: clojure-mcp ↔ promethean for enhanced development workflows
- **Environment Configuration**: dotfiles provides base configuration for all development tools

### 🔐 Authentication & SDK Pipeline

```
opencode-openai-codex-auth (OAuth)
    ↕
moofone/codex-ts-sdk (TypeScript SDK)
    ↕
openai/codex (Rust Runtime)
```

**Key Integration Points:**
- **Authentication Flow**: opencode-openai-codex-auth provides OAuth for SDK integration
- **TypeScript Integration**: moofone/codex-ts-sdk bridges authentication with cloud tasks
- **Runtime Support**: openai/codex provides Rust-based CLI and runtime capabilities

### 🌐 Web Development Pipeline

```
stt (OpenCode Development)
    ↕
opencode-hub (Package Coordination)
    ↕
riatzukiza/openhax (Full-Stack App)
    ↕
dotfiles (Environment)
```

**Key Integration Points:**
- **Development Branches**: stt manages multiple OpenCode development streams
- **Package Distribution**: opencode-hub coordinates package management across web projects
- **Application Framework**: riatzukiza/openhax provides full-stack patterns with Reactant + Fastify

## 🎯 Use Case Scenarios

### 🤖 Agent Development Workflow
1. **Setup**: dotfiles → base environment configuration
2. **Framework**: promethean → agent orchestration system
3. **Interface**: agent-shell → Emacs-based ACP protocol client
4. **Development**: clojure-mcp → REPL-driven development environment

### 🔐 Authentication Integration Workflow
1. **Authentication**: opencode-openai-codex-auth → OAuth plugin setup
2. **SDK Integration**: moofone/codex-ts-sdk → TypeScript SDK with cloud tasks
3. **Runtime**: openai/codex → Rust-based CLI and execution environment

### 🌐 Web Application Development Workflow
1. **Environment**: dotfiles → development environment setup
2. **Branch Management**: stt → OpenCode development branches
3. **Package Coordination**: opencode-hub → centralized package management
4. **Application**: riatzukiza/openhax → full-stack application development

## 📚 Cross-Reference Documentation

### Individual Repository Cross-References
Each repository maintains its own detailed cross-reference documentation:

#### **Development Infrastructure**
- **[promethean/CROSS_REFERENCES.md](promethean/CROSS_REFERENCES.md)** - Agent framework dependencies and integrations
- **[agent-shell/CROSS_REFERENCES.md](agent-shell/CROSS_REFERENCES.md)** - ACP protocol and Emacs integration patterns
- **[clojure-mcp/CROSS_REFERENCES.md](clojure-mcp/CROSS_REFERENCES.md)** - MCP server and REPL development workflows
- **[opencode-openai-codex-auth/CROSS_REFERENCES.md](opencode-openai-codex-auth/CROSS_REFERENCES.md)** - OAuth authentication and plugin patterns

#### **Tooling & SDKs**
- **[moofone/codex-ts-sdk/CROSS_REFERENCES.md](moofone/codex-ts-sdk/CROSS_REFERENCES.md)** - TypeScript SDK and cloud task integration
- **[openai/codex/AGENTS.md](openai/codex/AGENTS.md)** - Rust runtime and CLI documentation

#### **Web & Frontend**
- **[stt/CROSS_REFERENCES.md](stt/CROSS_REFERENCES.md)** - OpenCode development branch management
- **[opencode-hub/CROSS_REFERENCES.md](opencode-hub/CROSS_REFERENCES.md)** - Package coordination and distribution
- **[riatzukiza/openhax/CROSS_REFERENCES.md](riatzukiza/openhax/CROSS_REFERENCES.md)** - Full-stack application patterns

#### **Configuration & Environment**
- **[dotfiles/CROSS_REFERENCES.md](dotfiles/CROSS_REFERENCES.md)** - System configuration and environment setup

## 🔄 Dependency Flow Analysis

### Critical Path Dependencies
1. **Environment Foundation**: dotfiles → all repositories
2. **Agent Framework**: promethean → agent-shell → clojure-mcp
3. **Authentication**: opencode-openai-codex-auth → moofone/codex-ts-sdk → openai/codex
4. **Web Development**: stt → opencode-hub → riatzukiza/openhax

### Shared Tooling Dependencies
- **TypeScript/ESLint Configuration**: Workspace-level configuration shared across all TypeScript repositories
- **Git Submodule Management**: All repositories use consistent submodule patterns
- **Development Environment**: dotfiles provides base configuration for all development workflows

## 🛠️ Agent Decision Support

### Choosing the Right Tools

#### For Agent Development:
- **Primary**: promethean (agent orchestration)
- **Interface**: agent-shell (ACP protocol)
- **Development**: clojure-mcp (REPL-driven development)
- **Environment**: dotfiles (configuration)

#### For Authentication Integration:
- **OAuth**: opencode-openai-codex-auth
- **TypeScript SDK**: moofone/codex-ts-sdk
- **Runtime**: openai/codex

#### For Web Development:
- **Development Branches**: stt
- **Package Management**: opencode-hub
- **Full-Stack**: riatzukiza/openhax
- **Environment**: dotfiles

### Integration Best Practices

#### Cross-Repository Development:
1. **Start with Environment Setup**: Use dotfiles as foundation
2. **Follow Integration Patterns**: Use established pipelines for each domain
3. **Maintain Consistency**: Follow shared TypeScript/ESLint configurations
4. **Document Dependencies**: Keep cross-reference documentation updated

#### Tooling Reuse:
1. **Authentication Patterns**: OAuth integration from opencode-openai-codex-auth
2. **Agent Frameworks**: ACP protocol patterns from agent-shell
3. **Development Workflows**: REPL-driven development from clojure-mcp
4. **Package Management**: Coordination patterns from opencode-hub

## 📈 Ecosystem Evolution

### Current State
- **9 Active Repositories** with comprehensive cross-reference documentation
- **4 Integration Pipelines** covering major development domains
- **Consistent Documentation** across all repositories
- **Shared Tooling** and configuration management

### Future Expansion
- **New Repositories**: Follow established cross-reference patterns
- **Integration Updates**: Maintain pipeline documentation as dependencies evolve
- **Tooling Enhancement**: Extend shared configurations and best practices
- **Documentation Evolution**: Update master index as ecosystem grows

---

## 📍 Navigation

- **[Workspace Documentation](../AGENTS.md)**: Main workspace configuration and commands
- **[Git Submodules Documentation](reports/research/git-submodules-documentation.md)**: Detailed submodule analysis
- **[Repository Cross-References](../AGENTS.md#-repository-cross-references)**: Individual repository cross-reference links
- **[Development Patterns](../AGENTS.md#-high-value-patterns)**: Integration patterns and best practices

This master index serves as the central hub for navigating the entire repository ecosystem, enabling agents to make informed decisions about tooling, dependencies, and integration patterns.