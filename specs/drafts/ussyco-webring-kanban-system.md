# Draft Spec: ussyco.de webring kanban system (Ussyverse board)

## Mission
Provide a lightweight, repeatable way to manage ussyco.de webring site work (new sites, updates, audits) inside the existing `open-hax/ussyverse-kanban` board, so all webring work can be triaged and tracked alongside other Ussyverse tasks.

## Context / Current State
- The Ussyverse kanban repo is `orgs/ussyverse/kanban` (GitHub: `open-hax/ussyverse-kanban`).
- Tasks are Markdown files with YAML frontmatter and are synced to Trello on merge-to-main.
- A separate “webring-site” skill exists describing the operational steps to build + serve + register a webring site.

## Problem
Webring work currently lives as ad-hoc notes/procedures. We want:
- a standard task template with an embedded checklist that matches the operational steps
- optional automation to generate new tasks consistently (uuid, timestamps, file naming)
- a small doc describing how we use the board for webring work

## Non-goals
- Do not change Trello list mapping / FSM states.
- Do not attempt to deploy/modify the production webring service (`ussycode.service`) from this repo.
- Do not require new runtime dependencies.

## Proposed Solution
Add three pieces to `open-hax/ussyverse-kanban`:

1. **Docs**: `docs/webring.md`
   - “How we track webring work”
   - checklist / acceptance criteria
   - links to the webring API and the skill

2. **Template**: `templates/webring-site.task.md`
   - a copyable task file skeleton (frontmatter + sections)
   - a detailed checklist derived from the “webring-site” operational steps
   - standard labels: `webring`, `site`, `proxy`, plus stage-specific labels as needed

3. **Generator script**: `scripts/new-webring-site-task.mjs`
   - generates a task file into `tasks/incoming/`
   - inputs: display name, subdomain, short description
   - outputs: markdown with yaml frontmatter, consistent title, uuid, created_at
   - no external deps; uses Node built-ins (`crypto.randomUUID()`)

## Open Questions
1. Should we auto-import existing webring members from `https://ussyco.de/api/webring` and create one task per site?
2. Do we want a separate label taxonomy (e.g. `webring:concept`, `webring:build`, `webring:register`) or keep it minimal?
3. Should the generator support “audit existing site” tasks in addition to “create new site” tasks?

## Risks
- Creating tasks for *all* existing members could spam the board. Prefer opt-in automation.
- Running scripts requires Node >= 18 for stable `randomUUID` (or we fallback).

## Priority
P2 (useful workflow/tooling; not production-critical).

## Implementation Phases
### Phase 1: Documentation + template
- Add `docs/webring.md`
- Add `templates/webring-site.task.md`
- Update `README.md` with pointer to the docs/template

### Phase 2: Generator
- Add `scripts/new-webring-site-task.mjs`
- Document usage in `docs/webring.md`

### Phase 3 (optional): Importer
- Add `scripts/import-webring-members.mjs` (opt-in, dry-run supported)

## Affected Files
- `orgs/ussyverse/kanban/README.md`
- `orgs/ussyverse/kanban/docs/webring.md` (new)
- `orgs/ussyverse/kanban/templates/webring-site.task.md` (new)
- `orgs/ussyverse/kanban/scripts/new-webring-site-task.mjs` (new)

## Definition of Done
- A contributor can create a new webring site task by either:
  - copying `templates/webring-site.task.md`, or
  - running `node scripts/new-webring-site-task.mjs --subdomain ...`
- The resulting task appears under `tasks/incoming/` and syncs to Trello after merge-to-main.
