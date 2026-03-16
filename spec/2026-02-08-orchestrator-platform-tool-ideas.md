# Orchestrator and Code Review Platform Tool Ideas

Date: 2026-02-08

This document captures brainstormed tool ideas intended to turn ChatGPT into a high-level orchestrator/planner/code review platform.

**Naming note:** tool names in this spec avoid `.` characters (use underscores instead).

---

## 1) Task orchestration primitives (core)

These make delegation predictable and auditable.

- `task_start`
  - Inputs: `{ agent, title, prompt, inputs?, constraints?, requireFinalReport?, labels? }`
  - Output: `{ taskId, sessionId, requestedAgent, actualAgent }`
  - Contract: fail fast if agent invalid; verify `actualAgent` matches request.

- `task_wait`
  - Inputs: `{ taskId, until: "completed"|"failed", timeoutMs?, pollMs? }`
  - Output: `{ state, updatedAt, progress?, lastEvent? }`

- `task_result`
  - Inputs: `{ taskId, format: "final"|"full"|"structured" }`
  - Output: `{ finalReport, structuredSummary?, artifacts?, filesChanged? }`
  - Contract: if `requireFinalReport=true`, automatically resume the agent to produce a final report.

- `task_cancel`, `task_resume`, `task_retry`
  - Useful for broken sessions / compaction / “tool-calls only” endings.

---

## 2) Session introspection tools (debuggable, compact)

These exist so we can review/audit without spelunking message JSON.

- `session_tail(sessionId, n=50)`
  - Returns last N events in a condensed human-readable format.

- `session_final(sessionId)`
  - Returns the final assistant answer (or “none”), plus a short reason.

- `session_tool_calls(sessionId, cursor?, limit?)`
  - Returns only tool invocations and args, plus timestamps.

- `session_export(sessionId, format="md"|"jsonl")`
  - Produces an artifact file that can be diffed/reviewed.

---

## 3) Codebase-aware planning tools (intent → plan)

These help operate at “orchestrator” level.

- `plan_create(goal, repoRoot, constraints?)`
  - Output: structured plan with steps, owners (agent types), risk, verification commands.

- `plan_refine(planId, feedback)`

- `plan_assign(planId, policy)`
  - Example policy: “coding agent for code changes, explore agent for research, review agent for PR feedback”.

- `plan_checklist(planId)`
  - Produces a checkbox list and a definition-of-done.

---

## 4) Change tracking and provenance (what changed, why, by whom)

Critical for a review platform.

- `changes_since(timeOrCommit, scope?)`
  - Output: `{ filesAdded, filesModified, filesDeleted, lockfileChurn, generatedFilesSuspected }`

- `changes_by_task(taskId)`
  - Joins: “files touched” from tool calls + git diff + timestamps.
  - Output: a review-ready summary.

- `changes_explain(filePath)`
  - Reads diffs and produces: “what changed”, “likely reason”, “risk”, “tests to run”.

---

## 5) Review as a first-class workflow

Instead of “ask the model to review”, make review tools explicit.

- `review_request(scope, goals, rubric?, severityThreshold?)`
  - Output: issues grouped by severity + suggested patches.

- `review_verify(fixes, commands?)`
  - Runs checks and attaches evidence.

- `review_gate(criteria)`
  - Returns pass/fail + what’s missing (tests, docs, lint, changelog).

Rubric examples: security, DX, performance, API stability, migration risk.

---

## 6) “Safe edit” tools (patch-first + verification)

Edits should be structured so the UI can preview the impact.

- `edit_apply_patch(patchText, dryRun?)`

- `edit_plan(diffIntent, constraints)`
  - Produces a patch proposal without applying.

- `edit_apply_and_verify(patchText, verifySteps)`
  - Applies patch, then runs verification commands, then reads back touched regions.

This creates a tight loop: proposal → approval → apply → evidence.

---

## 7) Execution evidence tools (commands → logged artifacts)

For orchestrator workflows, prefer evidence over “trust me”.

- `run_command(commandId, args, timeoutMs?)`

- `run_capture(title, commandId, args, attachFiles?)`
  - Writes stdout/stderr into `artifacts/...` and returns a link/path.

- `run_matrix(name, commands[])`
  - Runs a small batch and summarizes results.

---

## 8) Knowledge and policy overlays (consistent behavior across agents)

To make it a platform, policies must be encoded and applied.

- `policy_set(name, content)` / `policy_get(name)`
  - Example: “prefer fs_glob → fs_grep → fs_read; avoid broad fs_tree.”

- `policy_enforce(taskId, policyName)`
  - Fails tasks that violate policies (e.g., attempted write outside root).

- `policy_prompt_templates(toolName)`
  - Returns the large, clear tool prompt blob for that tool (useful for UI transparency).

---

## 9) Workspace health and misconfiguration detection

Stops “HTML returned from API” / wrong base URL issues early.

- `health_check_all()`
  - Verifies OpenCode API, workspace API, planner API, auth tokens.
  - Returns actionable fixes.

- `health_check_opencode()`, `health_check_workspace()`, etc.

---

## 10) Meta-tools for building the platform itself

Since tool design will iterate, include tools that help author tools.

- `tools_spec_lint()`
  - Checks: descriptions include purpose/inputs/outputs/examples; permission metadata present; risky tools flagged.

- `tools_prompt_preview(toolName, exampleArgs)`
  - Shows exactly what the permission dialog will say.

- `tools_contract_test(toolName)`
  - Runs a canned test that verifies shape + error modes.

---

## Minimal set to unlock an “orchestrator” quickly

If selecting a minimal starting suite:

1) `task_start`, `task_wait`, `task_result`, `task_cancel`
2) `session_final`, `session_tool_calls`, `session_tail`
3) `changes_by_task`, `changes_since`
4) `review_request`, `review_gate`
5) `health_check_opencode`, `health_check_workspace`

Everything else can layer on once these contracts are solid.
