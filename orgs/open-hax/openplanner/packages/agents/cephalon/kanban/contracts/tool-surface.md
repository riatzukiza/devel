---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-contracts-tool-surface-md"
title: "Tool Surface Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.913Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/tool-surface.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/tool-surface.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/contracts/tool-surface.md`

# Tool Surface Contract

## Goal

Define one canonical vocabulary for tool permissions, tool calls, and tool results across Cephalon strata.

## Tool naming rule

Canonical tool names are dotted strings.

Examples from the living TS runtime:
- `memory.lookup`
- `memory.pin`
- `field.observe`
- `discord.search`
- `discord.set_output_channel`
- `discord.get_output_channel`
- `discord.speak`
- `web.fetch`
- `web.search`
- `github.search`
- `wikipedia.search`
- `bluesky.search`
- `vision.inspect`
- `audio.spectrogram`
- `desktop.capture`
- `browser.navigate`
- `browser.screenshot`
- `peer.read_file`
- `peer.edit_file`
- `mind.propose_message`
- `mind.apply_prompt_update`
- `heuretic.trace_review`
- `metisean.session_audit`

## Tool family rule

The leftmost segment declares the family:
- `memory.*`
- `field.*`
- `discord.*`
- `web.*`
- `github.*`
- `wikipedia.*`
- `bluesky.*`
- `vision.*`
- `audio.*`
- `desktop.*`
- `browser.*`
- `peer.*`
- `mind.*`
- `tenor.*`
- `heuretic.*`
- `metisean.*`
- future `runtime.*`

This family boundary matters because circuit permissions, UI affordances, and runtime safety often operate at family granularity first.

## Tool permission contract

A session/circuit permission surface should be expressible as an allow-list of canonical tool names.

Grounding:
- `packages/cephalon-ts/src/circuits.ts`
- `packages/cephalon-ts/src/types/index.ts` → `Session.toolPermissions`

## Canonical tool call payload

```json
{
  "toolName": "web.fetch",
  "args": {
    "url": "https://example.com"
  },
  "callId": "uuid"
}
```

This matches the living TS `ToolCallPayload` closely.

## Canonical tool result payload

```json
{
  "toolName": "web.fetch",
  "callId": "uuid",
  "success": true,
  "result": {},
  "error": null
}
```

## Known current gap

The current TS event payload type for `tool.result` does not fully express all the fields that the executor already publishes in practice.

Observed tension:
- `packages/cephalon-ts/src/types/index.ts` declares `tool.result` payload without explicit `success`
- `packages/cephalon-ts/src/llm/tools/executor.ts` publishes richer result semantics in practice

Draft rule:
- boundary consumers should accept `success` when present
- if `success` is absent, derive it as `error == null`

## Alias rule

Aliases are allowed for model convenience, but every alias must map to one canonical tool name.

Grounding:
- `packages/cephalon-ts/src/llm/tools/executor.ts` already normalizes aliases such as `mind_propose_message` → `mind.propose_message`

Boundary rule:
- logs, persisted artifacts, and cross-runtime messages should prefer the canonical tool name after alias resolution

## Output channel rule

Any tool surface that can speak into a room should treat output routing as explicit state.

Current living TS examples:
- `discord.set_output_channel`
- `discord.get_output_channel`
- `discord.speak`

Implication:
- “speech” is not just a side effect; it is governed by session-level routing state
- future non-Discord channel surfaces should preserve the same separation of route selection vs actual speech

## Sharp warning

Do not let tool contracts drift in three separate places:
- prompt/schema definition
- executor payload shape
- session permission vocabulary

If they diverge, Cephalon stops being governable.
