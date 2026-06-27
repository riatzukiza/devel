---
title: "Why your earlier approach failed (and what this avoids)"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-promethean-packages.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# Why your earlier approach failed (and what this avoids)

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/cephalon-hybrid-promethean-packages.md`
- Category: `cephalon`

## Draft Requirements
- **MVP output:** a dump file containing **every message-like blob** found in OpenCode local storage whose text contains `cephalon-clj`
- **Ideal-ish output:** creates `.reconstituted/cephalon-clj/` with:
- `dump.ndjson` (machine-friendly)
- `dump.md` (human/Obsidian-friendly)
- `files/**.md` (one markdown per extracted file path, populated with evidence excerpts)
- a running OpenCode server / API layer,
- a CLI that might mix logs into stdout,
- schema drift.
- A corpus you can feed into anything (`dump.ndjson`)
- A readable Obsidian note (`dump.md`)
- A `.reconstituted/cephalon-clj/files/` tree where each file-doc is essentially:
- **“here are all the receipts we saw about this file”**

## Summary Snippets
- Yeah — this is a **real** problem class, and “reconstitution” is exactly the right framing: treat agent sessions as the **ground-truth audit log**, then regenerate *artifacts* (docs, code, patches) from that log with increasingly powerful passes.
- The key is to split it into **deterministic plumbing** (safe, boring, reliable) and **optional LLM enrichment** (powerful, risky, sandboxed).

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
