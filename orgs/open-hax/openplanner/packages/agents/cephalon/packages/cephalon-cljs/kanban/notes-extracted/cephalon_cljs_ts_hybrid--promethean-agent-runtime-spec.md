---
title: "Devel's workflow"
status: incoming
source_note: "services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/promethean-agent-runtime-spec.md"
extracted_at: "2026-02-12T03:01:25Z"
uuid: "orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-kanban-orgs-open-hax-openplanner-packages-agents-cephalon-packages-cephalon-cljs-spec-notes-extracted-cephalon-cljs-ts-hybrid-promethean-agent-runtime-spec-md"
priority: P3
labels: ["specs", "migrated-spec"]
created_at: "2026-05-29T04:01:26.965Z"
source: "orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--promethean-agent-runtime-spec.md"
category: "specs"
---

> Source: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/spec/notes-extracted/cephalon_cljs_ts_hybrid--promethean-agent-runtime-spec.md`
> Migrated-to-kanban: `orgs/open-hax/openplanner/packages/agents/cephalon/packages/cephalon-cljs/kanban/notes-extracted/cephalon_cljs_ts_hybrid--promethean-agent-runtime-spec.md`
# Devel's workflow

## Context
- Source note: `services/cephalon-cljs/docs/notes/cephalon_cljs_ts_hybrid/promethean-agent-runtime-spec.md`
- Category: `cephalon_cljs_ts_hybrid`

## Draft Requirements
- opencode - The bootstraps, hacks we put together to get the job done when needed.
- cephalon - Always running brain loops, named agent instances with persistent personalities
- sentinel - reactive agents that trigger in response to an event, and stop their work when end conditions are met.
- olympia - benchmarker, keeps track of stats on other agents for future optimization tools, generates benchmark reports for human analysis
- eidolon - A semantic agent system floating agent, traverses the nooi, binding to and modifying Nexus (represents a resource on the knowledge graph, and it's location in the nooi see [promethean/docs/design/overview.md])
- `tags` is a list of strings that obsidian treats the same as #tags
- `description` is a summary of the document
- `title` A natural language title that clearly describes the document
- `slug` A string to in file names, urls, database entries, etc

## Summary Snippets
- A running instance of [[promethean]], with debugging enbabled
- - opencode - The bootstraps, hacks we put together to get the job done when needed. - cephalon - Always running brain loops, named agent instances with persistent personalities - sentinel - reactive agents that trigger in response to an event, and stop their work when end conditions are met. - olympia - benchmarker, keeps track of stats on other agents for future optimization tools, generates benchmark reports for human analysis - eidolon - A semantic agent system floating agent, traverses the nooi, binding to and modifying Nexus (represents a resource on the knowledge graph, and it's location in the nooi see [promethean/docs/design/overview.md])

## Open Questions
- What should be implemented first from this note?
- Which parts are exploratory versus actionable?
