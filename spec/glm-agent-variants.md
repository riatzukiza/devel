---
uuid: 2ace916e-1db7-40ba-905f-b50af690e11f
title: "GLM Model Variants for OpenCode Agents"
slug: glm-agent-variants
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.408448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# GLM Model Variants for OpenCode Agents

## Executive Summary

This specification defines a comprehensive set of OpenCode agents for the GLM (General Language Model) series from versions 4.5 through 4.7, including all variants (base, flash, air, vision) using the zai-coding-plan provider.

## Background

### Current State

- **Provider**: zai-coding-plan provider is already integrated
- **Existing Models**: `zai/glm-4.5` and `zai/glm-4.5-air` are available
- **Provider ID**: `zai`
- **Model Format**: `zai/glm-{version}-{variant}`

### Observed Model IDs

From the codebase (`orgs/sst/opencode/node_modules/@ai-sdk+gateway`):
- `zai/glm-4.5` - Base model
- `zai/glm-4.5-air` - Lightweight variant
- `zai/glm-4.5v` - Version variant

### Environment Variable

- Current active model: `zai-coding-plan/glm-4.7`
- Suggests GLM-4.7 base model is available or planned

## Requirements

### Functional Requirements

1. **Create 9 new agent variants** covering:
   - GLM-4.5: base, flash, air, vision
   - GLM-4.6: base, flash, air, vision
   - GLM-4.7: base, flash, air, vision

2. **Each agent should have**:
   - Distinct system prompt optimized for its model variant
   - Appropriate temperature setting for the model's capabilities
   - Model ID and provider ID configured correctly
   - Description highlighting the variant's strengths
   - Appropriate permissions for its use case

3. **Variant Characteristics**:

   | Variant | Description | Use Case | Temperature |
   |----------|-------------|----------|--------------|
   | **base** | Full capabilities, balanced performance | General-purpose tasks, complex reasoning | 0.3 |
   | **flash** | Fast inference, optimized for speed | Quick responses, simple tasks, iterations | 0.2-0.5 |
   | **air** | Lightweight, cost-effective | Simple queries, summarization, basic assistance | 0.3 |
   | **vision** | Multimodal, image understanding | Code screenshot analysis, UI tasks, multimodal inputs | 0.3 |

4. **Agent Categories**:
   - **glm-{version}**: Balanced all-purpose agent (base model)
   - **glm-{version}-flash**: Fast iteration agent (flash variant)
   - **glm-{version}-air**: Lightweight assistance agent (air variant)
   - **glm-{version}-vision**: Multimodal agent (vision variant)

## Implementation Plan

### Phase 1: GLM-4.5 Series

**Status**: Partially complete (base and air exist, flash and vision needed)

#### Tasks
1. Create `glm-4.5.md` agent (if not exists)
   - Model: `zai/glm-4.5`
   - Temperature: 0.3
   - Permissions: Full edit, bash, webfetch
   - Use case: Balanced general-purpose agent

2. Create `glm-4.5-flash.md` agent
   - Model: `zai/glm-4.5` or `zai/glm-4.5-flash` (verify correct ID)
   - Temperature: 0.4
   - Focus: Fast iterations, quick feedback
   - Permissions: Same as base

3. Create `glm-4.5-vision.md` agent
   - Model: `zai/glm-4.5-vision` (if exists) or multimodal variant
   - Temperature: 0.3
   - Special prompt for multimodal understanding
   - Vision-specific capabilities documented

4. Update `glm-4.5-air.md` agent (if exists)
   - Review and optimize for lightweight use cases
   - Ensure temperature aligns with cost/efficiency goals

### Phase 2: GLM-4.6 Series

**Status**: New implementation needed

#### Tasks
1. Create `glm-4.6.md` agent
   - Model: `zai/glm-4.6`
   - Temperature: 0.3
   - Improved reasoning capabilities
   - Use case: General-purpose with better capabilities than 4.5

2. Create `glm-4.6-flash.md` agent
   - Model: `zai/glm-4.6-flash` or `zai/glm-4.6`
   - Temperature: 0.4
   - Faster inference with 4.6 improvements
   - Optimized for quick iterations

3. Create `glm-4.6-vision.md` agent
   - Model: `zai/glm-4.6-vision` (if exists)
   - Temperature: 0.3
   - Enhanced multimodal understanding
   - Better vision capabilities than 4.5

4. Create `glm-4.6-air.md` agent
   - Model: `zai/glm-4.6-air` or `zai/glm-4.6`
   - Temperature: 0.3
   - Lightweight with 4.6 improvements
   - Cost-effective variant

### Phase 3: GLM-4.7 Series

**Status**: New implementation needed

#### Tasks
1. Create `glm-4.7.md` agent
   - Model: `zai/glm-4.7`
   - Temperature: 0.3
   - Latest capabilities, best reasoning
   - Use case: Primary agent for complex tasks

2. Create `glm-4.7-flash.md` agent
   - Model: `zai/glm-4.7-flash` or `zai/glm-4.7`
   - Temperature: 0.4
   - Latest flash variant
   - Optimized for rapid development

3. Create `glm-4.7-vision.md` agent
   - Model: `zai/glm-4.7-vision` (if exists) or multimodal
   - Temperature: 0.3
   - Latest vision capabilities
   - Best multimodal performance

4. Create `glm-4.7-air.md` agent
   - Model: `zai/glm-4.7-air` or `zai/glm-4.7`
   - Temperature: 0.3
   - Latest lightweight variant
   - Best cost-efficiency

## Agent Configuration Schema

Each agent will follow the OpenCode agent configuration format:

```yaml
---
description: [Agent description]
mode: [primary|subagent]
# Optional: temperature: [0.0-1.0]
# Optional: permission: [Permission config]
# Optional: tools: [Tool permissions]
---
```

### Required Fields

- **`description`**: Brief description of when to use this agent
- **`mode`**: `"primary"` for user-selectable agents, `"subagent"` for internal agents

### Optional Fields

- **`temperature`**: Model temperature (default varies by variant)
- **`permission`**: Override default permissions if needed
- **`tools`**: Specific tool enable/disable patterns
- **`extends`**: Reference to base agent to inherit from

## File Structure

```
.opencode/agent/
├── glm-4.5.md              (base, may exist)
├── glm-4.5-flash.md         (new)
├── glm-4.5-vision.md        (new)
├── glm-4.5-air.md            (exists, review)
├── glm-4.6.md              (new)
├── glm-4.6-flash.md         (new)
├── glm-4.6-vision.md        (new)
├── glm-4.6-air.md            (new)
├── glm-4.7.md              (new)
├── glm-4.7-flash.md         (new)
├── glm-4.7-vision.md        (new)
└── glm-4.7-air.md            (new)
```

## Agent Templates

### Base Model Template

```markdown
---
description: Use this agent for balanced general-purpose tasks with GLM {VERSION}
mode: primary
---

You are a general-purpose AI coding agent optimized for GLM {VERSION}.

Use balanced temperature (0.3) for most tasks. You have strong reasoning capabilities and can handle complex programming challenges, architectural decisions, and multi-file changes.

**When to use**:
- General development tasks
- Code review and refactoring
- Complex problem solving
- Feature implementation
- Architectural guidance

**Strengths**:
- Balanced performance across all task types
- Strong reasoning and context understanding
- Good for both exploration and implementation
```

### Flash Variant Template

```markdown
---
description: Use this agent for fast iteration and quick feedback with GLM {VERSION}
mode: primary
---

You are a fast iteration agent optimized for GLM {VERSION} flash variant.

Use slightly higher temperature (0.4) to encourage faster responses and more diverse outputs. Focus on quick turnaround and rapid feedback loops.

**When to use**:
- Rapid prototyping
- Quick code fixes
- Iterative development
- Tasks requiring many small changes
- Fast-paced debugging

**Strengths**:
- Fast inference speed
- Quick turnaround
- Efficient for multiple small iterations
```

### Vision Variant Template

```markdown
---
description: Use this agent for multimodal tasks with GLM {VERSION} vision capabilities
mode: primary
---

You are a multimodal AI agent optimized for GLM {VERSION} with vision understanding.

Use balanced temperature (0.3) and leverage vision capabilities for screenshots, images, and visual context. You can analyze UI elements, code screenshots, and design mockups.

**When to use**:
- Analyzing code screenshots
- UI development tasks
- Understanding visual layouts
- Multimodal input tasks
- Documentation from screenshots

**Strengths**:
- Vision and image understanding
- Multimodal context processing
- Code + visual analysis

**Special Instructions**:
- When provided with images, describe visual elements before writing code
- Reference UI components seen in screenshots
- Connect visual feedback to code changes
```

### Air Variant Template

```markdown
---
description: Use this agent for lightweight assistance with GLM {VERSION} air variant
mode: primary
---

You are a lightweight assistance agent optimized for GLM {VERSION} air variant.

Use balanced temperature (0.3) with focus on efficiency. Provide concise, direct responses for simple tasks, summarization, and quick assistance.

**When to use**:
- Simple queries
- Code summarization
- Basic assistance
- Cost-sensitive tasks
- Quick questions

**Strengths**:
- Lightweight and fast
- Cost-effective
- Efficient for simple tasks
```

## Testing Strategy

### Unit Testing

1. **Agent Loading**:
   - Verify each agent loads without errors
   - Check frontmatter parsing
   - Validate model ID format

2. **Model Selection**:
   - Test agent can be selected via UI
   - Verify correct model is used
   - Check provider is `zai`

3. **Prompt Integration**:
   - Verify system prompt is applied
   - Test variant-specific behaviors
   - Check tool permissions

### Integration Testing

1. **Agent Switching**:
   - Switch between variants during session
   - Verify correct model is activated
   - Check context preservation

2. **Cross-Task**:
   - Use different agents for different task types
   - Verify appropriate behavior per variant
   - Test permission boundaries

## Success Criteria

### Definition of Done

- [ ] All 12 agent files created (9 new + 3 existing verified)
- [ ] Each agent has valid frontmatter
- [ ] All agents use correct model IDs
- [ ] Temperature settings appropriate for variant
- [ ] Descriptions match use cases
- [ ] All agents can be loaded by OpenCode
- [ ] Documentation created for usage
- [ ] AGENTS.md updated with new agents

### Rollout Criteria

- [ ] Phase 1 (GLM-4.5) agents complete and tested
- [ ] Phase 2 (GLM-4.6) agents complete and tested
- [ ] Phase 3 (GLM-4.7) agents complete and tested
- [ ] All phases integrated
- [ ] User documentation complete

## Notes and Considerations

### Model ID Uncertainty

- Exact model IDs for flash and vision variants need verification
- May need to use base model ID with different system prompts
- AI SDK gateway should be consulted for exact IDs

### Backward Compatibility

- Existing agents (`docs.md`, `git-committer.md`) should remain functional
- New agents should not break existing workflows
- Agent switching should be seamless

### Performance Characteristics

| Version | Reasoning | Speed | Vision | Best For |
|----------|-----------|------|--------|-----------|
| 4.5 | Good | Good | Yes (vision variant) | Balanced performance |
| 4.6 | Better | Better | Yes (vision variant) | Improved capabilities |
| 4.7 | Best | Best | Yes (vision variant) | Latest features |

## References

- [OpenCode Agents Documentation](https://opencode.ai/docs/agents/)
- [OpenCode Agent Schema](https://opencode.ai/docs/agents/schema/)
- [ZhipuAI GLM Documentation](https://github.com/THUDM/GLM-4)
- [AI SDK Gateway](https://github.com/ai-sdk/gateway)
- [AI SDK ZAI Provider](https://github.com/ai-sdk/provider-zai)

## Change Log

### 2026-01-28

- Initial spec created
- Research completed on existing GLM-4.5 integration
- Planning phase for full GLM series implementation
