# LSP Diagnostics Tools Plan (OpenCode-leveraged)

Date: 2026-02-09

This spec proposes a small, high-signal set of **Language Server Protocol (LSP)** diagnostic tools that turn ChatGPT + OpenCode into a practical “orchestrator / code review” platform.

Naming note: tool names avoid `.` characters; use underscores.

---

## 1) Goals

1. Provide **reliable, structured diagnostics** (errors/warnings/info) for a workspace without the model needing to understand LSP JSON-RPC or OpenCode REST endpoints.
2. Make diagnostics **review-friendly**: stable output shape, deduping, severity grouping, and file/range metadata.
3. Integrate with OpenCode workflows:
   - run diagnostics after edits (or on changed files),
   - produce evidence artifacts (logs/reports),
   - optionally delegate to agents for deeper triage.
4. Fit the permission UX:
   - diagnostics should be read-only w.r.t. files,
   - any process spawning should be clearly disclosed and allowlisted.

Non-goals (v1): full LSP feature parity (hover, completion, rename), remote language server hosting, cross-workspace caching.

---

## 2) User workflows

### Workflow A: After edits, confirm repo is healthy
1) apply patch / write changes
2) run `lsp_diagnostics_changed`
3) if failures: run `lsp_diagnostics_explain` (optional) or delegate `task_start` to investigate

### Workflow B: Pre-review gate
1) run `lsp_diagnostics_workspace` (or project subset)
2) attach report to review summary
3) block merge if errors exceed threshold

### Workflow C: Triage a file
1) run `lsp_diagnostics_file(path)`
2) optionally request `lsp_code_actions(path, range)` later (v2)

---

## 3) Proposed tool set (MVP)

### 3.1 `lsp_diagnostics_workspace`

Runs LSP diagnostics for a workspace subset.

**Inputs**
- `language`: enum (see §4)
- `root`: optional workspace root (defaults to tool’s configured root)
- `include`: optional glob (default: language-appropriate)
- `exclude`: optional glob
- `maxFiles`: default 200 (avoid “scan everything”)
- `timeoutMs`: default 60000
- `format`: `compact|full` (default compact)

**Outputs**
- `summary`: counts by severity
- `diagnostics`: list of
  - `path`
  - `range` (start/end line/character)
  - `severity` (`error|warning|info|hint`)
  - `message`
  - optional `code`, `source`, `related`

**Notes**
- Read-only re: repository contents.
- Internally can spawn an LSP server process (must be allowlisted or bundled).

---

### 3.2 `lsp_diagnostics_file`

Runs diagnostics for a single file.

**Inputs**: `{ language, path, timeoutMs?, format? }`

**Outputs**: same diagnostics shape, scoped to one file.

---

### 3.3 `lsp_diagnostics_changed`

Runs diagnostics only for files changed in git (or within a provided file list).

**Inputs**
- `language`
- `base`: optional git ref (default: `HEAD`) or `sinceTime`
- `paths`: optional explicit list of file paths
- `timeoutMs`

**Outputs**
- includes `changedFiles` list
- diagnostics only for changed files

Implementation should prefer:
- `git diff --name-only <base>` if repo is git
- fallback: `paths` required if no git

---

### 3.4 `lsp_server_health`

Preflight checks.

**Inputs**: `{ language }`

**Outputs**
- `ok: boolean`
- `server`: `{ name, version?, command }`
- `configHints`: list of actionable suggestions (missing binary, missing config, etc.)

---

## 4) Language support (phased)

### Phase 1 (MVP)
- `typescript` (tsserver or typescript-language-server)
- `javascript` (same server)

### Phase 2
- `python` (pyright-langserver)
- `rust` (rust-analyzer)

### Phase 3
- `go` (gopls)
- `json` / `yaml` (language servers if needed)

Each language must define:
- server command (and how it’s installed)
- default include glob
- root detection rules (tsconfig/pyproject/Cargo.toml, etc.)

---

## 5) Architecture options

### Option A: MCP-native LSP runner (recommended)
Implement LSP client logic inside `services/mcp-fs-oauth`:
- spawn language server process
- speak LSP JSON-RPC over stdio
- open documents (read via filesystem tools)
- collect `textDocument/publishDiagnostics`

Pros:
- deterministic tool API
- consistent permission prompts
- minimal dependence on OpenCode session internals

Cons:
- implement and maintain LSP client + per-language server management

### Option B: OpenCode session-backed diagnostics runner
The MCP tool uses OpenCode to run an allowlisted diagnostics command inside a fresh session:
1) create session
2) run an allowlisted command that emits a JSON diagnostics report
3) return parsed results

Pros:
- reuses OpenCode’s process environment and logging
- natural evidence flow (store logs/reports)

Cons:
- still needs a reliable high-level wrapper (otherwise falls back to raw REST)
- more moving parts for latency/failures

Plan: start with Option A for correctness; add Option B as an execution backend once stable.

---

## 6) Output contract (stable + review-friendly)

### 6.1 Severity mapping
Normalize LSP severities to: `error|warning|info|hint`.

### 6.2 Deduping
Some servers emit repeated diagnostics on open/change. Dedup by:
- `{path, range, severity, message, code, source}`

### 6.3 Compact format
Compact output should:
- group by file
- show top N per file (default 50)
- include summary counts

### 6.4 Full format
Includes:
- related information
- tags (deprecated/unnecessary)
- server-provided metadata

---

## 7) Permission and prompting model

Diagnostics tools should be read-only to the repo, but they may spawn processes.

Recommended permission keys:
- `read` (for reading files)
- `exec` (for spawning language servers) — allowlist per language server command

Permission dialog text should be derived from structured intent, e.g.:
- “Run TypeScript diagnostics (spawns typescript-language-server)”
- “Read N files under <root> for diagnostics”

Avoid over-promising in prompts—describe the actual action.

---

## 8) Implementation plan (incremental)

### Step 0: Spec + scaffolding
- Add this spec.
- Define tool names, inputs, outputs, error taxonomy.

### Step 1: Minimal TypeScript diagnostics
- Implement LSP transport over stdio.
- Support opening one file and returning diagnostics (`lsp_diagnostics_file`).
- Add health check (`lsp_server_health`).

### Step 2: Workspace subset + changed-files
- Add `lsp_diagnostics_workspace` with include/exclude + maxFiles.
- Add `lsp_diagnostics_changed` using git diff.

### Step 3: Evidence artifacts
- Optionally emit a JSON report into `artifacts/lsp/<timestamp>-<lang>.json`.
- Add a tool option `writeReport: true`.

### Step 4: Add one more language
- Python (pyright) is a good next step.

---

## 9) Testing strategy

1) Unit tests:
- parse/serialize JSON-RPC frames
- diagnostics normalization + dedupe
- include/exclude file selection

2) Integration tests (fixture projects):
- small TS project with known errors
- run `lsp_diagnostics_file` and assert returned diagnostics match expected ranges/messages (stable subset)

3) Permission tests:
- ensure diagnostics does not write files
- ensure server command is allowlisted

---

## 10) Future extensions (v2+)

- `lsp_code_actions(path, range)`
- `lsp_format(path)` (dangerous; would be an edit tool)
- `lsp_symbol_search(query)`
- `review_gate_lsp(thresholds)` — integrates with `review_gate`
- `lsp_diagnostics_by_task(taskId)` — run diagnostics for files changed by a delegated coding session

---

## 11) Acceptance criteria

- A user can run diagnostics without specifying any REST endpoints or understanding LSP.
- Output is stable and structured enough for code review comments.
- “Changed files” mode avoids scanning the entire repo.
- Misconfiguration returns actionable errors (missing server, missing config, wrong root).
