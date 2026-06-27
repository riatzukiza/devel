# OpenCode Delegation Without Raw REST

Date: 2026-02-08

## Note on editing specs

When making changes in this repo, prefer `apply_patch` with a **unified patch**.
In practice, this means using a patch block with Begin/End markers and an Update File section.

## Problem

The current MCP surface in `services/mcp-fs-oauth` exposes low-level REST passthrough tools:

- `opencode_rest`
- `openplanner_rest`
- `workspace_rest`

…and a few partial wrappers (`list_agents`, `list_sessions`, `opencode_session_*`, `workspace_*`).

This forces the user (and the assistant) to:

1. know/guess undocumented API routes (`/session/{id}/prompt_async`, message listing paths, etc.)
2. infer task state by scraping message history
3. debug base URL mismatches (HTML app shell returned instead of JSON)
4. manually stitch multi-step workflows (delegate → poll → result extraction)

The result is fragile delegation:

- agent mismatch/fallback isn’t caught early
- sessions can finish with no final report
- prompt endpoints can return HTML when misconfigured
- confirmation dialogs show confusing “intent” because the tool surface is too generic

## Review of current REST tool implementations

All REST tools share the same helper in `services/mcp-fs-oauth/src/index.ts`:

- `callApi(baseUrl, method, apiPath, body?, apiKey?)`

Key observations:

### 1) No “wrong endpoint” detection

`callApi` sets `Accept: application/json` but does **not** treat HTML as a hard error.
If a base URL points at a UI origin (or wrong proxy route), callers receive an HTML app shell and continue.

**Recommendation:** detect `text/html` content-type or `<!doctype html` prefix and return a structured, actionable error.

### 2) No workflow contract

`delegate_task`:

- creates a session with `{ agent: agentType }`
- posts to `/session/{id}/prompt_async`
- returns immediately

There is no:

- validation that `agentType` exists
- verification that the created session’s agent matches the request
- waiting/polling semantics
- result extraction

### 3) Duplicated but incomplete wrappers

Wrappers like `opencode_session_prompt` still require the caller to understand sync vs async semantics (`prompt` vs `prompt_async`) and how to locate results.

### 4) Workspace REST wrappers are easy to misconfigure

`WORKSPACE_API_BASE_URL` defaults to `.../api/workspace` and wrappers call `/meta`, `/list`, `/file`.
If the gateway expects `/api/workspace/workspace/*` (or vice versa), tools 404.
Because errors are returned as generic text, the assistant must reverse engineer the routing mismatch.

## Goal

Keep `*_rest` tools for power users, but make them non-primary.
Provide high-level, precise tools that:

- encode the workflow steps
- validate inputs
- return compact, structured results
- produce stable confirmation dialogs

## Proposed higher-level tools

### OpenCode: Delegation workflow tools

#### `opencode_agent_list`

- returns an array of agents: `{ name, mode, description? }`
- supports `maxResults`

#### `opencode_agent_validate`

Input: `{ agent: string }`

Output: `{ ok: boolean, resolvedAgent?: string, reason?: string, suggestions?: string[] }`

#### `opencode_task_create`

Creates a session and submits the initial prompt.

Input:

```json
{
  "agent": "hephaestus",
  "title": "…",
  "prompt": "…",
  "requireFinalReport": true,
  "labels": ["delegation"]
}
```

Output:

```json
{
  "taskId": "<opaque>",
  "sessionId": "ses_…",
  "requestedAgent": "hephaestus",
  "actualAgent": "hephaestus",
  "state": "queued|running"
}
```

Behavior:

- validates agent exists
- verifies created session agent matches
- stores `taskId → sessionId` mapping (in-memory initially is fine)

#### `opencode_task_status`

Input: `{ taskId | sessionId }`

Output:

```json
{
  "state": "queued|running|completed|failed",
  "updatedAt": 123,
  "hasFinalReport": true,
  "lastEvent": "…"
}
```

#### `opencode_task_wait`

Input: `{ taskId | sessionId, timeoutMs?: number, pollMs?: number }`

Returns when the state is terminal.

#### `opencode_task_result`

Input: `{ taskId | sessionId, maxChars?: number }`

Output:

```json
{
  "finalReport": "…",
  "filesChanged": ["…"],
  "notes": ["…"],
  "rawSessionId": "ses_…"
}
```

Behavior:

- pulls messages and extracts the final assistant report (last assistant message not purely tool-calls)
- if missing and `requireFinalReport=true`, automatically sends: “write final report now; no tools”, then retries

#### `opencode_task_log_tail`

Input: `{ taskId | sessionId, limit?: number }`

Output: compact event lines (not raw JSON).

### Workspace: Prefer `fs_*`, demote REST

For local workspace manipulation, `fs_list/fs_glob/fs_grep/fs_read/fs_write/fs_delete` already provide a safe, predictable interface.

Recommendations:

- Mark `workspace_rest` as “advanced/debugging only” in its tool description.
- Add `workspace_api_health`:
  - calls the configured workspace base
  - verifies JSON content-type
  - returns a specific error if HTML/404 is received, with suggested base URL forms.

### OpenPlanner: same pattern

Keep `openplanner_rest` but add:

- `openplanner_session_get`
- `openplanner_session_tail`

…so common usage does not require route knowledge.

## Implementation plan for `services/mcp-fs-oauth`

1) Add content-type guards in `callApi`:
   - if HTML, return `ok=false` with a standardized error object and hint text.

2) Implement `opencode_task_*` tools by composing existing REST calls internally.
   - Keep `opencode_rest` as debugging-only.

3) Update README:
   - steer users to `opencode_task_*` for delegation
   - document which fields appear in confirmation dialogs (`intent` fields)

4) Tests:
   - unit tests for HTML detection
   - unit/contract tests for agent validation
   - contract test: `requireFinalReport=true` yields `finalReport`

## Acceptance criteria

- Delegation can be performed without specifying REST paths.
- If the agent name is wrong, tools fail fast with actionable feedback.
- If OpenCode returns HTML, tools return a clear misconfiguration error.
- A completed task reliably returns a `finalReport`.
