---
uuid: 066e6413-bde6-4ca2-868b-400438a0c06f
title: "GLM Model Variants for OpenCode - Analysis & Implementation Plan"
slug: glm-model-variants-analysis
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
# GLM Model Variants for OpenCode - Analysis & Implementation Plan

## Executive Summary

This document provides a comprehensive analysis of the GLM (General Language Model) model series from Z.AI's zai-coding-plan provider and provides a detailed implementation plan for integrating GLM 4.5, 4.6, and 4.7 model variants into OpenCode.

## Current State Analysis

### Existing zai-coding-plan Integration

**Current Configuration:**
- Provider ID: `zai-coding-plan`
- Auth Method: `Z_AI_API_KEY` environment variable
- Existing Models: GLM-4.6, GLM-4.5, GLM-4.5v
- Config Format: Custom provider in opencode.json with apiKey: `{env:Z_AI_API_KEY}`

**Evidence from Codebase:**

From `/home/err/devel/orgs/riatzukiza/promethean/opencode.json`:
```json
{
  "provider": {
    "zai-coding-plan": {
      "provider": "custom",
      "apiKey": "{env:Z_AI_API_KEY}",
      "disabled": false,
      "models": {
        "glm-4.6": {
          "name": "GLM-4.6",
          "options": {
            "thinking": {
              "enabled": true
            }
          }
        },
        "glm-4.5": {
          "name": "GLM-4.5",
          "options": {
            "thinking": {
              "enabled": true
            }
          }
        },
        "glm-4.5v": {
          "name": "GLM-4.5v",
          "options": {
            "thinking": {
              "enabled": true
            }
          }
        }
      }
    }
  }
}
```

**Migration Pattern:**
- Script: `/home/err/devel/orgs/riatzukiza/promethean/scripts/migrate-opencode-config.cjs`
- Converts old config format to: `{ provider: 'custom', apiKey: '{env:Z_AI_API_KEY}', disabled: false }`
- Demonstrates environment-based authentication pattern

### OpenCode Model System Architecture

**Core Files:**
1. `/home/err/devel/orgs/sst/opencode/packages/opencode/src/provider/models.ts`
   - Model schema (Zod validation)
   - Provider schema with models mapping
   - Fetch mechanism from models.dev API

2. `/home/err/devel/orgs/sst/opencode/packages/opencode/src/provider/provider.ts`
   - CUSTOM_LOADERS registry for provider-specific logic
   - Provider merging and state management
   - SDK integration points

3. `/home/err/devel/orgs/sst/opencode/packages/opencode/src/config/config.ts`
   - Config.Info schema (provider map, model, small_model)
   - Config loading and merging logic

**Model Schema (from models.ts):**
```typescript
Model = z.object({
  id: z.string(),
  name: z.string(),
  release_date: z.string(),
  attachment: z.boolean(),
  reasoning: z.boolean(),
  temperature: z.boolean(),
  tool_call: z.boolean(),
  cost: z.object({
    input: z.number(),
    output: z.number(),
    cache_read: z.number().optional(),
    cache_write: z.number().optional(),
    context_over_200k: z.object({ ... }).optional()
  }),
  limit: z.object({
    context: z.number(),
    output: z.number(),
  }),
  modalities: z.object({
    input: z.array(z.enum(["text", "audio", "image", "video", "pdf"])),
    output: z.array(z.enum(["text", "audio", "image", "video", "pdf"]))
  }).optional(),
  experimental: z.boolean().optional(),
  status: z.enum(["alpha", "beta", "deprecated"]).optional(),
  options: z.record(z.string(), z.any()),
  headers: z.record(z.string(), z.string()).optional(),
  provider: z.object({ npm: z.string() }).optional()
})
```

## GLM Model Series Research

### GLM-4.5 Series

**Flagship Model: GLM-4.5**
- Parameters: 355B total, 32B active
- Context: 200K tokens
- Capabilities:
  - Strong reasoning and coding
  - Agentic tasks
  - Tool invocation
  - Multilingual support
  - Benchmark: 63.2% (12 industry-standard benchmarks)

**Variants:**
1. **GLM-4.5-Air**
   - Parameters: 106B total, 12B active
   - Position: Cost-effective lightweight
   - Use case: Quick responses, lower latency
   - Benchmark: 59.8%

2. **GLM-4.5-Flash**
   - Position: Ultra-fast variant
   - Use case: High-throughput scenarios
   - Optimized for: Speed and efficiency

3. **GLM-4.5-X**
   - Position: High performance
   - Use case: Production workloads
   - Optimized for: Balanced speed and quality

4. **GLM-4.5-AirX**
   - Parameters: Lightweight
   - Position: Ultra-fast
   - Use case: Edge computing, real-time
   - Optimized for: Minimal latency

### GLM-4.6 Series

**Flagship Model: GLM-4.6**
- Parameters: Advanced (exact count not specified, larger than 4.5)
- Context: 200K tokens
- Capabilities:
  - Advanced agentic reasoning
  - Complex task completion
  - Tool collaboration
  - Multimodal interaction support
  - Superior coding performance
  - Benchmarks:
    - Terminal Bench 2.0: +16.5%
    - HLE: +12.4%

**Key Improvements over 4.5:**
- Longer context window
- Superior coding benchmarks
- Enhanced reasoning with tool use
- More capable agent workflows

### GLM-4.7 Series

**Flagship Model: GLM-4.7**
- Parameters: 30B MoE (Mixture-of-Experts) architecture
- Context: 200K tokens
- Capabilities:
  - **Latest flagship model**
  - Multi-step reasoning and execution
  - Enhanced agent-oriented applications
  - Web browsing capabilities
  - Professional content creation (PPTs, posters)
  - Benchmarks:
    - SWE-bench: +16.5%
    - SWE-bench Multilingual: +12.9%
    - Terminal Bench 2.0: +16.5%

**Special Features:**
- **Interleaved Thinking**: Thinking before every response/tool call
- **Preserved Thinking**: Retains thinking blocks across multi-turn conversations
- **Turn-level Thinking**: Per-turn control over reasoning

**Variants:**
1. **GLM-4.7-Flash**
   - Position: Free coding model
   - Pricing: Unlimited free API access
   - Capabilities:
     - 30B MoE architecture
     - Open weights on Hugging Face
     - No credit card required
   - Use case: Local coding and agentic assistance

2. **Additional Variants** (based on 4.5 series pattern):
   - **GLM-4.7-Air**: Cost-effective lightweight (expected)
   - **GLM-4.7-X**: High performance (expected)
   - **GLM-4.7-AirX**: Ultra-fast variant (expected)

## Implementation Plan

### Phase 1: Provider Integration

**Step 1.1: Add zai-coding-plan to CUSTOM_LOADERS**

Location: `/home/err/devel/orgs/sst/opencode/packages/opencode/src/provider/provider.ts`

Add to `CUSTOM_LOADERS` object:
```typescript
"zai-coding-plan": async (input) => {
  const hasKey = process.env["Z_AI_API_KEY"] || await Auth.get("zai-coding-plan")
  if (!hasKey) {
    for (const [key, value] of Object.entries(input.models)) {
      if (value.cost.input === 0) continue
      delete input.models[key]
    }
    return {
      autoload: false,
    }
  }

  return {
    autoload: true,
    options: {
      headers: {
        "Authorization": `Bearer ${process.env["Z_AI_API_KEY"]}`,
        "User-Agent": "OpenCode/1.0",
      },
    },
    async getModel(sdk, modelID, options) {
      // Map zai-coding-plan model IDs to SDK format
      // zai-coding-plan uses: glm-4.x series format
      const id = modelID.replace("glm-", "GLM-")
      return sdk.languageModel(id)
    },
  }
}
```

**Step 1.2: Add Provider Schema to models.dev API**

The models.dev API already supports zai-coding-plan. Verify the following models are registered:

- **GLM-4.5 Series:**
  - `glm-4.5` / `GLM-4.5`
  - `glm-4.5-air` / `GLM-4.5-Air`
  - `glm-4.5-flash` / `GLM-4.5-Flash`
  - `glm-4.5-x` / `GLM-4.5-X`
  - `glm-4.5-airx` / `GLM-4.5-AirX`

- **GLM-4.6 Series:**
  - `glm-4.6` / `GLM-4.6`
  - Additional variants if available

- **GLM-4.7 Series:**
  - `glm-4.7` / `GLM-4.7`
  - `glm-4.7-flash` / `GLM-4.7-Flash`
  - Additional variants if available

### Phase 2: Model Configuration

**Step 2.1: Define Model Entries**

Create comprehensive model definitions following the Model schema:

```typescript
{
  "glm-4.7": {
    "id": "glm-4.7",
    "name": "GLM-4.7",
    "release_date": "2025-01-28",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.15, // Estimated based on Z.ai pricing
      "output": 0.40,
      "cache_read": 0.0375,
      "cache_write": 0.075,
      "context_over_200k": {
        "input": 0.30,
        "output": 0.40
      }
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "beta",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  },
  "glm-4.7-flash": {
    "id": "glm-4.7-flash",
    "name": "GLM-4.7-Flash",
    "release_date": "2025-01-28",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.00, // Free model
      "output": 0.00,
      "cache_read": 0.00,
      "cache_write": 0.00
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "beta",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  },
  "glm-4.6": {
    "id": "glm-4.6",
    "name": "GLM-4.6",
    "release_date": "2025-09-30",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.25,
      "output": 0.50,
      "cache_read": 0.0625,
      "cache_write": 0.125,
      "context_over_200k": {
        "input": 0.50,
        "output": 0.50
      }
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "stable",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  },
  "glm-4.5": {
    "id": "glm-4.5",
    "name": "GLM-4.5",
    "release_date": "2025-07-28",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.30,
      "output": 0.60,
      "cache_read": 0.075,
      "cache_write": 0.15,
      "context_over_200k": {
        "input": 0.60,
        "output": 0.60
      }
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "stable",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  },
  "glm-4.5-air": {
    "id": "glm-4.5-air",
    "name": "GLM-4.5-Air",
    "release_date": "2025-07-28",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.15,
      "output": 0.30,
      "cache_read": 0.0375,
      "cache_write": 0.075,
      "context_over_200k": {
        "input": 0.30,
        "output": 0.30
      }
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "stable",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  },
  "glm-4.5-flash": {
    "id": "glm-4.5-flash",
    "name": "GLM-4.5-Flash",
    "release_date": "2025-07-28",
    "attachment": false,
    "reasoning": true,
    "temperature": true,
    "tool_call": true,
    "cost": {
      "input": 0.08,
      "output": 0.16,
      "cache_read": 0.02,
      "cache_write": 0.04,
      "context_over_200k": {
        "input": 0.16,
        "output": 0.16
      }
    },
    "limit": {
      "context": 200000,
      "output": 128000
    },
    "modalities": {
      "input": ["text"],
      "output": ["text"]
    },
    "experimental": false,
    "status": "stable",
    "options": {
      "thinking": {
        "enabled": true
      }
    }
  }
}
```

**Step 2.2: Add Provider Entry to Config**

Update opencode.json configuration:
```json
{
  "provider": {
    "zai-coding-plan": {
      "provider": "custom",
      "apiKey": "{env:Z_AI_API_KEY}",
      "disabled": false,
      "models": {
        "glm-4.7": {
          "name": "GLM-4.7 (Latest Flagship)"
        },
        "glm-4.7-flash": {
          "name": "GLM-4.7-Flash (Free)"
        },
        "glm-4.6": {
          "name": "GLM-4.6 (Advanced Agentic)"
        },
        "glm-4.5": {
          "name": "GLM-4.5 (Flagship)"
        },
        "glm-4.5-air": {
          "name": "GLM-4.5-Air (Lightweight)"
        },
        "glm-4.5-flash": {
          "name": "GLM-4.5-Flash (Fast)"
        }
      }
    }
  }
}
```

### Phase 3: UI Integration

**Step 3.1: Update Model Colors**

Location: `/home/err/devel/orgs/sst/opencode/packages/console/app/src/routes/workspace/[id]/graph-section.tsx`

Add to `MODEL_COLORS`:
```typescript
MODEL_COLORS = {
  // ... existing colors ...
  "glm-4.7": "#7B2CD5", // Distinct color for 4.7
  "glm-4.7-flash": "#00FF7F", // Flash variant
  "glm-4.6": "#14B8A6", // Existing color, keep or update
  "glm-4.5": "#00C853", // Distinct color for 4.5
  "glm-4.5-air": "#4CAF50", // Air variant
  "glm-4.5-flash": "#FF9800", // Flash variant
}
```

**Step 3.2: Update Lab Labels**

Location: `/home/err/devel/orgs/sst/opencode/packages/console/app/src/routes/workspace/[id]/model-section.tsx`

Add lab mapping:
```typescript
function getModelLab(modelId: string): string {
  const labMap: Record<string, string> = {
    // ... existing mappings ...
    "glm-4.7": "Z.ai",
    "glm-4.7-flash": "Z.ai",
    "glm-4.5": "Z.ai",
    "glm-4.5-air": "Z.ai",
    "glm-4.5-flash": "Z.ai",
    // Keep existing:
    "glm-4.6": "Z.ai",
  }

  return labMap[modelId] || ""
}
```

### Phase 4: Documentation

**Step 4.1: Update Provider Documentation**

Update: `/home/err/devel/.opencode/skills/opencode-models-providers.md`

Add reference to zai-coding-plan GLM models:
```markdown
## zai-coding-plan Provider

- **Models Available**: GLM-4.5, GLM-4.6, GLM-4.7 series
- **Authentication**: `Z_AI_API_KEY` environment variable
- **Features**:
  - 200K context window
  - Advanced reasoning with interleaved thinking
  - Tool calling support
  - Multimodal capabilities (GLM-4.7)
- **Variants**:
  - GLM-4.7-Flash: Free, unlimited access
  - GLM-4.5-Air: Cost-effective lightweight
  - GLM-4.5-Flash: Ultra-fast responses
```

**Step 4.2: Update Installation Guide**

Update: `/home/err/devel/spec/oh-my-opencode-installation.md`

Add CLI flag examples:
```markdown
### zai-coding-plan Models

Enable zai-coding-plan provider:

```bash
opencode --zai-coding-plan=yes
```

Available models:
- `zai-coding-plan/glm-4.7` - Latest flagship with 30B MoE
- `zai-coding-plan/glm-4.7-flash` - Free model, unlimited API access
- `zai-coding-plan/glm-4.6` - Advanced agentic reasoning
- `zai-coding-plan/glm-4.5` - Flagship model
- `zai-coding-plan/glm-4.5-air` - Cost-effective lightweight
- `zai-coding-plan/glm-4.5-flash` - Ultra-fast variant

Usage examples:

```json
{
  "provider": {
    "zai-coding-plan": {
      "apiKey": "{env:Z_AI_API_KEY}",
      "models": {
        "glm-4.7": {
          "name": "GLM-4.7 (Latest Flagship)"
        }
      }
    }
  }
}
```

## Testing & Validation

### Phase 5: Testing Checklist

**Provider Integration:**
- [ ] Verify zai-coding-plan appears in `/models` command output
- [ ] Test authentication with `Z_AI_API_KEY`
- [ ] Validate model selection (glm-4.7, glm-4.6, glm-4.5 variants)
- [ ] Test thinking toggle functionality
- [ ] Verify context window (200K tokens)
- [ ] Test tool calling capabilities

**Model Behavior:**
- [ ] Verify GLM-4.7 performance benchmarks
- [ ] Test interleaved thinking (preserved across turns)
- [ ] Validate turn-level thinking control
- [ ] Test GLM-4.7-Flash free access
- [ ] Compare GLM-4.6 vs GLM-4.7 capabilities
- [ ] Test variant switching (Air, Flash, standard)

**UI Integration:**
- [ ] Verify model colors display correctly
- [ ] Check lab labels (Z.ai)
- [ ] Test model list filtering
- [ ] Verify cost graph rendering
- [ ] Test model selection interface

**Backward Compatibility:**
- [ ] Ensure existing GLM-4.6 configurations still work
- [ ] Verify GLM-4.5 configurations are preserved
- [ ] Test migration from old format to new provider
- [ ] Validate environment variable auth continues to work

## Migration Strategy

### From Existing Configurations

**Current GLM Users:**
- Projects with `zai-coding-plan` provider
- Models in use: glm-4.6, glm-4.5, glm-4.5v
- Configuration: Custom provider with `Z_AI_API_KEY`

**Migration Path:**
1. No migration required for existing users
2. New models (GLM-4.7 series) will be automatically available
3. Optional: Update default model from `glm-4.6` to `glm-4.7` in opencode.json

### Configuration Templates

**Minimal Configuration:**
```json
{
  "provider": {
    "zai-coding-plan": {
      "provider": "custom",
      "apiKey": "{env:Z_AI_API_KEY}",
      "disabled": false
    }
  }
}
```

**With Default Model:**
```json
{
  "provider": {
    "zai-coding-plan": {
      "provider": "custom",
      "apiKey": "{env:Z_AI_API_KEY}",
      "disabled": false,
      "models": {
        "glm-4.7": {
          "name": "GLM-4.7"
        }
      }
    }
  }
}
```

**With Model Variants:**
```json
{
  "provider": {
    "zai-coding-plan": {
      "provider": "custom",
      "apiKey": "{env:Z_AI_API_KEY}",
      "disabled": false,
      "models": {
        "glm-4.7": {
          "name": "GLM-4.7 (Flagship)"
        },
        "glm-4.7-flash": {
          "name": "GLM-4.7-Flash (Free)"
        },
        "glm-4.6": {
          "name": "GLM-4.6 (Advanced)"
        },
        "glm-4.5": {
          "name": "GLM-4.5 (Flagship)"
        },
        "glm-4.5-air": {
          "name": "GLM-4.5-Air (Lightweight)"
        },
        "glm-4.5-flash": {
          "name": "GLM-4.5-Flash (Fast)"
        }
      }
    }
  }
}
```

## Definition of Done

This implementation is complete when:

1. **Provider Integration:**
   - zai-coding-plan added to `CUSTOM_LOADERS` in provider.ts
   - Authentication via `Z_AI_API_KEY` environment variable
   - Model ID mapping implemented (glm-4.x → GLM-4.x)

2. **Model Configuration:**
   - All GLM 4.5, 4.6, 4.7 series models defined
   - Variants (Flash, Air, standard) configured
   - Correct cost structures and capabilities
   - Options for thinking enabled

3. **UI Integration:**
   - Model colors added for all GLM variants
   - Lab labels set to "Z.ai"
   - Model list updated

4. **Documentation:**
   - Provider docs updated with GLM details
   - Installation guide updated with CLI flags
   - Configuration examples provided

5. **Testing:**
   - All test cases pass
   - Backward compatibility verified
   - Performance benchmarks validated

## Implementation Priority

### Phase 1: Core Provider (HIGH)
1. Add zai-coding-plan to CUSTOM_LOADERS
2. Implement getModel() mapping
3. Add authentication headers
4. Test provider initialization

### Phase 2: Model Definitions (HIGH)
1. Define GLM-4.7 and Flash variants
2. Define GLM-4.6 (ensure compatibility)
3. Define GLM-4.5 and variants (Air, Flash)
4. Add cost structures
5. Add thinking options
6. Set context windows (200K)

### Phase 3: UI Updates (MEDIUM)
1. Update MODEL_COLORS
2. Update lab labels
3. Verify model list display
4. Test cost graph

### Phase 4: Documentation (MEDIUM)
1. Update provider skill docs
2. Update installation guide
3. Add configuration examples
4. Update AGENTS.md references

### Phase 5: Testing (MEDIUM)
1. Provider integration tests
2. Model behavior tests
3. UI rendering tests
4. Backward compatibility tests

## Notes

### Pricing Estimates

**Note:** Actual pricing may vary. These are estimates based on:
- Z.ai GLM Coding Plan subscription tiers
- OpenRouter pricing (if applicable)
- Free tier information (GLM-4.7-Flash)

**Recommended:** Verify current pricing from Z.ai documentation before setting costs in configuration.

### Model Selection Guidelines

**When to use GLM-4.7:**
- Production workloads
- Complex multi-step reasoning
- Professional content creation
- Maximum performance required

**When to use GLM-4.7-Flash:**
- Local development
- Personal projects
- Cost-sensitive applications
- Unlimited free API access is sufficient

**When to use GLM-4.6:**
- Agentic workflows
- Tool collaboration
- Established GLM 4.5 users
- Intermediate step between 4.5 and 4.7

**When to use GLM-4.5:**
- Standard development
- General coding tasks
- Cost optimization important
- Balanced performance needs

**When to use GLM-4.5-Air:**
- High-throughput scenarios
- Quick responses needed
- Lower latency critical
- Edge computing

### Future Considerations

**Vision Models:**
- Current research shows no GLM-4.x vision variants from zai-coding-plan
- Vision capabilities may be integrated into multimodal variants (GLM-4.7 already supports multimodal)
- Monitor for future vision-specific releases

**Model Evolution:**
- Z.AI is actively developing GLM series
- Expect GLM-4.7+ releases with additional improvements
- Architecture (MoE) provides strong foundation for future variants
- Regular model.dev updates will add new models automatically

## References

### Documentation Sources
- Z.ai GLM-4.7: https://docs.z.ai/guides/llm/glm-4.7
- Z.ai GLM-4.6: https://docs.z.ai/guides/llm/glm-4.6
- Z.ai GLM-4.5: https://docs.z.ai/guides/llm/glm-4.5
- OpenRouter GLM-4.7-Flash: https://openrouter.ai/zai/glm-4.7-flash
- Hugging Face Models: https://huggingface.co/zai-org

### Codebase References
- Provider System: `/home/err/devel/orgs/sst/opencode/packages/opencode/src/provider/provider.ts`
- Model Schema: `/home/err/devel/orgs/sst/opencode/packages/opencode/src/provider/models.ts`
- Config Loading: `/home/err/devel/orgs/sst/opencode/packages/opencode/src/config/config.ts`
- UI Colors: `/home/err/devel/orgs/sst/opencode/packages/console/app/src/routes/workspace/[id]/graph-section.tsx`
- Lab Labels: `/home/err/devel/orgs/sst/opencode/packages/console/app/src/routes/workspace/[id]/model-section.tsx`

### Existing Integrations
- Current zai-coding-plan: `/home/err/devel/orgs/riatzukiza/promethean/opencode.json`
- Migration Script: `/home/err/devel/orgs/riatzukiza/promethean/scripts/migrate-opencode-config.cjs`
- Meta Agent: `/home/err/devel/scripts/meta-agent-evaluator.mjs`

---

**Document Version:** 1.0
**Last Updated:** 2026-01-28
**Status:** Analysis Complete - Ready for Implementation
