# Spec: Multi-Deity Narrative Engine Tasks

## Source Inputs
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:1` (Fantasia core description and facet-based world model)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:406` (naming + day/night + triad framing)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:706` (prestige retirement loop + Herald/Sun/Moon roles)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:1406` (causal event candidates + Adversity ledger)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:1618` (multi-deity competition, belief layer, move collisions)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:1821` (deity move set with phase-locked abilities and supporting decks)
- `docs/chats/2026-01-13_16-03-38_ChatGPT_A model that matches what you liked in RimWorld, without the....md:2153` (card formatting + resolution pipelines)

## Related Issues / PRs
- None referenced in the conversation or repo issue tracker yet.

## Definition of Done
1. Key initiatives from the chat are decomposed into repo-friendly tasks with clear scope and owners-to-be.
2. Tasks live under `docs/tasks/` and each file contains required frontmatter (`title`, `priority`, `storyPoints`, `tags`, `status`).
3. Task descriptions reference the originating chat insights so future contributors can trace intent.
4. Planning artifacts (this spec + tasks) enable implementation work without rereading the full chat log.

## Requirements & Notes
- Preserve mythology-agnostic framing (roles instead of named pantheons) per chat guidance (lines 612-708).
- Model prestige/retirement loop with Herald/Sun/Moon token split (lines 1170-1260) and champion lifecycle hooks (lines 1318-1364).
- Event system must remain causal: use candidate lists, Adversity ledger, and belief layer when defining work items (lines 1600-1900).
- Deity move deck requires day/night gating, resource costs, telegraphs, and collision handling (lines 1818-2595).
- Implementation should approach RimWorld pacing goals while eliminating “random/samey” feel via agency-driven events (lines 1406-1596).
