---
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-specs-contracts-memory-record-md"
title: "Memory Record Contract"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:34.913Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/memory-record.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/specs/contracts/memory-record.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/kanban/contracts/memory-record.md`

# Memory Record Contract

## Goal

Define one canonical memory record for cross-package exchange, persistence, and inspection.

## Canonical shape

The canonical boundary memory record is the JSON-friendly shape already closest to `packages/cephalon-ts/src/types/index.ts`:

```json
{
  "id": "uuid",
  "timestamp": 1760000000000,
  "cephalonId": "duck",
  "sessionId": "c3-symbolic",
  "eventId": "uuid-or-null",
  "role": "assistant",
  "kind": "message",
  "content": {
    "text": "hello",
    "normalizedText": "hello",
    "snippets": []
  },
  "source": {
    "type": "discord",
    "guildId": "...",
    "channelId": "...",
    "authorId": "...",
    "authorIsBot": false
  },
  "cluster": {
    "clusterId": "...",
    "threadId": "...",
    "spamFamilyId": "...",
    "parentMemoryId": "...",
    "sourceMessageId": "..."
  },
  "retrieval": {
    "pinned": false,
    "lockedByAdmin": false,
    "lockedBySystem": false,
    "weightKind": 1.0,
    "weightSource": 1.0
  },
  "usage": {
    "includedCountTotal": 0,
    "includedCountDecay": 0,
    "lastIncludedAt": 0
  },
  "embedding": {
    "status": "none",
    "model": "",
    "vectorId": "",
    "dims": 0,
    "embeddedAt": 0,
    "vector": []
  },
  "lifecycle": {
    "deleted": false,
    "deletedAt": 0,
    "replacedBySummaryId": null
  },
  "hashes": {
    "contentHash": "sha256",
    "normalizedHash": "sha256"
  },
  "schemaVersion": 1
}
```

## Current grounding

The strongest living sources are:
- `packages/cephalon-ts/src/types/index.ts` → `Memory`
- `packages/cephalon-cljs/src/promethean/memory/types.cljs` → namespaced CLJS semantic mirror

These two are already semantically close.

## Required fields

- `id`
- `timestamp`
- `cephalonId`
- `sessionId`
- `role`
- `kind`
- `content`
- `source`
- `retrieval`
- `usage`
- `embedding`
- `lifecycle`
- `schemaVersion`

## Optional fields

- `eventId`
- `cluster`
- `hashes`

`hashes` are strongly recommended for dedupe-capable producers, but older producers may omit them.

## Role vocabulary

Allowed roles:
- `user`
- `assistant`
- `system`
- `developer`
- `tool`

## Kind vocabulary

Allowed kinds:
- `message`
- `tool_call`
- `tool_result`
- `think`
- `image`
- `summary`
- `admin`
- `aggregate`
- `system`
- `developer`

This list is grounded in both TS and CLJS living types.

## Clojure adapter rule

Clojure and CLJS may continue to use internal keys like:
- `:memory/id`
- `:memory/timestamp`
- `:memory/content`
- `:memory/source`

But boundary adapters should normalize those into the canonical JSON-friendly field names before exchange with TS, APIs, or persisted boundary artifacts.

## Known current gap

The current family does **not** yet carry a first-class `toolCallId` field on the canonical memory record.

Implication:
- tool call/result correlation is strongest in event payloads today
- memory-level correlation may still rely on `eventId`, deterministic IDs, or clustering hints

That gap is acceptable for draft v1, but should be reconsidered in a later schema revision.

## Summary rule

Summary memories should:
- set `kind = "summary"`
- preserve enough cluster/thread lineage to explain what they replaced
- never silently destroy the only surviving trace of an interaction without a replacement pointer or recoverable source trail
