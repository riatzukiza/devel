# Repository Cross-Reference Index

## 🚀 Quick Navigation

This index provides rapid access to all repositories and their specialized capabilities in the multi-repository development workspace.

## 📋 Repository Quick Reference

| Repository | Purpose | Key Features | AGENTS.md |
|-------------|---------|---------------|------------|
| [promethean](promethean/) | Local LLM Enhancement | Agent orchestration, cloud LLM integration | ✅ |
| [opencode-openai-codex-auth](opencode-openai-codex-auth/) | OAuth Authentication | 7-step fetch flow, token management | ✅ |
| [agent-shell](agent-shell/) | Emacs Agent Shell | ACP protocol, multi-agent support | ✅ |
| [clojure-mcp](clojure-mcp/) | Clojure MCP Server | REPL-driven development, syntax-aware editing | ✅ |
| [moofone/codex-ts-sdk](moofone/codex-ts-sdk/) | TypeScript SDK | Native Rust integration, cloud tasks | ✅ |
| [openai/codex](openai/codex/) | Rust Codex CLI | Plan-based generation, local execution | ✅ |
| [stt](stt/) | OpenCode Development | Multiple branches, feature experiments | ✅ |
| [riatzukiza/openhax](riatzukiza/openhax/) | Full-Stack App | ClojureScript + TypeScript, real-time | ✅ |
| [opencode-hub](opencode-hub/) | Package Distribution | Centralized coordination, management | ✅ |
| [dotfiles](dotfiles/) | Environment Setup | System configuration, tooling | 📄 |
| [riatzukiza/desktop](riatzukiza/desktop/) | Desktop Environment | Personal workspace setup | 📄 |
| [riatzukiza/book-of-shadows](riatzukiza/book-of-shadows/) | Knowledge Base | Personal documentation | 📄 |

## 🎯 Decision Tree for Common Tasks

### **Need Authentication?**
```
OAuth Implementation → opencode-openai-codex-auth
TypeScript Integration → moofone/codex-ts-sdk
Rust CLI Patterns → openai/codex
```

### **Building Agent Tools?**
```
Protocol Implementation → agent-shell
Language-Specific Tools → clojure-mcp
Agent Orchestration → promethean
```

### **Local AI Development?**
```
Rust Performance → openai/codex
TypeScript SDK → moofone/codex-ts-sdk
Cloud Enhancement → promethean
```

### **Web Development?**
```
OpenCode Core → stt/opencode
Full-Stack App → riatzukiza/openhax
Package Management → opencode-hub
```

### **Environment Setup?**
```
System Config → dotfiles
Development Tools → All AGENTS.md files
Cross-Platform → agent-shell (DevContainer)
```

## 🔗 Integration Patterns

### **Authentication Ecosystem**
- **opencode-openai-codex-auth** provides OAuth patterns
- **moofone/codex-ts-sdk** implements TypeScript SDK
- **openai/codex** defines Rust CLI standards
- **agent-shell** offers multi-provider authentication

### **Agent Development Stack**
- **agent-shell**: ACP protocol reference
- **clojure-mcp**: Language-specific implementation
- **promethean**: High-level orchestration
- **stt**: Development workflow integration

### **Full-Stack Development**
- **riatzukiza/openhax**: ClojureScript frontend + TypeScript backend
- **stt**: Multiple development branches
- **opencode-hub**: Distribution and coordination

## 📚 Documentation Resources

### **Comprehensive Analysis**
- [Git Submodules Documentation](docs/reports/research/git-submodules-documentation.md) - Complete analysis with cross-references

### **Remote Documentation**
- [promethean](https://github.com/riatzukiza/promethean) - Agent orchestration
- [opencode-openai-codex-auth](https://github.com/numman-ali/opencode-openai-codex-auth) - OAuth patterns
- [agent-shell](https://github.com/riatzukiza/agent-shell) - ACP implementation
- [clojure-mcp](https://github.com/bhauman/clojure-mcp) - MCP server patterns
- [moofone/codex-ts-sdk](https://github.com/moofone/codex-ts-sdk) - TypeScript SDK
- [openai/codex](https://github.com/openai/codex) - Rust CLI
- [stt](https://github.com/sst/opencode) - OpenCode development
- [riatzukiza/openhax](https://github.com/riatzukiza/openhax) - Full-stack patterns
- [opencode-hub](https://github.com/numman-ali/opencode-hub) - Package management

## 🛠️ Quick Start Commands

### **Workspace Level**
```bash
# Lint all TypeScript
pnpm lint

# Type check everything
pnpm typecheck

# Build workspace
pnpm build

# Run main utility
bun run src/hack.ts
```

### **Agent Development**
```bash
# Start promethean agent
cd promethean && pnpm --filter @promethean-os/<pkg> start

# Start Clojure MCP server
cd clojure-mcp && clojure -X:mcp :port 7888

# Start agent shell in Emacs
M-x agent-shell
```

### **Web Development**
```bash
# OpenCode development
cd stt/opencode && bun dev

# Full-stack development
cd riatzukiza/openhax && pnpm dev

# Package management
cd opencode-hub && pnpm build
```

### **Authentication Development**
```bash
# TypeScript SDK development
cd moofone/codex-ts-sdk && npm run setup

# OAuth plugin development
cd opencode-openai-codex-auth && npm run build

# Rust CLI development
cd openai/codex && cargo build
```

## 🎯 Agent Decision Support

This workspace enables agents to make informed decisions about:

1. **Tool Selection**: Choose the right tool for specific tasks
2. **Integration Patterns**: Understand how tools work together
3. **Development Workflows**: Follow established patterns
4. **Cross-Reference**: Leverage existing solutions and patterns
5. **Architecture Decisions**: Make informed choices about system design

## 📖 Usage Guidelines

1. **Start Here**: Use this index to identify relevant repositories
2. **Read AGENTS.md**: Each repository has detailed development guidelines
3. **Follow Patterns**: Use established integration patterns
4. **Cross-Reference**: Leverage relationships between repositories
5. **Contribute Back**: Share improvements with the ecosystem

---

*This index is part of the comprehensive documentation system. See [Git Submodules Documentation](docs/reports/research/git-submodules-documentation.md) for detailed analysis.*