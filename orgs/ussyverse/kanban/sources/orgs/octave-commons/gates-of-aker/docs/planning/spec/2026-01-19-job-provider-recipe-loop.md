# Job Providers + Recipe Loop

## Summary
- Move job creation to structure-backed providers with per-provider caps.
- Seed 16 starting jobs (builder, improver, miner, plus harvest/smelter mix).
- Introduce ore resources + smelter recipe jobs.
- Keep job queue assignments tight to reduce unassigned backlog.

## Existing Issues / PRs
- Issue #4 "Milestone 3 — Colony Job Loop" is related to job automation scope.
- PRs: none found (`gh pr list` on 2026-01-19).

## Touchpoints (files + line hints)
- `backend/src/fantasia/sim/jobs.clj`: job generation + assignment (~6-930).
- `backend/src/fantasia/sim/tick/initial.clj`: initial world setup (~89-180).
- `backend/src/fantasia/sim/tick/core.clj`: job loop invocation (~33-59).
- `web/src/components/JobQueuePanel.tsx`: job labels/colors (~7-70).
- `web/src/components/AgentCard.tsx`: job labels (~11-25).
- `docs/notes/job-refactoring.md`: job system notes.

## Requirements
1. Structures own job provider metadata (job type, cap, recipes).
2. Providers only emit jobs up to their capacity.
3. Initial world spawns 16 jobs for 16 colonists (includes builder + improver + miner).
4. Builder job randomly selects new buildings to construct.
5. Improver job targets eligible buildings and levels them up.
6. Miner job targets rock/ore tiles (ore varieties include iron, copper, tin, gold, silver, aluminum, lead).
7. Smelter job processes ore into ingots via recipe provider.
8. Jobs are created by structures with needs/recipes, not by loose items.
9. Update docs/notes with new job provider + recipe contract.

## Definition of Done
- Job providers emit jobs with caps and reduce unassigned backlog.
- Initial world has 16 jobs on tick 0 with required mix.
- Ore resources spawn and miner/smelter jobs complete without errors.
- UI labels include new job types (builder, improver, miner, smelter).
- Tests cover provider caps + initial job count.

## Plan (Phased)

### Phase 1 — Model & Data Shapes
1. Define provider schema for structures (job type, max-jobs, recipe input/output).
2. Store provider metadata on tiles or a world registry.
3. Add job types: builder, improver, miner, smelter.

### Phase 2 — Job Generation
1. Replace/extend `auto-generate-jobs!` to emit jobs from providers.
2. Enforce per-provider caps and reduce duplicate jobs.
3. Keep existing need-based jobs (eat/sleep) separate from provider loop.

### Phase 3 — World Init + Resources
1. Seed provider structures in initial world.
2. Spawn ore variants on rock tiles; define ore resources.
3. Add starter jobs to reach 16 total jobs.

### Phase 4 — UI + Tests + Docs
1. Update job labels/colors in UI.
2. Add backend tests for provider caps + initial job count.
3. Append docs/notes with job provider/recipe contract.

## Progress Notes
- 2026-01-19: Implemented provider job generation, seeded 16 jobs, added ore spawns + smelting, updated UI labels, added provider tests.

## Change Log
- Added job provider config, builder/improve/mine/smelt jobs, and provider caps in `backend/src/fantasia/sim/jobs.clj`.
- Expanded initial world structures and seeded provider jobs in `backend/src/fantasia/sim/tick/initial.clj`.
- Added ore variants in `backend/src/fantasia/sim/biomes.clj`.
- Updated job UI labels in `web/src/components/JobQueuePanel.tsx` and `web/src/components/AgentCard.tsx`.
- Added provider tests in `backend/test/fantasia/sim/jobs_provider_test.clj`.
