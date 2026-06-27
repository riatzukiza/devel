---
title: "Concrete specs: normalize + near-dupe + schemas + compaction policy + scheduler #cephalon #mvp"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-concrete-specs.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-cephalon-concrete-specs-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.911Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-concrete-specs.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-concrete-specs.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--cephalon-concrete-specs.md`
# Concrete specs: normalize + near-dupe + schemas + compaction policy + scheduler #cephalon #mvp

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/cephalon-concrete-specs.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- `event`: `{guild_id, channel_id, message_id, author_id, author_is_bot, content, embeds[], attachments[]}`
- `policy`: normalization + dedupe settings (per guild/channel optional overrides)
- `normalized_text` (string)
- `signature` (object used for exact-dupe key)
- `features` (object used for near-dupe + classification)
- `text = unicode_nfkc(content)`
- `text = text.replace("\r\n", "\n")`
- collapse runs of spaces/tabs: `text = text.replace(/[ \t]+/g, " ")`
- trim each line + drop empty tail lines
- global trim
- ISO-ish timestamps:
- `/\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?\b/g` → `<ts>`

## Summary Snippets
- * `event`: `{guild_id, channel_id, message_id, author_id, author_is_bot, content, embeds[], attachments[]}` * `policy`: normalization + dedupe settings (per guild/channel optional overrides)
- * `normalized_text` (string) * `signature` (object used for exact-dupe key) * `features` (object used for near-dupe + classification)

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
