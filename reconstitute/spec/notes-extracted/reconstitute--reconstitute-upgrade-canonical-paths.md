---
title: "Upgrade pass: canonical paths + notes-augmented context + deterministic session ordering"
status: incoming
source_note: "reconstitute/docs/notes/reconstitute/reconstitute-upgrade-canonical-paths.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Upgrade pass: canonical paths + notes-augmented context + deterministic session ordering

## Context
- Source note: `reconstitute/docs/notes/reconstitute/reconstitute-upgrade-canonical-paths.md`
- Category: `reconstitute`

## Draft Requirements
- **Better path canonicalization**
- cleans punctuation/quotes
- resolves `./src/foo` and `src/foo` → `<root>/src/foo`
- maps `repoName/...` → `<root>/...`
- strips trailing `/` (except for the root)
- **Notes-driven augmentation**
- every Q/A call prepends a **notes context snippet** (top semantic note hits) as a `system` message
- so the agent can use what it already learned without having to re-derive it
- **Deterministic context builder**
- uses `sess:<id>:order` from LevelDB for window expansion
- sorts merged context chunks by **created_at** (stored in LevelDB at index time), falling back safely
- `NOTES_THRESHOLD` is a distance cutoff (smaller is better). Leave blank to include top-N regardless.

## Summary Snippets
- This version implements the 3 upgrades we queued:
- 1. **Better path canonicalization**

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
