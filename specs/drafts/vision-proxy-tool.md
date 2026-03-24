---
title: "Vision Proxy Tool"
status: draft
created_at: "2026-03-24"
tags: [tools, vision, multi-model, capability-detection]
license: GPL-3.0-only
---

# Vision Proxy Tool

## Summary

Provide a tool for models without native vision capability to request image interpretation from GPT-5.4.

**Architecture context:** This tool is part of a two-model system:
- **z.ai GLM 5**: Fast implementation, code generation, tool invocation
- **GPT-5.4**: Interpretation, review, guidance, enforcement (including vision)

Non-vision models see images as opaque attachments or `{{ATTACHMENT:...}}` placeholders. This tool allows them to "see" by delegating interpretation to GPT-5.4 and receiving structured text descriptions in return.

## Problem

- Text-only models cannot interpret images
- Some models lack vision capability entirely
- Vision models are more expensive and slower for text tasks
- Mixing vision and text models in a pipeline requires handoff tooling

## Goal

Enable non-vision models to:
1. Request image interpretation on demand
2. Receive structured, actionable text descriptions
3. Use vision only when needed (cost/latency optimization)

## Scope

### In scope
- Tool definition for image interpretation
- Capability detection (only expose to non-vision models)
- Structured interpretation output format
- Optional prompt templates for common use cases
- Caching for repeated interpretations
- Multi-model fallback chain

### Out of scope
- Real-time video stream interpretation
- Fine-grained image editing/manipulation
- Multi-turn visual dialogue (beyond single interpretation)

## Architecture

### Tool definition

```json
{
  "name": "interpret_image",
  "description": "Request image interpretation from a vision-capable model. Use this tool when you need to understand image content but lack native vision capability. Returns structured text description.",
  "parameters": {
    "type": "object",
    "properties": {
      "source": {
        "type": "string",
        "description": "Image source: local file path, HTTP(S) URL, or data: URL"
      },
      "interpretation_type": {
        "type": "string",
        "enum": ["general", "ocr", "diagram", "screenshot", "chart", "technical_drawing"],
        "default": "general",
        "description": "Type of interpretation to optimize for"
      },
      "prompt": {
        "type": "string",
        "description": "Optional custom prompt for interpretation. Overrides interpretation_type if provided."
      },
      "detail_level": {
        "type": "string",
        "enum": ["brief", "standard", "detailed"],
        "default": "standard",
        "description": "How detailed the description should be"
      }
    },
    "required": ["source"]
  }
}
```

### Capability detection

The tool is only exposed when:
- The calling model's capabilities do NOT include `vision`
- The calling model is explicitly in a "text-only" allowlist, OR
- The tool is force-enabled via configuration

Detection logic:
```typescript
const isVisionCapable = (model: ModelInfo): boolean => {
  return model.capabilities?.includes('vision') ?? false;
};

const shouldExposeTool = (model: ModelInfo): boolean => {
  if (config.forceExposeVisionProxy) return true;
  return !isVisionCapable(model);
};
```

### Output format

The tool returns a structured interpretation:

```json
{
  "interpretation": {
    "summary": "One-sentence description of the image",
    "type_detected": "screenshot|diagram|chart|photo|technical_drawing|other",
    "dimensions": { "width": number, "height": number },
    "elements": [
      {
        "type": "text|shape|icon|region",
        "description": "Description of this element",
        "position": { "x": number, "y": number, "width": number, "height": number },
        "content": "Extracted text content if applicable"
      }
    ],
    "text_content": "Full extracted text for OCR-type interpretations",
    "key_observations": [
      "Observation 1",
      "Observation 2"
    ],
    "confidence": 0.0-1.0
  },
  "model_used": "gpt-4o|gpt-5.4|vision-model-id",
  "cached": false,
  "tokens_used": { "input": number, "output": number }
}
```

### Prompt templates

Each `interpretation_type` maps to a specialized prompt:

| Type | Prompt focus |
|------|--------------|
| `general` | Comprehensive description: objects, layout, text, context |
| `ocr` | Extract all text with positions; prioritize accuracy over description |
| `diagram` | Identify flow, components, connections; explain relationships |
| `screenshot` | Identify UI elements, window context, visible application state |
| `chart` | Extract data points, axes, legends, trends; describe insights |
| `technical_drawing` | Identify dimensions, annotations, views; explain technical details |

### Caching

Same image + same interpretation_type = cached result within session scope.

Cache key: `hash(image_bytes) + interpretation_type + (prompt if provided)`

Cache TTL: Session-scoped (cleared when session ends)

Cache hit returns:
```json
{
  "interpretation": { ... },
  "model_used": "...",
  "cached": true,
  "tokens_used": { "input": 0, "output": 0 }
}
```

### Model architecture

**Two-model split:**
- Implementation work: z.ai GLM 5 (fast execution, code generation)
- Interpretation/review: GPT-5.4 (vision, semantic analysis, enforcement)

This tool uses GPT-5.4 exclusively for image interpretation. No fallback chain needed.

```typescript
const VISION_MODEL = 'gpt-5.4';

async function interpretImage(image, prompt): Promise<Interpretation> {
  return await callVisionModel(VISION_MODEL, image, prompt);
}
```

## Implementation

### Tool handler

```typescript
async function handleInterpretImage(params: InterpretParams, ctx: ToolContext): Promise<ToolResult> {
  const { source, interpretation_type = 'general', prompt, detail_level = 'standard' } = params;

  // Load image bytes
  const imageBytes = await loadImage(source);
  const cacheKey = computeCacheKey(imageBytes, interpretation_type, prompt);

  // Check cache
  const cached = ctx.cache.get(cacheKey);
  if (cached) {
    return { content: [{ type: 'text', text: JSON.stringify(cached) }] };
  }

  // Build prompt
  const systemPrompt = buildSystemPrompt(interpretation_type, detail_level);
  const userPrompt = prompt ?? buildDefaultPrompt(interpretation_type, detail_level);

  // Call vision model with fallback
  const result = await interpretWithFallback(imageBytes, systemPrompt, userPrompt);

  // Parse and structure output
  const interpretation = parseVisionOutput(result);

  // Cache result
  ctx.cache.set(cacheKey, interpretation);

  return {
    content: [{ type: 'text', text: JSON.stringify(interpretation, null, 2) }],
  };
}
```

### Prompt construction

```typescript
function buildSystemPrompt(type: InterpretationType, detail: DetailLevel): string {
  const detailInstructions = {
    brief: 'Provide a single-sentence summary. Focus on the most important element.',
    standard: 'Provide a structured description covering main elements. Include positions.',
    detailed: 'Provide exhaustive description. Include all visible elements, positions, relationships, and subtle details.',
  };

  const typeInstructions = {
    general: 'Describe the image comprehensively. Cover objects, people, text, layout, and context.',
    ocr: 'Extract all visible text. For each text, provide position and content. Prioritize accuracy.',
    diagram: 'Identify nodes, edges, flow direction, and relationships. Explain the diagram\'s purpose.',
    screenshot: 'Identify the application, window context, UI elements, and visible state. Describe interactive elements.',
    chart: 'Identify chart type, axes, data series, legends, and notable data points. Describe trends.',
    technical_drawing: 'Identify views, dimensions, annotations, and technical details. Explain the engineering context.',
  };

  return `You are an image interpretation assistant. ${typeInstructions[type]}

${detailInstructions[detail]}

Return your interpretation as valid JSON matching this schema:
{
  "summary": "one-sentence description",
  "type_detected": "screenshot|diagram|chart|photo|technical_drawing|other",
  "dimensions": { "width": number, "height": number },
  "elements": [{ "type": "text|shape|icon|region", "description": "...", "position": {...}, "content": "..." }],
  "text_content": "full extracted text for OCR",
  "key_observations": ["observation 1", "observation 2"],
  "confidence": 0.0-1.0
}`;
}
```

## Usage examples

### Screenshot analysis (non-vision model)

```
Model: I received an attachment but I cannot view images directly. Let me use the interpret_image tool.

Tool call: interpret_image({
  "source": "/tmp/screenshot-2026-03-24.png",
  "interpretation_type": "screenshot",
  "detail_level": "detailed"
})

Tool result: {
  "interpretation": {
    "summary": "Terminal window showing a Node.js process running with output logs",
    "type_detected": "screenshot",
    "elements": [
      {"type": "text", "description": "Terminal title bar", "content": "err@prometheus: ~/devel"},
      {"type": "text", "description": "Process output", "content": "Server listening on port 3000"},
      {"type": "region", "description": "Error highlight", "position": {"x": 120, "y": 340, "width": 200, "height": 20}}
    ],
    "key_observations": ["Server appears to be running", "No visible errors in current output"],
    "confidence": 0.92
  }
}

Model: Based on the interpreted screenshot, your server is running on port 3000 with no visible errors...
```

### Diagram understanding

```
Tool call: interpret_image({
  "source": "https://example.com/diagram.png",
  "interpretation_type": "diagram"
})

Tool result: {
  "interpretation": {
    "summary": "Flowchart depicting a CI/CD pipeline with test, build, and deploy stages",
    "type_detected": "diagram",
    "elements": [
      {"type": "shape", "description": "Start node", "position": {"x": 50, "y": 20}},
      {"type": "shape", "description": "Test stage", "position": {"x": 50, "y": 100}},
      {"type": "shape", "description": "Build stage", "position": {"x": 50, "y": 180}},
      {"type": "shape", "description": "Deploy stage", "position": {"x": 50, "y": 260}}
    ],
    "key_observations": ["Linear flow from test to deploy", "No visible rollback path"]
  }
}
```

### OCR extraction

```
Tool call: interpret_image({
  "source": "/tmp/document-scan.jpg",
  "interpretation_type": "ocr",
  "detail_level": "detailed"
})

Tool result: {
  "interpretation": {
    "summary": "Scanned document with header and body text",
    "type_detected": "other",
    "text_content": "MEMORANDUM\n\nTo: All Staff\nFrom: Engineering\nSubject: Policy Update...",
    "elements": [
      {"type": "text", "content": "MEMORANDUM", "position": {"x": 200, "y": 40}},
      {"type": "text", "content": "To: All Staff", "position": {"x": 80, "y": 100}}
    ]
  }
}
```

## Configuration

Add to pi extension configuration:

```typescript
type VisionProxyConfig = {
  enabled: boolean;                    // default: true
  forceExpose: boolean;                // default: false (expose even to vision models)
  model: string;                       // default: 'gpt-5.4'
  baseUrl?: string;                     // default: OPENAI_BASE_URL
  apiKey?: string;                      // default: OPENAI_API_KEY
  cacheTtlSeconds: number;              // default: 3600 (session scope)
  maxImageBytes: number;                // default: 8MB
  defaultDetailLevel: 'brief' | 'standard' | 'detailed';  // default: 'standard'
};
```

**Architecture note:** This tool is part of a two-model architecture:
- z.ai GLM 5 handles fast implementation work
- GPT-5.4 handles interpretation, review, and enforcement (including vision)

## Risks and mitigations

### Risk: Vision model hallucinates details
Mitigation: Return confidence score. Encourage caller to cross-check critical details.

### Risk: High latency for multiple images
Mitigation: Cache results. Use `gpt-4o` (faster) before `gpt-5.4` (slower).

### Risk: Cost accumulation
Mitigation: Track tokens per call. Add session budgets. Warn when approaching limits.

### Risk: Privacy leakage to external API
Mitigation: Document that images are sent to configured vision endpoint. Allow opting out per-call.

## Acceptance criteria

1. Tool is only exposed to non-vision models (capability detection works)
2. Screenshot interpretation identifies UI elements and context
3. OCR interpretation extracts text with positions
4. Diagram interpretation explains flow and relationships
5. Cached results return instantly with `cached: true`
6. Token usage is tracked and reported
7. Uses GPT-5.4 exclusively for vision interpretation

## Definition of done

- [ ] Tool schema defined in extension
- [ ] Capability detection logic implemented
- [ ] Prompt templates for all interpretation_types
- [ ] Vision model call with image encoding (GPT-5.4)
- [ ] Structured output parsing
- [ ] Session-scoped caching
- [ ] Usage tracking (tokens, cache hits/misses)
- [ ] Test fixtures for each interpretation_type
- [ ] Documentation for non-vision model authors