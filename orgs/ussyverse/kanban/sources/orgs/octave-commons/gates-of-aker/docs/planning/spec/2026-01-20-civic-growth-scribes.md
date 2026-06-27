# Civic Growth + Scribes

## Summary
Enable colony growth by adding house construction to provider job loop, introduce civic buildings (temple, school, library), add passive mood buffs from pleasant environments, and create a scribe job loop that writes traces to seed world lore.

## Context
- Players report no new houses or buildings are being created after initial spawn.
- Desired progression: children -> school -> scribes -> library; temple for faith.
- Passive mood gains should come from pleasant environments without explicit actions.
- Traces + scribes should start generating myth/lore content.

## Current State (Code Touchpoints)
- Builder jobs only place `jobs/build-structure-options` and do not include houses (`backend/src/fantasia/sim/jobs.clj`, lines ~66-83).
- Provider job generation is only building loop (`backend/src/fantasia/sim/jobs/providers.clj`, lines ~224-245).
- Legacy house job generator exists but is unused (`backend/src/fantasia/sim/jobs.clj`, lines ~1091-1114).
- Mood changes are driven by warmth/social/rest only (`backend/src/fantasia/sim/agents.clj`, lines ~58-99).
- Structures are rendered in canvas with explicit cases (`web/src/components/SimulationCanvas.tsx`, lines ~312-410).
- Traces/cultures are defined, but no scribe job loop exists (`backend/src/fantasia/sim/traces.clj`, lines ~6-140).
- Embeddings use stub/fallback; no direct Ollama text generation integration yet.

## Requirements
1. Add house construction into active provider-based build loop.
2. Introduce new civic structures (temple, school, library) with build support and render/UI labels.
3. Implement passive mood buffs from pleasant environments (e.g., proximity to civic buildings, trees, houses, shrine).
4. Add library structure to build options and job-provider-config.
5. Add a scribe job type + provider tied to library (job-type :job/scribe, max-jobs 1-2).
6. Implement Ollama client for text generation (clj-http calls to localhost:11434).
7. Scribe job periodically creates a "book" record based on traces + facets.
8. Prompt Ollama with traces + facets to generate mythologized short stories.
9. Store books in world state with references to source traces/facets; library serves as container.
10. Leverage existing Ollama integration for embeddings (enhancing facet similarity).
11. Update `docs/notes` with a concise change entry for new mood + lore mechanics.

## Open Questions
- Passive mood buff magnitude/thresholds for pleasant environment proximity.

## Existing Issues / PRs
- Issues: none directly tied to colony building or scribes (checked `gh issue list` on 2026-01-20).
- PRs: none open (checked `gh pr list` on 2026-01-20).

## Plan
### Phase 1 — Builder + House Loop
1. Extend `jobs/build-structure-options` to include `:house` and new civic structures.
2. Ensure builder jobs place houses and update tiles/stockpiles as needed.
3. Add or repurpose build requirements for houses and civic buildings.

### Phase 2 — Passive Mood Buffs
1. Add environment sampling in `fantasia.sim.agents/update-needs` using nearby tiles.
2. Add constants for mood bonuses per structure/facet (house, temple, school, library, trees).
3. Include mood feedback text when buffs apply.

### Phase 3 — Scribe + Book Loop (Ollama + Meta-Myths Integration)
1. Add library structure to build options and job-provider-config.
2. Add a scribe job type + provider tied to library (job-type :job/scribe, max-jobs 1-2).
3. Implement Ollama client for text generation (clj-http calls to localhost:11434) with qwen3:4b model.
4. Scribe job periodically creates a "book" record based on traces + facets.
5. Prompt Ollama with traces + facets + ancient myths for context to generate mythologized short stories.
6. Store books in world state with references to source traces/facets.
7. Save every generated book to `myths.jsonl` file for persistent meta-myths across world restarts.
8. Load up to 5 random ancient myths from previous worlds to seed Ollama prompts.
9. Library UI exposes book contents to player for reading world lore.
10. Async generation ensures tick loop never blocks on Ollama calls.
7. Library UI exposes book contents to player for reading world lore.

### Phase 4 — UI + Docs
1. Render new structures in `SimulationCanvas.tsx` and update palette/labels as needed.
2. Add library UI panel showing books list and book content on selection.
3. Add notes in `/docs/notes` describing passive mood + trace generation behavior.
4. Add/adjust tests for new jobs and mood effects if harness exists.

## Definition of Done
- Houses and civic buildings appear via builder jobs during play.
- Agents receive passive mood buffs when near pleasant structures/terrain.
- Scribe job creates books via Ollama and stores them in library data.
- UI shows new structures and library books can be read.
- Documentation notes describe new mechanics.
- Deities system created with 4 example gods (Apollo, Artemis, Gaia, Hermes) in .myth/dieties/
- Each deity has: facets, resources, powers with costs, cooldowns, consequences, lore
- Powers include: damage, mood, knowledge, summon, environment with effects
- Balance system: favor-cost multipliers, corruption per use, max followers
- Front matter: name, title for UI display
- .myth/dieties/README.md - documentation for deity system
- Deity files: Apollo.md, Artemis.md, Gaia.md, Hermes.md (one deity per file)
