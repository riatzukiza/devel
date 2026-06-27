# Tree + Fruit Growth Tuning

## Summary
- Tune tree spread and fruit drop rates to reduce ground fruit load.
- Increase initial tree population with clustered, growth-like placement.

## Context
- User request: reduce forest growth and fruit drop frequency; increase initial trees with a pattern similar to organic growth.

## Relevant Files
- `backend/src/fantasia/sim/tick/trees.clj` (spawn-initial-trees! around lines 45-68, spread-trees! around lines 110-125, should-drop-fruit? around lines 128-138, perform-drop around lines 140-153).
- `backend/src/fantasia/sim/tick/initial.clj` (scatter-fruit! around lines 101-111, initial-world tree-density default around lines 113-116).

## Issues / PRs
- Issues checked: `gh issue list --limit 20` (none specific).
- PRs checked: `gh pr list --limit 20` (none open).

## Requirements
- Reduce tree spread frequency and overall probability.
- Reduce fruit drop frequency per tree.
- Increase initial tree count.
- Initial tree placement should resemble organic spread, not uniform random scatter.
- Document behavior change in `docs/notes`.

## Plan
### Phase 1 - Investigation
- Inspect tree spread and fruit drop logic in `backend/src/fantasia/sim/tick/trees.clj`.
- Inspect initial world tree/fruit setup in `backend/src/fantasia/sim/tick/initial.clj`.

### Phase 2 - Implementation
- Adjust tree spread intervals/probability.
- Adjust fruit drop intervals and scheduling.
- Update initial tree seeding to grow clusters and increase total count.
- Reduce initial fruit scatter if needed to limit ground fruit load.

### Phase 3 - Documentation
- Add a note in `docs/notes` describing the tuning.

## Definition of Done
- Initial tree count is higher and clustered.
- Tree spread and fruit drops occur less often.
- Ground fruit volume reduced during initialization.
- Notes added to `docs/notes`.

## Change Log
- 2026-01-20: Spec created.
- 2026-01-20: Updated tree seeding to grow clusters, slowed spread/fruit drops, reduced initial fruit scatter, bumped default tree density, and added notes.
