---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-clj-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-clj-specs-precursor-runtime-md"
title: "Cephalon JVM Precursor Runtime"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:24.752Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/specs/precursor-runtime.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/specs/precursor-runtime.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-clj/kanban/precursor-runtime.md`

# Cephalon JVM Precursor Runtime

## Claim

`packages/cephalon-clj` preserves a smaller, more inspectable precursor of the Cephalon loop.

## Runtime shape

```text
config.edn
   ↓
event bus
   ↓
cephalon instance + session
   ↓
recent events + related memory + persistent memory
   ↓
LLM call
   ↓
:cephalon/thought event
```

## Load-bearing pieces

### Event bus
The bus is the package’s central movement surface.
It decouples event subscription from the cephalon loop.

### Session state
The session keeps a bounded recent buffer and acts as the immediate conversational window.

### Eidolon retrieval
Related memories are pulled in before the current loop step, giving the package a minimal semantic-memory layer.

### Sentinel note contract
A filesystem watcher turns changed markdown notes into model-mediated frontmatter updates.
This keeps the “note-governing organism” idea executable in a small form.

## Why it matters to the larger family

This package shows that a Cephalon does not require the full service stack to remain recognizable.
It needs only:
- subscriptions
- bounded recent state
- related-memory retrieval
- one LLM step
- one outward event emission

That simplicity is useful when the larger TS and CLJS branches become hard to reason about.
