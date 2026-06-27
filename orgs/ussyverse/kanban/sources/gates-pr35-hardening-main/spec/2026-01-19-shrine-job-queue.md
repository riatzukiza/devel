# Shrine Default + Job Queue Insight

## Summary
- Spawn the shrine with the initial campfire town center.
- Make the job queue more descriptive and split assigned vs. unassigned jobs for debugging.

## Existing Issues / PRs
- Issues: none found.
- PRs: none found.

## Touchpoints (files + line hints)
- `backend/src/fantasia/sim/tick/initial.clj`: default shrine placement (~139-146).
- `web/src/components/JobQueuePanel.tsx`: richer job detail + split sections (~7-140).

## Requirements
1. Initial world has `:shrine` set to the campfire position.
2. Job queue shows assigned jobs separately from unassigned jobs.
3. Job queue displays target/from/to positions, resource, qty, stage, structure, and state when present.

## Definition of Done
- Shrine appears in fresh worlds at the town center.
- Job queue provides clear assigned/unassigned sections with metadata.
