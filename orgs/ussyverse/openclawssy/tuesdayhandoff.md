# Tuesday Handoff

Date: 2026-02-18

## What shipped in this batch

1. Added scheduler delivery metadata and session-aware enqueueing so scheduled jobs can post into chat sessions proactively.
   - `internal/scheduler/scheduler.go`
   - `internal/scheduler/scheduler_test.go`
   - `cmd/openclawssy/main.go`
   - `cmd/openclawssy/main_test.go`
   - Added job-level destination fields (`channel`, `user_id`, `room_id`, `session_id`).
   - Added executor callback path that receives the full job object.
   - Serve startup now resolves/creates delivery sessions for scheduler-origin runs.

2. Extended scheduler creation surfaces to persist destination defaults.
   - `internal/channels/dashboard/handler.go`
   - `internal/channels/dashboard/handler_test.go`
   - Dashboard job creation now accepts destination fields and defaults to dashboard delivery when omitted.
   - CLI cron add now supports destination flags for channel/user/room/session.

3. Updated dashboard chat to surface proactive updates while idle.
   - `internal/channels/dashboard/ui/src/pages/chat.js`
   - Added session bootstrap + idle polling so new assistant messages appear even without a new user send.
   - Reused existing transcript/tool parsing so scheduled run output and error cards render consistently.

4. Added built-in skills discovery/read tools with secret diagnostics.
   - `internal/tools/skill_tools.go`
   - `internal/tools/builtins.go`
   - `internal/tools/tools_test.go`
   - New tools:
     - `skill.list`: discovers workspace `skills/`, reports readiness and missing required secrets.
     - `skill.read`: reads a skill by name/path with workspace boundary checks and actionable missing-secret errors.

5. Wired skill tools through parser/runtime allowlists and normalization.
   - `internal/runtime/engine.go`
   - `internal/runtime/engine_test.go`
   - `internal/runtime/model.go`
   - `internal/runtime/model_test.go`
   - `internal/toolparse/parser.go`
   - `internal/toolparse/parser_test.go`
   - `internal/toolparse/parser_fuzz_test.go`
   - Added tool aliases (`skill.get`), and argument normalization aliases for `skill.read` inputs.

## Root-cause notes

- "Completed with no output" in dashboard commonly occurred when runs finished with empty output and UI fallback text rendered.
- Scheduler runs were previously enqueued without delivery session context in serve startup, so proactive delivery into active chat transcripts was unreliable.
- Dashboard chat was primarily run-trigger driven and did not continuously poll the active session while idle.
- Skill discovery/read paths did not exist as first-class tools, causing weak behavior when users requested workspace skills and secrets-dependent flows.

## Validation run

- `gofmt -w cmd/openclawssy/main.go cmd/openclawssy/main_test.go internal/channels/dashboard/handler.go internal/channels/dashboard/handler_test.go internal/runtime/engine.go internal/runtime/engine_test.go internal/runtime/model.go internal/runtime/model_test.go internal/scheduler/scheduler.go internal/scheduler/scheduler_test.go internal/toolparse/parser.go internal/toolparse/parser_fuzz_test.go internal/toolparse/parser_test.go internal/tools/builtins.go internal/tools/tools_test.go internal/tools/skill_tools.go`
- `go test ./...`

All checks passed.

## Working tree state

- These code changes are currently in the working tree and validated locally.
- Scratch files remain untouched and uncommitted:
  - `devplan.old`
  - `devplanold2.md`
  - `devplanold3.md`
  - `devplanold4.md`
  - `devplanold5.md`
  - `mondaydevplan.md`
