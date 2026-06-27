---
uuid: "orgs-open-hax-openplanner-kanban-orgs-open-hax-openplanner-specs-observation-deduplication-md"
title: "Spec: Event Observation Deduplication (The \"Observation Ledger\")"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:42.616Z"
source: "orgs/open-hax/openplanner/specs/observation-deduplication.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/specs/observation-deduplication.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/kanban/observation-deduplication.md`

# Spec: Event Observation Deduplication (The "Observation Ledger")

## 1. Problem Statement
In the current event-agent runtime, tool calls (specifically "observation" tools like `discord.read`, `github.get_file`, `websearch`) result in full-text blobs being appended to the event lake. When multiple agents observe the same data (e.g., the same Discord channel history), the lake becomes saturated with duplicate content.

### Impacts:
- **RAG Tainting**: Semantic search results are skewed by high-frequency duplicate blocks.
- **Token Waste**: Overlapping context is passed to LLMs repeatedly.
- **Storage Inefficiency**: Redundant data growth in the event stream.

## 2. Proposed Solution: Semantic CAS (Content Addressable Store)
Shift from a "linear stream" model to a "pointer-to-canonical" model for observation data.

### 2.1 The Observation Hash
When an observation tool returns a result:
1. Generate a deterministic unique identifier (`ObsHash`):
   `ObsHash = sha256(tool_name + JSON.stringify(args) + response_body)`
2. Check the **Observation Ledger** (Redis/DB) for the existence of `ObsHash`.

### 2.2 The Ledger Logic
- **If `ObsHash` is NOT present**:
  - Store the full `response_body` in the Observation Lake.
  - Initialize `occurrence_count = 1` and `first_seen = timestamp`.
- **If `ObsHash` IS present**:
  - Increment `occurrence_count`.
  - Update `last_seen = timestamp`.
  - **Do not** append the full text to the event lake again.

### 2.3 The Event Stream Representation
The event lake record for the tool result is transformed:
- **Old**: `{ tool: "discord.read", result: "Full message history..." }`
- **New**: `{ tool: "discord.read", obs_ref: "hash_abc123", summary: "Retrieved channel history (seen 5 times)" }`

## 3. Implementation Requirements

### 3.1 Runtime Integration
The `start-agent-run!` logic in `event_agents.cljs` must be modified to intercept tool results and route them through the deduplication layer before they are persisted to the session log.

### 3.2 Retrieval Logic
When the `memory_search` or `graph_query` tools operate on the event lake:
1. Identify `obs_ref` pointers.
2. Resolve pointers to the canonical content in the Observation Lake.
3. De-duplicate the retrieved set so that only one instance of each canonical observation is provided to the LLM.

## 4. Success Metrics
- **Lake Volume**: Reduced growth rate of the event lake for Discord-heavy workloads.
- **RAG Precision**: Higher diversity in retrieved snippets (fewer duplicates filling the top-K results).
- **Convergence**: `occurrence_count` provides a new signal for "Importance" (how many agents care about this data).
