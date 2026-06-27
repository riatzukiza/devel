# Riatzukiza OpenHax Cross-Reference Documentation

> Full-stack application with Reactant + Fastify and comprehensive repository cross-references

## 🔗 Repository Cross-References

This document provides comprehensive cross-references to all related repositories in the full-stack development ecosystem, enabling agents to navigate between related tools, frameworks, and integration patterns seamlessly.

### 🏗️ Development Infrastructure Dependencies

#### **Agent Development & Orchestration**
- **[promethean](https://github.com/riatzukiza/promethean)** - Local LLM enhancement system and autonomous agent framework
  - [AGENTS.md](https://github.com/riatzukiza/promethean/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/promethean/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/riatzukiza/promethean/blob/main/README.md)
  - **Integration**: Agent orchestration for full-stack application enhancement

#### **Agent Shell Integration**
- **[agent-shell](https://github.com/riatzukiza/agent-shell)** - Emacs-based agent shell for ACP (Agent Client Protocol)
  - [AGENTS.md](https://github.com/riatzukiza/agent-shell/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/agent-shell/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/riatzukiza/agent-shell/blob/main/README.org)
  - **Integration**: Agent-based development workflow for full-stack applications

### 🔧 Authentication & SDK Dependencies

#### **OAuth Authentication**
- **[open-hax/codex](https://github.com/open-hax/codex)** - OpenAI Codex OAuth authentication plugin
  - [AGENTS.md](https://github.com/open-hax/codex/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/open-hax/codex/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/open-hax/codex/blob/main/README.md)
  - **Integration**: Authentication patterns for full-stack applications

#### **TypeScript SDK Integration**
- **[moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk)** - TypeScript SDK for OpenAI Codex with cloud tasks
  - [AGENTS.md](https://github.com/moofone/codex-ts-sdk/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/moofone/codex-ts-sdk/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/moofone/codex-ts-sdk/blob/main/README.md)
  - **Integration**: TypeScript SDK patterns for backend services

#### **Rust-Based Runtime**
- **[openai/codex](https://github.com/openai/codex)** - Rust-based Codex CLI and runtime
  - [AGENTS.md](https://github.com/openai/codex/blob/main/AGENTS.md)
  - [README.md](https://github.com/openai/codex/blob/main/README.md)
  - **Integration**: High-performance runtime components for full-stack applications

### 🌐 Web & Frontend Integration

#### **OpenCode Development**
- **[stt](https://github.com/riatzukiza/devel/tree/main/stt)** - Multiple opencode development branches and experiments
  - [AGENTS.md](https://github.com/riatzukiza/devel/blob/main/stt/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/devel/blob/main/stt/CROSS_REFERENCES.md)
  - **Integration**: Web development patterns and frontend components

- **[opencode-hub](https://github.com/riatzukiza/devel/tree/main/opencode-hub)** - Centralized opencode coordination and distribution
  - [AGENTS.md](https://github.com/riatzukiza/devel/blob/main/opencode-hub/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/devel/blob/main/opencode-hub/CROSS_REFERENCES.md)
  - [README.md](https://github.com/riatzukiza/devel/blob/main/opencode-hub/README.md)
  - **Integration**: Package management and distribution for full-stack applications

### ⚙️ Configuration & Environment

#### **System Configuration**
- **[dotfiles](https://github.com/riatzukiza/devel/tree/main/dotfiles)** - System configuration and environment setup
  - [AGENTS.md](https://github.com/riatzukiza/devel/blob/main/dotfiles/.config/opencode/AGENTS.md)
  - **Integration**: Development environment setup for full-stack applications

### 🔌 Language Integration

#### **Clojure Integration**
- **[clojure-mcp](https://github.com/bhauman/clojure-mcp)** - MCP server for Clojure REPL-driven development
  - [AGENTS.md](https://github.com/bhauman/clojure-mcp/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/bhauman/clojure-mcp/blob/main/CROSS_REFERENCES.md)
  - **Integration**: ClojureScript frontend development patterns

## 🔄 Full-Stack Integration Patterns

### **TypeScript Backend Integration**
#### **Fastify Server Development**
- **Authentication Patterns**: Use [open-hax/codex](https://github.com/open-hax/codex) patterns
- **SDK Integration**: Integrate [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) for AI capabilities
- **Agent Enhancement**: Use [promethean](https://github.com/riatzukiza/promethean) agents for backend enhancement

#### **Backend Development Workflow**
```bash
# Backend development with TypeScript
cd services/agentd && pnpm dev

# Authentication integration
cd ../open-hax/codex && pnpm build
# Integrate auth patterns into Fastify server

# SDK integration
cd ../moofone/codex-ts-sdk && npm run package
# Use SDK in backend services

# Agent enhancement
cd ../promethean && pnpm --filter @promethean-os/backend-enhancer start
```

### **ClojureScript Frontend Integration**
#### **Reagent Component Development**
- **Language Support**: Use [clojure-mcp](https://github.com/bhauman/clojure-mcp) patterns for ClojureScript development
- **Web Components**: Integrate with [stt](https://github.com/riatzukiza/devel/tree/main/stt) web development patterns
- **Agent Shell**: Use [agent-shell](https://github.com/riatzukiza/agent-shell) for development workflow

#### **Frontend Development Workflow**
```bash
# ClojureScript frontend development
cd packages/opencode-reactant && pnpm dev
npx shadow-cljs compile app

# Language integration
cd ../clojure-mcp && pnpm install
# Use MCP patterns for ClojureScript development

# Web component integration
cd ../stt/opencode && bun dev
# Integrate web components

# Agent Shell development
cd ../agent-shell && emacs agent-shell.el
# Use for development workflow
```

### **Full-Stack Authentication**
#### **Cross-Platform Authentication**
- **OAuth Integration**: Use [open-hax/codex](https://github.com/open-hax/codex) patterns
- **TypeScript Backend**: Fastify authentication middleware
- **ClojureScript Frontend**: Authentication state management with atoms

#### **Authentication Development**
```bash
# Authentication pattern integration
cd ../open-hax/codex && pnpm build

# Backend authentication
cd services/agentd
# Integrate OAuth patterns into Fastify middleware

# Frontend authentication
cd packages/opencode-reactant
# Implement authentication state with Reagent atoms

# Cross-platform testing
pnpm test:authentication
```

### **AI Integration**
#### **Full-Stack AI Capabilities**
- **Backend AI**: Use [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) in TypeScript backend
- **Agent Orchestration**: Use [promethean](https://github.com/riatzukiza/promethean) for AI agent management
- **Frontend AI**: ClojureScript components for AI interaction

#### **AI Integration Development**
```bash
# Backend AI integration
cd ../moofone/codex-ts-sdk && npm run package
cd services/agentd && pnpm dev
# Integrate SDK for AI capabilities

# Agent orchestration
cd ../promethean && pnpm --filter @promethean-os/agent start
# Use agents for AI task management

# Frontend AI components
cd packages/opencode-reactant
# Develop Reagent components for AI interaction
```

### **Package Management Integration**
#### **Full-Stack Package Distribution**
- **Hub Integration**: Use [opencode-hub](https://github.com/riatzukiza/devel/tree/main/opencode-hub) for package distribution
- **Version Management**: Coordinate frontend and backend package versions
- **Dependency Management**: Manage cross-language dependencies

#### **Package Management Workflow**
```bash
# Package development
pnpm build

# Hub distribution
cd ../opencode-hub && pnpm package:dev openhax
pnpm publish:package

# Version coordination
pnpm version:patch
pnpm changelog
```

## 🔄 Cross-Repository Development Workflows

### **Full-Stack Development Workflow**
1. **Backend Development**: TypeScript Fastify services with AI integration
2. **Frontend Development**: ClojureScript Reagent components
3. **Authentication Integration**: OAuth patterns across full stack
4. **Agent Enhancement**: AI agent orchestration for application enhancement
5. **Package Distribution**: Distribute through [opencode-hub](https://github.com/riatzukiza/devel/tree/main/opencode-hub)

### **AI-Enhanced Development Workflow**
1. **SDK Integration**: Use [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) for backend AI
2. **Agent Orchestration**: Use [promethean](https://github.com/riatzukiza/promethean) for AI management
3. **Authentication**: Use [open-hax/codex](https://github.com/open-hax/codex) patterns
4. **Development Tools**: Use [agent-shell](https://github.com/riatzukiza/agent-shell) for development workflow
5. **Testing**: Comprehensive testing across all integration points

### **Cross-Language Integration Workflow**
1. **TypeScript Backend**: Fastify services with full type safety
2. **ClojureScript Frontend**: Reagent components with reactive state
3. **Language Bridge**: Seamless integration between TypeScript and ClojureScript
4. **Shared Patterns**: Common development patterns across languages
5. **Documentation**: Comprehensive cross-references and integration guides

## 📋 Quick Reference Commands

### **Full-Stack Development**
```bash
# Complete development environment
pnpm dev  # Both frontend (8700) and backend (8787)

# Individual services
cd packages/opencode-reactant && pnpm dev  # Frontend only
cd services/agentd && pnpm dev  # Backend only

# ClojureScript compilation
npx shadow-cljs compile app  # Development
npx shadow-cljs release app  # Production
```

### **Cross-Repository Integration**
```bash
# AI integration
cd ../moofone/codex-ts-sdk && npm run package
cd ../promethean && pnpm build

# Authentication integration
cd ../open-hax/codex && pnpm build

# Development tools
cd ../agent-shell && emacs agent-shell.el

# Package distribution
cd ../opencode-hub && pnpm package:dev openhax
```

### **Testing Integration**
```bash
# Full-stack testing
pnpm test

# Cross-repository testing
cd ../promethean && pnpm --filter @promethean-os/test-runner run --suite openhax
cd ../moofone/codex-ts-sdk && npm test --integration
```

## 🎯 Decision Trees for Agents

### **Choosing Integration Pattern**
- **Full-stack TypeScript?** → Backend services + [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk)
- **ClojureScript frontend?** → Reagent components + [clojure-mcp](https://github.com/bhauman/clojure-mcp) patterns
- **AI integration?** → [promethean](https://github.com/riatzukiza/promethean) + [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk)
- **Authentication?** → [open-hax/codex](https://github.com/open-hax/codex) patterns
- **Package distribution?** → [opencode-hub](https://github.com/riatzukiza/devel/tree/main/opencode-hub)

### **Integration Complexity**
- **Simple**: Basic full-stack with TypeScript backend + ClojureScript frontend
- **Medium**: Full-stack + authentication + basic AI integration
- **Complex**: Full ecosystem with AI agents + authentication + package distribution

## 📚 Additional Documentation

- **[Workspace Documentation](https://github.com/riatzukiza/devel/blob/main/AGENTS.md)** - Main workspace coordination
- **[Repository Index](https://github.com/riatzukiza/devel/blob/main/REPOSITORY_INDEX.md)** - Complete repository overview
- **[Git Submodules Documentation](https://github.com/riatzukiza/devel/blob/main/docs/reports/research/git-submodules-documentation.md)** - Technical submodule details
- **[Promethean Cross-References](https://github.com/riatzukiza/promethean/blob/main/CROSS_REFERENCES.md)** - Agent framework integration
- **[STT Cross-References](https://github.com/riatzukiza/devel/blob/main/stt/CROSS_REFERENCES.md)** - Web development integration

## 🌐 External Resources

- **[Reactant Documentation](https://reactant.github.io/)** - Reactant framework documentation
- **[Fastify Documentation](https://www.fastify.io/)** - Fastify web framework
- **[Reagent Documentation](https://reagent-project.github.io/)** - Reagent ClojureScript wrapper
- **[Shadow-CLJS Documentation](https://shadow-cljs.org/)** - ClojureScript compilation tool

---

## License

Check LICENSE file in repository