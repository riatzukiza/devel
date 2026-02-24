---
title: "A working MVP program (no jq, no opencode export, no chroma)"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitution-skills-expanded.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# A working MVP program (no jq, no opencode export, no chroma)

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitution-skills-expanded.md`
- Category: `reconstitute`

## Draft Requirements
- `~/.local/share/opencode/storage/…` — session metadata, messages, parts, session diffs, etc
- `~/.local/share/opencode/tool-output/…` — tool outputs (often diffs / file lists / logs)
- `~/.local/share/opencode/snapshot/<id>/…` — **bare git repos** (this is the “oh wow” one; you can often recover *actual source* here with `git archive`)
- **Snapshot-first restore** (if possible): extract matching snapshots → you might get your lost guard-rails code back *verbatim*.
- **Evidence dump**: scan `storage/**` + `tool-output/**` for `cephalon-clj` and write an NDJSON + Obsidian-friendly markdown.
- **Per-file dossiers**: infer file paths from evidence and write a markdown doc per file under `.reconstituted/cephalon-clj/files/…`.
- (Optional) **LLM phase**: feed those dossiers to a coding agent to regenerate missing files.
- [recover-offline.mjs](sandbox:/mnt/data/recover-offline.mjs)
- [recover-offline.zip](sandbox:/mnt/data/recover-offline.zip)
- `dump.ndjson` — one record per matched blob (easy to post-process)
- `dump.md` — readable evidence dump (good in Obsidian)
- `files/_index.md` — index of inferred file paths

## Summary Snippets
- From your screenshots, your local OpenCode data dir has **three goldmines**:
- * `~/.local/share/opencode/storage/…` — session metadata, messages, parts, session diffs, etc * `~/.local/share/opencode/tool-output/…` — tool outputs (often diffs / file lists / logs) * `~/.local/share/opencode/snapshot/<id>/…` — **bare git repos** (this is the “oh wow” one; you can often recover *actual source* here with `git archive`)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
