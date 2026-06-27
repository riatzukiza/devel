---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-contracts-event-envelope-md"
title: "Event Envelope Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.913Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/event-envelope.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/event-envelope.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/contracts/event-envelope.md`

# Event Envelope Contract

## Goal

Define one canonical event envelope that TS, CLJS, precursor CLJ, and future mixed runtimes can all exchange.

## Canonical shape

```json
{
  "schemaVersion": 1,
  "id": "uuid",
  "type": "discord.message.created",
  "timestamp": 1760000000000,
  "sessionId": "c3-symbolic",
  "cephalonId": "duck",
  "payload": {},
  "trace": {
    "correlationId": "uuid",
    "causationId": "uuid",
    "scheduleId": "cephalon:c3-symbolic:tick",
    "callId": "tool-call-uuid"
  },
  "source": {
    "package": "cephalon-ts",
    "runtime": "candidate-uuid",
    "surface": "discord"
  }
}
```

## Required fields

- `schemaVersion`
- `id`
- `type`
- `timestamp`
- `payload`

## Recommended fields

- `sessionId`
- `cephalonId`
- `trace`
- `source`

These should be present whenever the producing runtime actually knows them.

## Current grounding

The closest current executable source is:
- `packages/cephalon-ts/src/types/index.ts` → `CephalonEvent`

Current TS shape is already close:
```ts
{
  id,
  type,
  timestamp,
  sessionId?,
  payload
}
```

So the draft contract intentionally extends the living TS event shape instead of inventing a completely different model.

## Event type vocabulary

Current canonical event types should include at least:
- `discord.message.created`
- `discord.message.edited`
- `discord.message.deleted`
- `tool.call`
- `tool.result`
- `llm.assistant.message`
- `llm.think.trace`
- `system.tick`
- `system.proactive`
- `temporal.schedule.arm`
- `temporal.schedule.fired`
- `cephalon.tick.requested`
- `admin.command`
- `memory.summary.created`
- `memory.compaction.deleted`

This list is grounded in `packages/cephalon-ts/src/types/index.ts`.

## Payload rules

### 1. Payload is type-governed
Every `type` determines the valid payload family.
Do not send structurally unrelated payloads under a known type.

### 2. Payload should remain JSON-serializable
Clojure-side namespaced maps are fine internally, but boundary payloads should be emitted in JSON-friendly shape.

### 3. Temporal and tool correlation should be explicit when present
If an event comes from:
- a scheduled loop, include `trace.scheduleId`
- a tool call chain, include `trace.callId`
- another event, include `trace.causationId`

## Compatibility rule

Until all producers emit the full draft shape, consumers should accept this **legacy-compatible minimal envelope**:

```json
{
  "id": "uuid",
  "type": "system.tick",
  "timestamp": 1760000000000,
  "sessionId": "c3-symbolic",
  "payload": {}
}
```

When `schemaVersion` is absent, treat it as `1`.

## Clojure adapter rule

Clojure/CLJS runtimes may keep internal event maps like:
- `:event/id`
- `:event/type`
- `:event/ts`
- `:event/payload`

But adapters crossing a package/process boundary should normalize those fields into the canonical envelope keys.

## Sharp warning

Do not confuse:
- an internal bus event shape
- a persisted event log shape
- a cross-runtime handoff shape

They may share fields, but the **boundary** shape is the one other strata are allowed to depend on.
