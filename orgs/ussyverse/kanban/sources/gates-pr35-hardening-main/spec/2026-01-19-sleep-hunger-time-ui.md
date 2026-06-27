# Sleep, Hunger, and Time Visibility

## Summary
- Reduce hunger decay overall and slow it further during sleep.
- Encourage sleep jobs after sundown.
- Surface time-of-day, day, season, year, temperature, and daylight in the UI.

## Existing Issues / PRs
- Issues: none found.
- PRs: none found.

## Touchpoints (files + line hints)
- `backend/src/fantasia/sim/agents.clj`: update-needs decay tuning (~7-33).
- `backend/src/fantasia/sim/jobs.clj`: sleep job generation + asleep status (~84-670).
- `backend/src/fantasia/sim/time.clj`: calendar helpers (new file).
- `backend/src/fantasia/sim/tick/core.clj`: time-based temperature/daylight + calendar updates (~52-60).
- `backend/src/fantasia/sim/tick/initial.clj`: seed calendar on boot (~88-135).
- `backend/src/fantasia/sim/world.clj`: include calendar in snapshots (~8-20).
- `web/src/components/WorldInfoPanel.tsx`: new world clock panel.
- `web/src/App.tsx`: render calendar data in sidebar.
- Tests: `backend/test/fantasia/sim/agents_test.clj`, `backend/test/fantasia/sim/jobs_lifecycle_test.clj`, `backend/test/fantasia/sim/world_test.clj`.

## Requirements
1. Food decays slower per tick; asleep agents consume even less.
2. Sleep need does not decay while asleep; sleep jobs clear asleep status on completion.
3. Nightfall (low daylight) increases the chance of sleep jobs.
4. Backend emits calendar info (time-of-day, day, season, year, temperature, daylight, cold-snap).
5. Frontend displays the calendar and temperature/lighting values prominently.

## Definition of Done
- Hunger decay reduced and validated in unit tests.
- Sleep jobs triggered at night and asleep status applied/cleared correctly.
- `/sim/state` and tick snapshots include calendar data.
- UI shows time-of-day, day, season, year, temperature, daylight, cold snap.
- Tests pass for updated backend coverage.
