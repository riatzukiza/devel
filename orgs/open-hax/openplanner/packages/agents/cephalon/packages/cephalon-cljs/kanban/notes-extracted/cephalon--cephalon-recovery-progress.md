---
title: "Best: zip the on-disk project storage (fast + complete)"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-recovery-progress.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cephalon-recovery-progress-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.941Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-recovery-progress.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon--cephalon-recovery-progress.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon--cephalon-recovery-progress.md`
# Best: zip the on-disk project storage (fast + complete)

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-recovery-progress.md`
- Category: `cephalon`

## Draft Requirements
- `opencode export [sessionID]` ([OpenCode][4])
- `opencode import <file>` ([OpenCode][4])
- **Backup / migration / “give me everything”** → zip `storage/{session,message,part}/$PROJECT_ID` (first script).
- **Shareable / clean imports** → batch `opencode export` and zip the results (second script). ([OpenCode][4])

## Summary Snippets
- OpenCode keeps session/message data as JSON under your data dir (typically `~/.local/share/opencode/storage/`). ([forums.basehub.com][1]) Sessions are stored project-scoped as `storage/session/{projectID}/{sessionID}.json`. For git repos, `projectID` is the **root commit hash**; for non-git dirs it’s `"global"`. ([GitHub][2]) Alongside `session/`, OpenCode also stores the per-session message/part JSON in sibling folders (commonly `message/` and `part/`). ([npm][3])
- So the simplest “full zip for the current repo” is: compute `projectID`, then zip the project’s subfolders.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
