# Kanban extraction + issue refinement (2026-03-21)

## Goal
Extract the current standalone kanban implementation out of `orgs/open-hax/openhax/packages/kanban` into the workspace `packages/` area, enrich it with canonical Kanban FSM logic aligned to `docs/reference/process.md`, and use it to refine/label the previously swept GitHub issue backlog without touching `riatzukiza/TANF-app`.

## Constraints
- Do **not** mutate or triage `riatzukiza/TANF-app`; it remains a career/reference artifact.
- Follow the Kanban FSM in `docs/reference/process.md` as the canonical workflow.
- Prefer extracting proven logic from:
  - `orgs/open-hax/openhax/packages/kanban`
  - `orgs/riatzukiza/promethean/cli/kanban`
  - `orgs/riatzukiza/promethean/packages/github-sync`
- Put the extracted package under top-level `packages/` for now.

## Repo-local observations
- `orgs/open-hax/openhax/packages/kanban` is already a compact standalone markdown/Trello kanban package with CLI, board snapshotting, local UI, and task writeback.
- Its status model currently uses tokens like `in_progress` and `review`, which drift from the current canonical FSM language in `docs/reference/process.md` (`in_progress`, `in_review`, etc. appear in tooling, while the doc prefers display names like In Progress / In Review and includes `accepted`, `breakdown`, `blocked`, `ready`, `todo`, `in_progress`, `testing`, `document`, `done`, `rejected`).
- `orgs/riatzukiza/promethean/cli/kanban/packages/kanban-transition-rules` already contains reusable normalization and transition-validation logic.
- `orgs/riatzukiza/promethean/packages/github-sync` contains GitHub project/issue sync concepts, but its implementation is old and tightly coupled to `@promethean-os/kanban`.
- The prior GitHub sweep report already identified mirrored queues (`promethean`, `openhax`) and a CodeRabbit issue swarm in `open-hax/proxx`.

## Open questions
- Package naming: keep the package name `@openhax/kanban` in the extracted root package, or rename to a workspace-scoped experimental name? Default assumption: preserve `@openhax/kanban` for now.
- Should refinement output be local-only suggestions or direct GitHub label mutations? Default assumption for this pass: local-first artifacts plus CLI support for later mutation.

## Risks
- Blindly copying all of Promethean kanban would import too much legacy complexity.
- Existing status tokens across task files and GitHub labels may not match the new canonical FSM exactly.
- The root workspace `pnpm-workspace.yaml` does not automatically include every `packages/*` directory, so extraction requires workspace registration.

## Phases
### Phase 1: Design extraction target
- Inspect the existing OpenHax kanban package and identify the minimal files to extract.
- Identify small reusable FSM/normalization pieces from Promethean kanban.
- Define issue-refinement output shape aligned to the process doc.

### Phase 2: Extract package into `packages/`
- Create a new root package from the OpenHax kanban package.
- Register it in the workspace.
- Preserve build/test ergonomics.

### Phase 3: Add canonical FSM + refinement support
- Add canonical status normalization and legal-transition metadata aligned to `docs/reference/process.md`.
- Add issue/PR refinement helpers that map GitHub items into FSM states / labels / triage notes.
- Ensure `riatzukiza/TANF-app` is excluded from generated refinement outputs.

### Phase 4: Seed refined backlog artifacts
- Reuse the previous org sweep snapshot.
- Produce refined issue/PR recommendations in machine-readable and markdown form.
- Highlight label/state recommendations for the highest-signal repos.

### Phase 5: Verify
- Build/typecheck/test the extracted package.
- Verify the refinement artifacts are generated and exclude `riatzukiza/TANF-app`.

### Phase 6: Apply a first live label pass
- Add a safe CLI path to apply managed kanban labels to GitHub issues/PRs from the refinement snapshot.
- Start with a narrow live mutation scope: `open-hax/proxx` breakdown issues only.
- Preserve unrelated repo labels and avoid touching `riatzukiza/TANF-app`.

### Phase 7: Capture and advertise the workflow
- Capture the extracted/refinement/apply workflow as a reusable skill.
- Clarify all Kanban-related skills so they point at `packages/kanban` / `bin/eta-mu-board`.
- Add a stable workspace alias at `bin/eta-mu-board`.

## Implementation status
- ✅ Phase 1 complete: inspected `orgs/open-hax/openhax/packages/kanban`, Promethean transition rules, and GitHub label/application helpers to define the minimal extraction target.
- ✅ Phase 2 complete: extracted the OpenHax kanban package into `packages/kanban` and registered it in `pnpm-workspace.yaml`.
- ✅ Phase 3 complete: added canonical FSM normalization/transitions plus GitHub issue/PR refinement utilities and CLI commands (`fsm show`, `github refine`).
- ✅ Phase 4 complete: generated refined backlog artifacts under `docs/reports/github-triage/`, explicitly excluding `riatzukiza/TANF-app`.
- ✅ Phase 5 complete: `pnpm --filter @openhax/kanban build` and `pnpm --filter @openhax/kanban test` both passed.
- ✅ Phase 6 complete: added live `github apply` label support and applied the first managed kanban labels to `open-hax/proxx`, `open-hax/openhax`, and `open-hax/codex`, while leaving `riatzukiza/TANF-app` untouched.
- ✅ Phase 7 complete: captured the workflow as the `eta-mu-board` skill, updated Kanban-related skills to point at `packages/kanban`, and added the `bin/eta-mu-board` workspace wrapper.
- ✅ Follow-on rollout: used `bin/eta-mu-board` to apply the remaining `open-hax/proxx` incoming / accepted / in_review labels after a dry-run-first pass.

## Definition of done
- A kanban package exists under `packages/` and is wired into the workspace.
- The package exposes canonical FSM status/transition support aligned with `docs/reference/process.md`.
- A local refinement artifact exists for the swept GitHub issues/PRs, excluding `riatzukiza/TANF-app`.
- The extracted package builds/tests successfully or any remaining blocker is explicitly recorded.
