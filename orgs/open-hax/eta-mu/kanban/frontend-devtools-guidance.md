---
uuid: "orgs-open-hax-eta-mu-kanban-orgs-open-hax-eta-mu-specs-frontend-devtools-guidance-md"
title: "Frontend DevTools Guidance Update"
status: incoming
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:29:39.347Z"
source: "orgs/open-hax/eta-mu/specs/frontend-devtools-guidance.md"
category: "specs"
---

> Source: `orgs/open-hax/eta-mu/specs/frontend-devtools-guidance.md`
> Migrated-to-kanban: `orgs/open-hax/eta-mu/kanban/frontend-devtools-guidance.md`

# Frontend DevTools Guidance Update

## Context
- Add concise Chrome DevTools best practices to the root AGENTS guide for checking frontend health during development.

## Related Files (refs)
- AGENTS.md: commands and new "Frontend status checks (Chrome DevTools)" section (lines 2-17).
- packages/opencode-reactant/DEVELOPMENT.md: dev startup commands and environment setup (lines 1-37).

## Existing Issues / PRs
- Not reviewed in this pass; none referenced.

## Definition of Done
- Root AGENTS.md documents actionable Chrome DevTools steps for assessing frontend status.
- Guidance covers console errors, WebSocket health, HTTP responses, cache/storage resets, and basic performance checks.
- No conflicting frontend instructions left unresolved in related docs.

## Requirements & Steps
1. Review existing frontend docs for overlap or conflict with new guidance.
2. Add the Chrome DevTools checklist near the run commands in AGENTS.md to keep it discoverable.
3. Ensure advice targets localhost dev workflow (ports 8700/8787, shadow-cljs hot reload expectations).
