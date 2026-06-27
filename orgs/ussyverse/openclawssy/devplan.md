🔥 Openclawssy Memory System — DevPlan v0.1
Implementation Progress

- [x] Phase 1: Event stream package created (`internal/memory`) with non-blocking queued JSONL ingestion.
- [x] Phase 1: Runtime integration added after run execution to ingest redacted user/assistant/tool/error/scheduler events.
- [x] Phase 1: Config surface added (`memory.enabled`, `memory.max_working_items`, `memory.max_prompt_tokens`, `memory.auto_checkpoint`) with defaults/validation.
- [x] Phase 1: Tests added for memory manager, config memory defaults/validation, and runtime memory event ingestion.
- [x] Phase 2: Working memory SQLite store + memory tools (`memory.search`, `memory.write`, `memory.update`, `memory.forget`, `memory.health`).
- [x] Phase 2 follow-up: `decision.log` tool.
- [x] Phase 3: `memory.checkpoint` now performs model-driven distillation with strict JSON validation and deterministic fallback safety path.
- [x] Observability: memory admin endpoint added (`GET /api/admin/memory/<agent>`).
- [x] Phase 3 follow-up: scheduler default checkpoint job wiring (`@every 6h`) and strict model JSON distillation.
- [x] Phase 3: Checkpoint distillation.
- [x] Phase 4: Recall integration into prompt assembly (relevant memory block injected pre-turn with importance/status filtering, recency boost, and size caps).
- [x] Phase 5: Weekly maintenance workflow (`memory.maintenance` tool with dedupe/archive/verification report + auto weekly scheduler wiring via `@every 168h`).
- [x] Phase 6: Proactive memory-driven behavior hooks (checkpoint/maintenance triggers invoke `agent.message.send` with required `channel`, `user_id`, and `session_id` context).
- [x] Optional Phase 7: Embeddings support added (pluggable `Embedder` interface, vector storage, cosine retrieval, and OpenRouter-compatible embeddings API path).

Guiding Principles

Security-first (same posture as the runtime)

Audit-friendly (memory derivations are traceable to runs)

Workspace-bound (no cross-boundary writes)

Deterministic where possible

Optional and configurable

Small working memory, structured long-term memory

🧠 Memory Architecture for Openclawssy

We will implement a 3-layer architecture:

Layer	Purpose	Storage
Event Stream	Raw events (chat/tool/decisions)	JSONL
Working Memory	High-signal distilled memory	SQLite
Archive	Long-term searchable memory	SQLite + optional embeddings
📁 Proposed Filesystem Layout

Inside the existing .openclawssy/agents/<agent>/:

.openclawssy/
└── agents/<agent>/
    ├── runs/                  (existing)
    ├── audit/                 (existing)
    ├── sessions/              (existing)
    ├── memory/
    │   ├── events/
    │   │   └── YYYY-MM-DD.jsonl
    │   ├── memory.db
    │   ├── checkpoints/
    │   │   └── checkpoint-<timestamp>.json
    │   └── reports/
    │       └── weekly-<date>.md


This keeps memory scoped per-agent.

🧱 Phase 1 — Event Stream (PR #1)
Goal

Capture memory-relevant events without changing runtime behavior.

Integration Point

Inside the runtime loop (after execution completes, where run bundle is persisted).

Add:

memoryManager.IngestEvent(ctx, MemoryEvent{...})

Capture:

user message

assistant output

tool calls

tool results

errors

scheduler-triggered runs

Redaction

Reuse existing redaction logic before writing to memory logs.

Storage

Append-only JSONL:

{
  "id": "evt_01H...",
  "type": "user_message",
  "text": "...",
  "session_id": "...",
  "run_id": "...",
  "timestamp": "...",
  "metadata": {...}
}


Non-blocking write.

🧠 Phase 2 — Working Memory Store (PR #2)

Introduce:

internal/memory/
    manager.go
    models.go
    store/sqlite.go
    retrieve.go

SQLite Schema
CREATE TABLE memory_items (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  kind TEXT,
  title TEXT,
  content TEXT,
  importance INTEGER,
  confidence REAL,
  status TEXT,
  created_at DATETIME,
  updated_at DATETIME
);

CREATE VIRTUAL TABLE memory_fts USING fts5(content, title);


On insert/update:

sync to FTS table

Add Tools

Expose to agent:

memory.search
memory.write
memory.update
memory.forget
memory.health
decision.log


These will integrate through the existing tool registry.

🧪 Phase 3 — Checkpoint Distillation (PR #3)

This is where the 2.0 concept becomes real.

Add Scheduler Job

Use existing cron framework:

openclawssy cron add \
  --agent default \
  --schedule "@every 6h" \
  --message "/tool memory.checkpoint {}"


Add tool:

memory.checkpoint

Behavior

Read last N events since last checkpoint.

Construct summarization prompt.

Call model.

Parse structured JSON result.

Upsert memory items.

Structured Prompt Example

We DO NOT let the model freestyle.

We require:

{
  "new_items": [
    {
      "kind": "preference",
      "title": "...",
      "content": "...",
      "importance": 4,
      "confidence": 0.92
    }
  ],
  "updates": [
    {
      "id": "...",
      "new_content": "...",
      "confidence": 0.88
    }
  ]
}


Strict JSON schema validation.

🗂 Phase 4 — Recall Integration (PR #4)

This is critical.

Inside prompt assembly (Architecture doc step 14–15 flow):

Before model turn:

build prompt + session context


Modify to:

build prompt
+ retrieve memory context
+ inject memory block

Retrieval Logic

FTS search on query

filter by:

status = active

importance ≥ 3

recency boost

Return top N (configurable).

Injected Prompt Block
--- RELEVANT MEMORY ---
[MEM-12] User prefers proactive notifications.
[MEM-44] User is debugging skill loading issues.
------------------------


Hard size cap.

🔄 Phase 5 — Weekly Maintenance (PR #5)

Add tool:

memory.maintenance


Scheduled:

cron 30 2 * * 0


Maintenance tasks:

Deduplicate similar items

Archive stale items

Mark items needing verification

Compact DB

Generate weekly report file

Optional: proactive message to user.

📊 Phase 6 — Proactive Memory-Driven Behavior (PR #6)

Integrate with scheduler + delivery system.

When:

checkpoint creates high-importance memory

maintenance finds stale item

user preference indicates reminders

Trigger:

agent.message.send


BUT must include:

userID

sessionID

channel

This will fix your current proactive messaging problem if implemented correctly.

🔐 Security Considerations

Never store raw secrets.

Redact before memory ingestion.

Memory DB stored inside agent directory.

Enforce path guard.

Add config:

memory.enabled
memory.max_working_items
memory.max_prompt_tokens
memory.auto_checkpoint

🧪 Observability

Add:

memory debug endpoint:

GET /api/admin/memory/<agent>

memory health metrics

memory stats in dashboard

🧩 Optional Phase 7 — Embeddings

Add interface:

type Embedder interface {
  Embed(text string) ([]float32, error)
}


Store embeddings.

Add cosine search.

Make pluggable.

🗓 Implementation Timeline
PR	Feature	Risk
1	Event capture	Low
2	SQLite memory store + tools	Medium
3	Checkpoint summarizer	Medium
4	Prompt injection	Medium
5	Maintenance job	Low
6	Proactive hooks	Medium
7	Embeddings	Optional
⚙ Integration Points Summary
Area	Change
Runtime loop	IngestEvent hook
Prompt builder	Memory injection
Tool registry	Add memory tools
Scheduler	Add checkpoint + maintenance
Dashboard	Memory admin surface
Config	Add memory config section
🎯 End Result

Openclawssy gains:

Automatic memory extraction

Structured long-term knowledge

Scheduled maintenance

Decision logging

Memory-aware responses

Proactive behavior capability

No silent failures

Fully auditable derivation chain
