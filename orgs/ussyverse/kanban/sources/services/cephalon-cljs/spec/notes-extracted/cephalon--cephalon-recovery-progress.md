---
title: "Best: zip the on-disk project storage (fast + complete)"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-recovery-progress.md"
extracted_at: "2026-02-12T03:01:25Z"
---

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
