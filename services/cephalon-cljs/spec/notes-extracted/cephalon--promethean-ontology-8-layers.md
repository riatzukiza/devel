---
title: "0) What’s already here to anchor to"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon/promethean-ontology-8-layers.md"
extracted_at: "2026-02-12T03:01:25Z"
---

# 0) What’s already here to anchor to

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon/promethean-ontology-8-layers.md`
- Category: `cephalon`

## Draft Requirements
- **Unique doc filenames & inboxes** are already configured in `.dir-locals.el` (`prom/unique-doc-format`, targets for `docs/inbox`, `docs/unique`). Use this to create stable, linkable slugs for canonical docs.
- **Agents/structures/indexes/profiles** are declared in `pseudo/pil.hy` (e.g., `Cephalon`, `Eidolon`, `Pandora`, `Eris`, `repo-embeddings`)—that’s your ontology.
- **Plugins** (including `EventCapturePlugin`, `AsyncSubAgentsPlugin`) are enumerated and described in `hack/index.ts`—perfect to auto‑generate plugin pages from.
- **Data intake precedent** (audio → transcripts) references `docs/maintenance/orphaned-files.md`—use that “maintenance” area as a home for housekeeping playbooks.
- `pseudo/pil.hy` already names the system’s **kinds** (structures, agents, indexes, profiles). The **atlas** page can mirror those headings verbatim so every entity in `pil.hy` has a doc anchor you can link to.
- `hack/index.ts` already describes plugins with names and one‑line descriptions—**generate** a page per plugin from this file (see §3).
- `.dir-locals.el` ensures new notes land in the right inbox with timestamped filenames—link **out of** `docs/README.md` and **into** curated canonical docs to drain the inbox over time.
- **Architecture** → [docs/atlas/architecture.md](atlas/architecture.md)
- **Memory System (Spec)** → [docs/specs/memory.md](specs/memory.md)
- **Context Compilation** → [docs/specs/context-compilation.md](specs/context-compilation.md)
- **Glossary** → [docs/concepts/glossary.md](concepts/glossary.md)
- **Plugins** → [docs/plugins/](plugins/)

## Summary Snippets
- Absolutely—most of what you need is already in Promethean. Let’s **connect the plans** you’ve scattered across `pseudo/`, `hack/`, and `docs/` into one coherent map, and give you **drop‑in pages + tiny automations** so the docs folder becomes the source of truth for the memory system, agents, and plugins.
- Below is a concrete **weaving plan** with ready‑to‑paste file skeletons and minimal scripts. I reference your repo where relevant so you can see why each link exists.

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
