---
name: eta-mu-board
description: Use the workspace kanban tool at packages/kanban via bin/eta-mu-board to inspect the canonical FSM, refine GitHub issues/PRs into FSM states, and apply managed labels safely.
---

# Skill: Eta Mu Board

## Goal
Treat `packages/kanban` as the canonical kanban implementation for this workspace and drive it through `bin/eta-mu-board` (chat shorthand: `@bin/eta-mu-board`).

## Use This Skill When
- You need the canonical kanban command in this workspace.
- You need to inspect the live FSM or explain canonical states.
- You need to refine GitHub issues/PRs into Kanban states and labels.
- You need to apply managed kanban labels safely to GitHub issues/PRs.

## Do Not Use This Skill When
- You are editing legacy Promethean `cli/kanban` internals directly and do not need the extracted workspace tool.
- You only need a one-off markdown edit unrelated to board/FSM or issue triage.

## Inputs
- Optional task directory.
- Optional GitHub sweep/refinement JSON artifact.
- Repo slug and optional state/kind/number filters for apply passes.

## Steps
1. Use `bin/eta-mu-board` as the entrypoint; treat `packages/kanban` as source-of-truth and older `pnpm kanban` / `@promethean-os/kanban` references as legacy unless you are explicitly repairing them.
2. Inspect the workflow with `bin/eta-mu-board fsm show` before normalizing states or recommending transitions.
3. Generate local recommendations with `bin/eta-mu-board github refine --snapshot <json> --out <json> --report <md>`.
4. Exclude sensitive or intentionally out-of-band repos (for example `riatzukiza/TANF-app`) unless the user explicitly overrides.
5. Run `bin/eta-mu-board github apply ... --dry-run` first, then do the live apply pass.
6. When applying labels, only manage the kanban-owned namespaces: `kanban`, `artifact:*`, `state:*`, `priority:*`, `source:*`, `triage:*`, `risk:*`, `checks:*`, and `merge:*`; preserve unrelated labels.

## Output
- Canonical FSM summary.
- Refinement JSON + markdown report.
- Apply JSON/report for any live label pass.
