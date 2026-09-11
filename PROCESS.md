# PROCESS — devel workspace charter (stealth)

This is a mini-charter for process inside `~/devel` on stealth. The full
process doctrine lives in the epiphany space:

> **Canonical process:** [`../spaces/foresight/epiphany/PROCESS.md`](../spaces/foresight/epiphany/PROCESS.md)
> (absolute path on stealth: `~/spaces/foresight/epiphany/PROCESS.md` —
> verified to exist 2026-09-11; it is outside this repo, hence the relative
> link resolves only on-host.)

## Planning source of truth

- **Kanban cards** are the planning source: `kanban/` (workspace-level specs:
  muse-core, daimoi-core, presence-core, web-graph-weaver, eta-mu-extraction
  vault, ...) and `docs/agile/tasks/` (epics: codex-opencode-integration,
  services-compose-k8s-dual-path, knowledge-graph-streaming-webgl,
  Nested-Submodule-Package Phases 1–4, plan-925/task-925).
- Cards sync to GitHub issues via `eta-mu kanban sync github` (idempotent
  `openhax-kanban-sync` uuid markers; throttled writes; see AGENTS.md table
  of 30+ synced kanban directories).
- Statuses observed on stealth `docs/agile/tasks/`: mostly `incoming`
  (15), one `todo`, one `completed` — plan work by picking from incoming.

## Work cycle

1. **Observe** — read the kanban card, related specs, and `receipts.edn`
   before writing anything.
2. **Model** — clarify intent from repo evidence; ask only when blocked.
3. **Plan** — small, verifiable steps; specs + phases for multi-step work.
4. **Execute** — inside the correct submodule; explicit path-scoped staging.
5. **Verify** — lint/typecheck/tests in the touched repo; zero warnings rule.
6. **Record** — append to `receipts.edn` (append-only); update kanban card
   status via `eta-mu kanban`.

## Git discipline (stealth-specific)

- Superproject branch: `device/stealth` — never switch, never amend.
- Commits: conventional style (`docs: ...`, `chore: ...`, `feat(scope): ...`),
  explicit adds only.
- Nested repos keep their own branches; pointer bumps are deliberate commits.
- Uncommitted inventory is normal (currently 74 entries); preserve it, never
  sweep it.

## Review & reflection

- PR review flows through GitHub (Kimi triage + CodeRabbit merge-blocking
  comments where branch protection allows).
- After substantive turns: retrospective + receipt; repeated friction becomes
  a skill spore for incubation (session-mycology pattern).
- Removals of commands/plugins/config entries require a receipt note first.

## Escalation

Blocked → record a `(q ...)` unknown in receipts → surface in the kanban card
comments → proceed to the next unblocked task rather than idling.
