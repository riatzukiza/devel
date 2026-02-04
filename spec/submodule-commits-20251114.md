# Submodule Commit Sweep (2025-11-14)

## Context
- **Branch:** `device/stealth`
- **Instruction:** Methodically, recursively commit all submodule changes and update parent repo pointers.
- **Touched files so far:**
  - `orgs/open-hax/codex` (multiple workflow/spec/doc updates per `bin/submodules-status`)
  - `orgs/openai/codex` (new commits pending)
  - `orgs/riatzukiza/agent-shell/AGENTS.md` and `CROSS_REFERENCES.md`
  - `orgs/riatzukiza/openhax/AGENTS.md` and `CROSS_REFERENCES.md`
  - `orgs/riatzukiza/promethean` (new commits pending)
  - `orgs/riatzukiza/stt` (fatal: missing `.gitmodules` entry)
  - `orgs/sst/opencode/spec/memory-leaks.md`, `packages/opencode/script/memory/acp-session-leak.ts`, and `logs/acp-session-leak-*.heapsnapshot`
  - `src/giga/run-submodule.ts` lines 1-233 (Bun-based runner script)

## Prior Work / References
- No existing issues or PRs referenced for these changes as of 2025-11-14.

## Definition of Done
1. Each dirty submodule (`orgs/open-hax/codex`, `orgs/openai/codex`, `orgs/riatzukiza/agent-shell`, `orgs/riatzukiza/openhax`, `orgs/riatzukiza/promethean`) has a clean git status with committed changes pushed or ready locally.
2. The `orgs/riatzukiza/stt` mapping issue is diagnosed and either resolved (entry added) or documented with mitigation steps.
3. Parent repository records updated submodule SHAs and local change `src/giga/run-submodule.ts` is addressed (committed or explicitly deferred).
4. `bin/submodules-status` runs cleanly with no dirty worktrees or fatal mapping errors.
5. All commits include meaningful messages explaining the intent (automation, docs, etc.).

## Requirements
- Follow repository-specific contribution guides inside each submodule.
- Prefer conventional commit messaging if enforced (verify per submodule).
- Ensure each submodule's tests or linters relevant to touched files run (where feasible) before committing.
- Document any blockers or missing context directly within this spec under "Execution Notes" as work progresses.

## Execution Notes
- Verified `orgs/open-hax/codex` and `orgs/openai/codex` already clean; no local commits pending besides pointer updates.
- Committed OAuth reference corrections inside `orgs/riatzukiza/{agent-shell, openhax, stt}`.
- Added missing `.gitmodules` entry for `orgs/riatzukiza/stt` to silence fatal errors.
- Added memory leak reproduction spec + script inside `orgs/sst/opencode` (including heap snapshots) to document ACP session leak.
- Confirmed `orgs/riatzukiza/promethean` only has divergent commits already recorded (no working tree edits).
