---
title: OpenCode Customization Agents Specification
type: spec
component: tooling
priority: medium
status: proposed
workflow-state: incoming
related-issues: []
estimated-effort: TBD
updated_at: 2026-02-10
---

# OpenCode Customization Agents Specification

## Overview
Create specialized agents for different aspects of customizing OpenCode. Each agent has deep knowledge of their domain and awareness of other agents for collaboration.

## Agents to Create

1. **plugin-development** - Plugin creation, events, hooks, patterns
2. **custom-tools** - Custom tool development with TypeScript/JavaScript
3. **agent-skills** - Agent skill creation and management
4. **configuration** - Opencode config (themes, keybinds, commands, formatters)
5. **server-sdk** - Server setup and SDK integration
6. **permissions-security** - Permissions, MCP servers, security policies
7. **integration** - IDE plugins, external services, web/IDE interfaces

## Each Agent Must Include

- Agent configuration file with name, description, tools, permissions
- AGENTS.md file with domain-specific rules and patterns
- Knowledge of all other agent names for cross-referencing
- Access to OpenCode documentation URLs
- Specialized commands/prompts for their domain

## Documentation URLs Available

- https://opencode.ai/docs
- https://opencode.ai/docs/plugins/
- https://opencode.ai/docs/custom-tools/
- https://opencode.ai/docs/skills/
- https://opencode.ai/docs/tools/
- https://opencode.ai/docs/rules/
- https://opencode.ai/docs/agents/
- https://opencode.ai/docs/models/
- https://opencode.ai/docs/commands/
- https://opencode.ai/docs/server/
- https://opencode.ai/docs/sdk/
- https://opencode.ai/docs/ecosystem/

## Agent Collaboration Rules

- Each agent should reference other agents when appropriate
- Example: plugin-development agent should suggest custom-tools agent for adding tools to plugins
- Each agent has a "Related Agents" section in their AGENTS.md

## Definition of Done

- All 7 agents created with configuration and AGENTS.md files
- Each agent has tools: webfetch, skill, read, write, glob, grep
- Each agent references other agents appropriately
- Agents are testable via `/agent <agent-name>` command
- Documentation includes examples and troubleshooting

## Requirements

- Follow OpenCode agent configuration format
- Use TypeScript examples where applicable
- Include best practices and common patterns
- Provide code examples for each domain
- Reference official documentation URLs
