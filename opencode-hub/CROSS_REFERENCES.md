# OpenCode Hub Cross-Reference Documentation

> Centralized coordination system for OpenCode development and distribution with comprehensive repository cross-references

## 🔗 Repository Cross-References

This document provides comprehensive cross-references to all related repositories in the OpenCode ecosystem, enabling agents to navigate between package management, distribution workflows, and integration patterns seamlessly.

### 🏗️ Development Infrastructure Dependencies

#### **Agent Development & Orchestration**
- **[promethean](https://github.com/riatzukiza/promethean)** - Local LLM enhancement system and autonomous agent framework
  - [AGENTS.md](https://github.com/riatzukiza/promethean/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/promethean/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/riatzukiza/promethean/blob/main/README.md)
  - **Integration**: Package distribution for Promethean agent ecosystem

#### **Agent Shell Integration**
- **[agent-shell](https://github.com/riatzukiza/agent-shell)** - Emacs-based agent shell for ACP (Agent Client Protocol)
  - [AGENTS.md](https://github.com/riatzukiza/agent-shell/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/agent-shell/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/riatzukiza/agent-shell/blob/main/README.org)
  - **Integration**: Package management for Agent Shell plugins and extensions

### 🔧 Authentication & SDK Dependencies

#### **OAuth Authentication**
- **[opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth)** - OpenAI Codex OAuth authentication plugin
  - [AGENTS.md](https://github.com/numman-ali/opencode-openai-codex-auth/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/numman-ali/opencode-openai-codex-auth/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/numman-ali/opencode-openai-codex-auth/blob/main/README.md)
  - **Integration**: Plugin distribution and version management

#### **TypeScript SDK Integration**
- **[moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk)** - TypeScript SDK for OpenAI Codex with cloud tasks
  - [AGENTS.md](https://github.com/moofone/codex-ts-sdk/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/moofone/codex-ts-sdk/blob/main/CROSS_REFERENCES.md)
  - [README.md](https://github.com/moofone/codex-ts-sdk/blob/main/README.md)
  - **Integration**: SDK distribution and package management

#### **Rust-Based Runtime**
- **[openai/codex](https://github.com/openai/codex)** - Rust-based Codex CLI and runtime
  - [AGENTS.md](https://github.com/openai/codex/blob/main/AGENTS.md)
  - [README.md](https://github.com/openai/codex/blob/main/README.md)
  - **Integration**: Runtime package distribution and version coordination

### 🌐 Web & Frontend Integration

#### **OpenCode Development**
- **[stt](https://github.com/riatzukiza/devel/tree/main/stt)** - Multiple opencode development branches and experiments
  - [AGENTS.md](https://github.com/riatzukiza/devel/blob/main/stt/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/riatzukiza/devel/blob/main/stt/CROSS_REFERENCES.md)
  - **Integration**: Development branch coordination and package distribution

#### **Full-Stack Applications**
- **[riatzukiza/openhax](https://github.com/riatzukiza/openhax)** - Full-stack application with Reactant + Fastify
  - [AGENTS.md](https://github.com/riatzukiza/openhax/blob/main/AGENTS.md)
  - **Integration**: Full-stack package distribution and coordination

### ⚙️ Configuration & Environment

#### **System Configuration**
- **[dotfiles](https://github.com/riatzukiza/devel/tree/main/dotfiles)** - System configuration and environment setup
  - [AGENTS.md](https://github.com/riatzukiza/devel/blob/main/dotfiles/.config/opencode/AGENTS.md)
  - **Integration**: Environment setup for package management and distribution

### 🔌 Language Integration

#### **Clojure Integration**
- **[clojure-mcp](https://github.com/bhauman/clojure-mcp)** - MCP server for Clojure REPL-driven development
  - [AGENTS.md](https://github.com/bhauman/clojure-mcp/blob/main/AGENTS.md)
  - [CROSS_REFERENCES.md](https://github.com/bhauman/clojure-mcp/blob/main/CROSS_REFERENCES.md)
  - **Integration**: Clojure package distribution and coordination

## 🔄 Package Management Integration Patterns

### **Plugin Distribution Management**
#### **OpenCode Plugin Ecosystem**
- **Authentication Plugin**: Distribute [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth) through hub
- **Version Management**: Coordinate plugin versions across OpenCode branches
- **Registry Management**: Centralized plugin discovery and installation

#### **Plugin Distribution Workflow**
```bash
# Plugin packaging and distribution
cd ../opencode-openai-codex-auth
pnpm build

# Hub plugin management
pnpm package:plugin opencode-openai-codex-auth
pnpm publish:plugin
pnpm update:registry

# Version coordination
pnpm version:patch
pnpm changelog
```

### **Development Branch Coordination**
#### **STT Branch Management**
- **Branch Coordination**: Manage [stt](https://github.com/riatzukiza/devel/tree/main/stt) development branches
- **Feature Integration**: Coordinate feature branch packaging
- **Release Management**: Handle branch-specific releases

#### **Development Coordination Workflow**
```bash
# STT branch coordination
cd ../stt/opencode && bun build
cd ../stt/opencode-feat-clojure-syntax-highlighting && bun build

# Hub coordination
pnpm package:dev stt-opencode
pnpm package:dev stt-clojure-syntax
pnpm bundle

# Release management
pnpm version:minor
pnpm publish
```

### **Package Architecture Management**
#### **Promethean Package Ecosystem**
- **Agent Packages**: Distribute [promethean](https://github.com/riatzukiza/promethean) agent packages
- **Architecture Coordination**: Manage package-based architecture patterns
- **Version Compatibility**: Ensure cross-package compatibility

#### **Package Architecture Workflow**
```bash
# Promethean package management
cd ../promethean && pnpm build

# Hub package coordination
pnpm package:dev promethean-agent
pnpm package:dev promethean-orchestrator
pnpm bundle

# Distribution
pnpm publish:package
pnpm update:registry
```

### **SDK Distribution Management**
#### **TypeScript SDK Ecosystem**
- **SDK Distribution**: Manage [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) releases
- **Version Coordination**: Coordinate SDK versions with runtime compatibility
- **Registry Management**: Centralized SDK discovery and installation

#### **SDK Distribution Workflow**
```bash
# SDK build and packaging
cd ../moofone/codex-ts-sdk
npm run package

# Hub SDK management
pnpm package:sdk codex-ts-sdk
pnpm publish:sdk
pnpm update:registry

# Version compatibility
pnpm version:minor
pnpm changelog
```

### **Runtime Distribution**
#### **Rust Runtime Management**
- **Runtime Packages**: Distribute [openai/codex](https://github.com/openai/codex) runtime packages
- **Platform Coordination**: Manage cross-platform runtime distribution
- **Version Matching**: Ensure SDK-runtime compatibility

#### **Runtime Distribution Workflow**
```bash
# Runtime build and packaging
cd ../openai/codex && cargo build --release

# Hub runtime management
pnpm package:runtime codex-rust
pnpm publish:runtime
pnpm update:registry

# Platform coordination
pnpm bundle:platforms
```

## 🔄 Cross-Repository Development Workflows

### **Package Distribution Workflow**
1. **Source Preparation**: Build packages from source repositories
2. **Package Creation**: Create distribution bundles with hub
3. **Version Management**: Coordinate versions across ecosystem
4. **Registry Update**: Update centralized package registry
5. **Distribution**: Publish to package registries

### **Development Coordination Workflow**
1. **Branch Management**: Coordinate development branches across repositories
2. **Integration Testing**: Test package integration across ecosystem
3. **Release Planning**: Coordinate release schedules
4. **Documentation**: Update cross-references and integration guides

### **Version Compatibility Workflow**
1. **Compatibility Matrix**: Maintain compatibility between packages
2. **Version Coordination**: Ensure cross-repository version alignment
3. **Dependency Management**: Manage inter-package dependencies
4. **Migration Support**: Provide migration paths for version updates

## 📋 Quick Reference Commands

### **Cross-Repository Package Management**
```bash
# Full ecosystem package management
cd ../opencode-openai-codex-auth && pnpm build
cd ../moofone/codex-ts-sdk && npm run package
cd ../promethean && pnpm build
cd ../stt/opencode && bun build

# Hub package coordination
pnpm package:plugin
pnpm package:sdk
pnpm package:dev
pnpm bundle
```

### **Distribution Management**
```bash
# Plugin distribution
pnpm publish:plugin
pnpm update:registry

# SDK distribution
pnpm publish:sdk
pnpm update:registry

# Development package distribution
pnpm publish:package
pnpm update:registry
```

### **Version Management**
```bash
# Version coordination
pnpm version:patch
pnpm version:minor
pnpm version:major

# Changelog generation
pnpm changelog

# Compatibility validation
pnpm validate:compatibility
```

## 🎯 Decision Trees for Agents

### **Choosing Distribution Pattern**
- **Plugin distribution?** → [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth) + plugin registry
- **SDK distribution?** → [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) + version coordination
- **Development coordination?** → [stt](https://github.com/riatzukiza/devel/tree/main/stt) + branch management
- **Package architecture?** → [promethean](https://github.com/riatzukiza/promethean) + ecosystem coordination

### **Integration Complexity**
- **Simple**: Single package distribution
- **Medium**: Multiple packages with version coordination
- **Complex**: Full ecosystem coordination with compatibility management

## 📚 Additional Documentation

- **[Workspace Documentation](https://github.com/riatzukiza/devel/blob/main/AGENTS.md)** - Main workspace coordination
- **[Repository Index](https://github.com/riatzukiza/devel/blob/main/REPOSITORY_INDEX.md)** - Complete repository overview
- **[Git Submodules Documentation](https://github.com/riatzukiza/devel/blob/main/docs/reports/research/git-submodules-documentation.md)** - Technical submodule details
- **[Promethean Cross-References](https://github.com/riatzukiza/promethean/blob/main/CROSS_REFERENCES.md)** - Agent framework integration
- **[STT Cross-References](https://github.com/riatzukiza/devel/blob/main/stt/CROSS_REFERENCES.md)** - Development coordination

## 🌐 External Resources

- **[Main Documentation](https://github.com/numman-ali/opencode-hub/blob/main/README.md)** - Official hub documentation
- **[Package Documentation](https://github.com/numman-ali/opencode-hub/tree/main/docs)** - Package management guides
- **[API Reference](https://github.com/numman-ali/opencode-hub/blob/main/docs/api.md)** - Hub API documentation

---

## License

Check LICENSE file in repository