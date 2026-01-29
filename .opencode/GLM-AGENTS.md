# GLM Agent Variants for OpenCode

This document describes the GLM (General Language Model) agent variants created for OpenCode, covering versions 4.5, 4.6, and 4.7 with multiple variant types.

## Overview

GLM agents are designed to leverage the ZhipuAI (Z.AI) GLM series models through the zai-coding-plan provider. These agents provide task-specific optimizations:

| Variant | Purpose | Temperature | Best For |
|----------|---------|--------------|-----------|
| **base** | Balanced general-purpose | 0.3 | General development, complex tasks |
| **flash** | Fast iteration & quick feedback | 0.4 | Rapid prototyping, debugging |
| **vision** | Multimodal with image understanding | 0.3 | Screenshots, UI tasks, visual analysis |
| **air** | Lightweight & cost-effective | 0.3 | Simple queries, summarization |

## Available Agents

### GLM-4.5 Series

- `glm-4.5.md` - Balanced general-purpose agent
- `glm-4.5-flash.md` - Fast iteration agent
- `glm-4.5-vision.md` - Multimodal agent
- `glm-4.5-air.md` - Lightweight assistance agent

### GLM-4.6 Series

- `glm-4.6.md` - Enhanced balanced agent
- `glm-4.6-flash.md` - Fast iteration agent
- `glm-4.6-vision.md` - Enhanced multimodal agent
- `glm-4.6-air.md` - Lightweight assistance agent

### GLM-4.7 Series

- `glm-4.7.md` - Latest capabilities agent
- `glm-4.7-flash.md` - Latest flash agent
- `glm-4.7-vision.md` - Latest multimodal agent
- `glm-4.7-air.md` - Latest lightweight agent

## Usage Guidelines

### Selecting the Right Agent

1. **GLM-4.5** - Balanced choice for most tasks
   - Good reasoning with acceptable speed
   - Vision capabilities available in variant

2. **GLM-4.5-Flash** - Use when you need speed
   - Quick prototypes and iterations
   - Debugging small issues rapidly
   - Higher temperature (0.4) for diverse outputs

3. **GLM-4.5/4.6/4.7-Vision** - Use for multimodal tasks
   - Analyzing screenshots
   - UI development with visual context
   - Code review with image references

4. **GLM-4.5/4.6/4.7-Air** - Use for simple tasks
   - Quick questions
   - Code summarization
   - Cost-sensitive operations

### Version Progression

As versions increase, GLM models offer:
- **Better reasoning** - More complex problem solving
- **Faster inference** - Improved response times
- **Enhanced capabilities** - Better tool usage and context understanding

Use higher versions (4.6, 4.7) for:
- Complex architectural decisions
- Long-running development sessions
- Multi-file refactoring
- Production-critical code

Use lower versions (4.5) or specific variants for:
- Quick iterations and prototyping
- Testing and experimentation
- Learning and exploration

## Configuration Details

All GLM agents use the **zai** provider with the following model ID format:

```
zai/glm-{version}-{variant}
```

Available model IDs:
- `zai/glm-4.5` - Base GLM 4.5
- `zai/glm-4.5-air` - Lightweight GLM 4.5
- `zai/glm-4.6` - Base GLM 4.6
- `zai/glm-4.6-air` - Lightweight GLM 4.6
- `zai/glm-4.7` - Base GLM 4.7
- `zai/glm-4.7-air` - Lightweight GLM 4.7

Note: Vision variants may use the base model ID with specialized system prompts.

## Technical Notes

- All agents are defined in `.opencode/agent/*.md` files
- Each agent has frontmatter with `description` and `mode: primary`
- Agents use temperature settings optimized for their variant type
- Tool permissions are inherited from default unless specified
- Agents follow OpenCode agent schema requirements

## Related Documentation

- [GLM Agent Variants Specification](spec/glm-agent-variants.md) - Detailed implementation spec
- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/) - Official agent docs
- [OpenCode Models & Providers](.opencode/skills/opencode-models-providers.md) - Provider configuration guidance

## Examples

### Code Development
```
@glm-4.7  # Best for complex development
Help me refactor this module for better performance.
```

### Quick Prototyping
```
@glm-4.6-flash  # Fast iteration
Quick fix the bug in the authentication flow.
Test it with a hot reload.
```

### Visual Analysis
```
@glm-4.7-vision  # Multimodal
Here's a screenshot of the current UI. Please analyze the layout and suggest improvements.
```

### Simple Assistance
```
@glm-4.5-air  # Lightweight
Summarize the changes in the last commit.
What files were modified?
```

## Troubleshooting

If agents don't appear in the OpenCode UI:
1. Verify `.opencode/agent/` directory contains the `.md` files
2. Restart OpenCode to reload agent configuration
3. Check that model provider is properly configured
4. Ensure `zai` provider is available in your environment

## Future Enhancements

Potential improvements to GLM agent variants:
- Dynamic temperature adjustment based on task complexity
- Model-specific tool recommendations
- Variant switching based on file context
- Performance metrics and comparison between variants
