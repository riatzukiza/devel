DEVPLAN vNext: Tool Calls, Context Isolation, Resilience
Progress Update (2026-02-16)

Completed
- [x] Phase 0 (core): Added run trace envelopes with `run_id`, `session_id`, `channel`, `input_message_hash`, model request payload snapshots, extracted tool-call traces, and tool execution result logs.
- [x] Phase 0 (debug access): Added debug trace endpoint `GET /api/admin/debug/runs/<run_id>/trace` and persisted trace payloads on run records.
- [x] Phase 1.1: Added structured message types (`agent.ChatMessage`) and updated model requests to carry `system_prompt`, `messages`, and `allowed_tools`.
- [x] Phase 1.2: Removed `prependHistory()` from chat queueing; queued runs now receive raw user text only.
- [x] Phase 1.3: Threaded `session_id` through chat connector -> run queue -> executor -> runtime engine.
- [x] Phase 1.4: Runtime now appends tool results (`role=tool`) and final assistant output (`role=assistant`) back to `chatstore` with `run_id` metadata.
- [x] Phase 2.1: Enforced strict tool-call parsing to fenced `json/tool` blocks containing canonical `{tool_name, arguments}`.
- [x] Phase 2.2: Added `allowed_tools` filtering for parsed tool calls and `/tool` directives.
- [x] Phase 2.3: Explicitly rejects `tool.result` as an executable tool call.
- [x] Phase 2.4: Strict mode now executes at most one parsed tool call per model response (first valid call only), and runner-level immediate duplicate tool-call execution is blocked.
- [x] Phase 3 (partial): Dashboard now renders tool activity in a dedicated pane sourced from run traces, and adds chat UX controls for `/new`, `/chats`, and `/resume <id>`.
- [x] Phase 3 (partial): Discord now posts tool activity as a separate message block from final assistant output.
- [x] Phase 3 polish: Added dashboard session APIs + in-UI session browser with one-click open/resume and session message loading.
- [x] Phase 4 (partial): Added explicit provider request timeout wrapping and exponential retry backoff for transient provider failures.
- [x] Phase 4 (partial): Added per-tool execution timeout in the runner loop.
- [x] Phase 4 (partial): Added chatstore corruption guards (JSON backup fallback for meta/pointers and malformed JSONL line tolerance).
- [x] Phase 4: Added in-flight run draining on server shutdown plus queue-run tracker waiting semantics.
- [x] Phase 4: Added file-run-store compaction policy (prunes oldest terminal runs when persisted run count exceeds threshold).
- [x] Phase 5.1: Extracted strict parser into `internal/toolparse` with dedicated unit tests and fuzz test.
- [x] Phase 5.2: Added two-turn collision integration coverage asserting prior turns remain history and current turn remains the final actionable user message.
- [x] Phase 3 polish: Added expandable long tool-output display in dashboard tool activity pane.
- [x] Phase 3 polish: Added filtering/search over dashboard tool activity and recent session list.
- [x] Phase 3 polish: Added tool status quick filter (`all/errors/output`) and session sort modes (`recent/oldest/active first`).
- [x] Phase 2.4 hardening tweak: repeated tool calls now inject recoverable tool errors first, only fail after threshold repeats, and allow immediate retry when previous call errored.
- [x] Phase 3 UX resilience: dashboard run polling now distinguishes long-running jobs from hard failures, continues background polling, and updates chat when the run eventually completes/fails.
- [x] Phase 4 UX resilience: when tool-iteration cap is reached after useful tool outputs, runner now returns a graceful fallback response with recent tool results instead of hard-failing the run.

Still In Progress
- [ ] Phase 3 polish follow-up: saved filter views and keyboard shortcuts for tool/session navigation.

Phase 0 — Repro harness + observability (do this first)

Goal: turn the bug into a reliable test and make it obvious why a tool call happened.

 Add a “trace envelope” for every run:

run_id

session_id (chat session)

channel (dashboard/discord/http)

input_message_hash

extracted_tool_calls (raw snippets + parsed result)

tool execution results

 Add a debug endpoint or log dump (dev-only) that shows:

exact “Message” string sent to the model

“Prompt” length

whether history was injected

Acceptance:

You can copy/paste the exact model input from logs and reproduce the behavior deterministically.

Phase 1 — Fix “context collision” by making history structured (stop stuffing it into the user message)

Goal: the model should see history as previous turns, not as part of the current instruction.

1.1 Introduce a structured conversation type

 Add agent.ChatMessage { Role, Content, Name?, ToolCallID?, TS? }

 Update agent.ModelRequest to support:

SystemPrompt string (your assembled SOUL/RULES/TOOLS/etc.)

Messages []ChatMessage (history + current user turn)

Keep ToolResults []ToolCallResult only for the intra-run loop or migrate tool results into Messages as role=tool/assistant.

1.2 Stop using prependHistory() for the model call

Right now you do:

queuedMessage := prependHistory(history, msg.Text)

Replace with:

Queue the raw user message only

Pass session_id alongside the queued run (see 1.3)

1.3 Thread session_id through the run queue + executor

Right now, your queue/executor signature is essentially (agentID, message, source); you need (agentID, message, source, sessionID) (or metadata struct).

 Add SessionID to the run record (RunStore model)

 On chat message receipt:

resolve/create active session (you already do this)

store the user turn in chatstore

queue a run with {session_id, agent_id, message}

 In the executor:

load last N messages from chatstore by session_id

build Messages = history + {role:user, content: current_message}

1.4 Ensure assistant outputs + tool results get appended to chatstore

This is the “unwired” part that typically causes redo/duplication.

 After the run completes:

append {role:"assistant", content: FinalText, run_id}

for each tool call:

append {role:"tool", content: tool_result_json, run_id, tool_call_id, tool_name} or

append {role:"assistant", content:"Tool result …"} in a strict format

 Add a retention policy:

store full tool results but only replay the last K, plus summaries

or store full, but inject summaries into model context

Acceptance (collision):

Turn 1: “list files in .”

Turn 2: “create a file foo.txt”

The second run’s model input contains:

history as separate role messages

current instruction as the final user message

The model no longer “treats old user instructions as still pending” just because they’re present.

Phase 2 — Make tool calling strict and predictable

Goal: tools run only when the model explicitly asks, and only in one canonical format.

2.1 Pick one canonical tool-call format (and enforce it)

Recommend: fenced JSON object only, matching what your docs already suggest.

Example:

{"tool_name":"fs.list","arguments":{"path":"."}}


 In tool-call extraction: accept only:

a fenced JSON block labelled json (or a dedicated label like tool)

containing {tool_name, arguments}

 Disable / remove (or guard behind config):

shell snippet detection (ls, cat → tools)

“tool line” markdown parsing (**fs.edit** ...)

“function-call” parsing (fs.list(path="."))

“synthesize write calls” from natural language

This reduces “why did it do that tool call?” incidents dramatically.

2.2 Validate tool names against the registry allowlist

Right now tool parsing can succeed even for things you never registered; it should not.

 Add AllowedTools []string into ModelRequest

 When parsing tool calls, reject any tool not in AllowedTools

 Treat rejected tool calls as:

plain text (ignored) or

a recoverable “tool error” injected back to the model so it corrects itself

2.3 “tool.result” should never be executable

If the parser accepts tool.result as a callable tool name, you’ll see random “tool not registered” failures whenever the model echoes tool-result objects. Make tool.result a reserved output-only marker.

 Ensure tool-call parsing explicitly rejects tool_name == "tool.result"

 Keep tool.result only as an injected transcript element, never as a tool request

2.4 Tighten multi-call behavior

 Allow max 1 tool call per model response in strict mode

If multiple are found, either:

take the first and ignore the rest, OR

return an error to the model: “One tool call at a time”

 Add “same-call dedupe” at execution layer too (not just parsing):

if exact same (tool, args) was executed in the immediately previous iteration, require a reason or block

Acceptance (tools):

No tool runs unless the model outputs a valid JSON tool call block.

No “accidental fs.list” because the model printed “ls”.

Phase 3 — Repair the run loop UX so chat feels consistent

Goal: user sees clean assistant output; tool logs don’t pollute future prompts.

 In dashboard + discord message rendering:

show tool calls/results in a separate UI pane

do not feed tool logs back as user text

 In chatstore:

store tool call/results as structured messages, not mixed into assistant prose

 Add /new, /resume <id>, /chats UX buttons in dashboard:

you already have server-side commands

wire UI buttons to send those commands instead of users typing them

Phase 4 — Resilience hardening (timeouts, retries, corruption guards)

 Add context timeouts:

model request timeout (provider call)

per tool execution timeout (especially shell)

 Add provider retry policy:

exponential backoff for transient 429/5xx

 Add store corruption guards:

chatstore: validate JSON on load; keep backups; recover partial writes

run store (file): you already do atomic write; add periodic compaction if file grows

 Add “safe shutdown” for queue workers (finish in-flight runs, flush stores)

Acceptance:

If provider times out or returns malformed JSON, the run fails gracefully and the chat session remains usable.

Phase 5 — Cleanup: reduce spaghetti, make it testable

Goal: make the risky parts isolated and covered by tests.

5.1 Split tool parsing into its own package + unit tests

 Move parsing into internal/toolparse

 Add tests:

“model printed ls in an explanation” → no tool call

“model printed tool.result object” → no tool call

“valid tool JSON block” → parsed correctly

fuzz test: random text never causes panic

5.2 Add integration tests for “two-turn collision”

 Fake model that returns deterministic tool calls

 Simulate:

turn1 list

store tool result + assistant response

turn2 create file

 Assert turn2 does not include turn1 instruction as actionable current work

What I would implement first (highest ROI order)

Stop prependHistory() from being part of the user message and pass structured history instead.

Store assistant responses + tool results into chatstore so the model can see that the previous action already happened.

Strict tool-call parsing (JSON-only) with an allowlist filter.

Those three changes usually eliminate 80–90% of the “it did two things / it re-did the last tool / tool errors” pain.
