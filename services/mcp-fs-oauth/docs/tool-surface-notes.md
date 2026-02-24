# Tool surface notes (mcp-fs-oauth)

This doc captures practical issues discovered while exercising the Promethean tool surface and the `mcp-fs-oauth` service. It is intentionally action-oriented: each item includes symptoms, likely cause, and a concrete fix direction.

## 1) `lsp_diagnostics` fails with JSON parse error

**Symptom**
- Calling `lsp_diagnostics` returns: `JSON Parse error: Unrecognized token '<'`.

**Likely cause**
- The diagnostics endpoint is returning an HTML error page (starts with `<`), but the client expects JSON.
- Common sources: 401/403 HTML error response, reverse proxy sending an HTML "not found" page, or an upstream crash returning a default HTML response.

**Fix direction**
- Ensure the diagnostics endpoint always returns JSON (`Content-Type: application/json`) on both success and error.
- If the upstream is not available, return a JSON fallback payload (e.g., `{ "error": "unavailable" }`).
- In the client/tool wrapper, detect non-JSON by content-type or first byte and surface a more actionable message (status code + endpoint).

## 2) Background task retrieval API mismatch

**Symptom**
- Session messages may include instructions like `background_output(task_id="...")`, but the tool surface does **not** expose a `background_output` method.

**Impact**
- Agents report completion IDs that cannot be retrieved via the available Promethean tools.

**Fix direction**
- Either:
  - expose a `background_output` tool, **or**
  - stop emitting `background_output(...)` instructions and instead publish results as normal session messages retrievable via `session_messages` / `session_final_output`.

## 3) Session reference ambiguity (aliases vs titles vs raw ids)

**Symptom**
- `list_sessions` shows `S#### | <title>`.
- Some session tools accept titles reliably, but using `S####` can produce `state unknown` or `session not found` depending on the tool and context.

**Likely cause**
- Aliases are mapped per MCP session context; if the tool call is not executed under the same `mcp-session-id` context (or uses query-based session ids), alias resolution can fall back.

**Fix direction**
- Unify session-id extraction for context binding:
  - read `mcp-session-id` header
  - fallback to query param `?sessionId=` (supported by `createMcpHttpRouter`)
- Ensure *all* `session_*` tools resolve `S####` consistently.
- Consider emitting both: `S#### (realId hidden)` and accepting `S####` as the canonical reference.

**Update (implemented)**
- Session aliases now resolve from a process-global alias store (with TTL cleanup) first, then MCP-session-scoped cache.
- `list_sessions` mints/refreshes aliases in the global store and emits an explicit fallback reference when available:
  - format: `S#### | <title> | ref=<slug>`
- `session_*` tools accept session refs in this order:
  1. `S####` alias
  2. raw `ses_*` id
  3. exact `title`
  4. exact `slug` (matches `ref=<slug>` from `list_sessions`)
- Alias GC uses `MCP_SESSION_TTL_SECONDS` and refreshes on alias mint/resolve.

## 4) Hidden-path defaults: reads guarded, mutations still need guards

**Status**
- Read tools (`fs_read*`) now block dotfiles/dot-dirs by default unless `includeHidden=true`.
- Discovery tools generally support `includeHidden`.

**Gap**
- Mutation tools (`fs_write`, `fs_delete`, `apply_patch`) historically lacked `includeHidden` and hidden-path blocking.

**Fix direction**
- Add `includeHidden: boolean = false` to mutation tool schemas.
- Block any path containing a dot-segment unless `includeHidden=true`.
- For `apply_patch`, enforce the guard for every file operation (add/update/delete/move).

**Update (implemented)**
- `fs_write`, `fs_delete`, and `apply_patch` now accept `includeHidden` and block dotfile/dot-dir mutations by default.
- `apply_patch` inspects patch directives and rejects hidden targets unless `includeHidden=true`.

## 5) Entropy-based redaction vs orchestration ids

**Problem**
- Entropy redaction is useful for secrets but creates false positives on necessary high-entropy ids (session/message ids) and on legitimate hashes.

**Fix direction**
- Split sanitizers:
  - `redactSecretsOnly(text)` (pattern-based) as the default for tool outputs
  - keep `redactHighEntropyText` as an opt-in for `fs_read*` only (e.g., `entropyRedact=true`)
- Keep id aliasing at the tool boundary (`ses_*` → `S####`, `msg_*` → `M####`) rather than redacting ids.

**Update (implemented)**
- `redactSecretsOnly(text)` exists and is used by `sanitizeSensitiveText(text)`.
- `fs_read*` exposes `entropyRedact` (default false) to enable entropy redaction only when explicitly requested.
- `redactSecretsOnly(text)` now performs name-aware env handling:
  - standalone ALL_CAPS secret-like names are replaced with `[redacted_env]`
  - sensitive ALL_CAPS assignments are normalized to `[redacted_env]=[redacted]`
  - non-secret ALL_CAPS assignments (for example `PORT=3000`, `NODE_ENV=production`) are left readable.
- `sanitizeSensitiveText(text)` now applies benign-id truncation (not redaction):
  - long hex tokens (`>=32`) become `prefix...[len:N]...suffix`
  - base64url-like blobs (`>=40`) use the same truncation shape
  - `ses_*`/`msg_*` ids are preserved for aliasing and orchestration, so `S####`/`M####` remain canonical references.

## 6) Tool surface vs repo schema drift

**Symptom**
- The Promethean tool wrapper may reject newly added arguments even after the repo is updated (e.g., older wrappers may not accept `entropyRedact`/`includeHidden` on certain tools).

**Impact**
- Orchestrations become brittle: the MCP server supports the option, but the client/tool wrapper blocks it.

**Fix direction**
- Ensure the wrapper refreshes tool schemas from the MCP server at connection time (or on version bump).
- Prefer additive parameters with safe defaults and keep backward compatibility paths.

## 7) Resource-path mismatch (`/link_<id>/...` vs base tools)

**Symptom**
- Some environments expose tools under `/promethean authed/<tool>` while others may advertise `/promethean authed/link_<id>/<tool>`.

**Impact**
- Calls can fail with `Resource not found` even when the underlying tool exists.

**Fix direction**
- Normalize tool routing so only one canonical path is emitted to clients.
- If links are necessary, provide a stable alias mapping and/or a redirect.
