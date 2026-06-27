# Monday Night Handoff

Date: 2026-02-17

## What We Worked On

### 1) Chat and tool-call reliability
- Removed the hard repeated-tool-call failure path that produced `agent runner blocked repeated tool call`.
- Replaced it with safe reuse of successful tool results for repeated identical calls within a run.
- Kept tool call IDs unique and stable for trace and UI rendering.

Key files:
- `internal/agent/runner.go`
- `internal/agent/runner_test.go`
- `internal/agent/types.go`

### 2) Context correctness across turns
- Ensured current user message drives tool-directive detection (not old history turns).
- Excluded historical `tool` messages from model conversational context.
- Increased history loading to support longer windows while relying on compaction.
- Added 80 percent context compaction behavior and 20k max response token cap in provider requests.

Key files:
- `internal/runtime/model.go`
- `internal/runtime/model_test.go`
- `internal/runtime/engine.go`
- `internal/runtime/engine_test.go`
- `internal/config/config.go`
- `internal/config/config_test.go`

### 3) Better tool activity display in chat/dashboard/discord
- `fs.write` now returns line count and a summary (`wrote N line(s) to <path>`).
- Tool trace entries now include `summary`.
- Dashboard and Discord prefer concise summary text over raw JSON blobs where available.

Key files:
- `internal/tools/builtins.go`
- `internal/tools/tools_test.go`
- `internal/runtime/trace.go`
- `internal/runtime/trace_test.go`
- `internal/channels/dashboard/handler.go`
- `internal/channels/discord/bot.go`
- `internal/channels/discord/bot_test.go`

### 4) Multi-step flow continuity and progress persistence
- Added a per-tool callback hook (`OnToolCall`) in runner input.
- Runtime now persists each tool message to chat store immediately as tools complete.
- This preserves tool progress in chat even if a later model call fails.

Key files:
- `internal/agent/types.go`
- `internal/agent/runner.go`
- `internal/runtime/engine.go`
- `internal/runtime/engine_test.go`

### 5) Dashboard UI improvements for readability and space control
- Chat history panel is now vertically resizable.
- Added chat height slider with persisted preference.
- Added collapsible sections for:
  - Tool Activity
  - Recent Sessions
  - Status and Recent Runs
  - Admin Controls
- Added `Focus chat` and `Reset layout` actions.
- Layout preferences persist in local storage.

Key file:
- `internal/channels/dashboard/handler.go`

## Test Coverage Added/Updated
- Runner repeated-call cache and per-tool callback notifications.
- Runtime repeated-tool-call end-to-end flow.
- Runtime partial failure flow preserving tool messages.
- Trace summary generation.
- Tool output metadata (`fs.write` lines and summary).
- Dashboard and Discord display behavior for tool summaries.

## Verification Commands Run
- `go test ./internal/agent ./internal/runtime ./internal/tools`
- `go test ./internal/channels/dashboard ./internal/channels/http ./internal/channels/discord`
- `go test ./cmd/openclawssy ./internal/channels/chat -run TestConnector`

Note: Full `go test ./...` still reports an existing unrelated failure:
- `internal/channels/chat` -> `TestAllowlist_EmptyUsersDenyByDefault`

## Current Working Tree Notes
- This handoff file is `mondaynight.md`.
- Existing untracked file `mondaydevplan.md` is left untouched.
