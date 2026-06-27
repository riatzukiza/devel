---
title: Musical Simulation Audio
type: spec
component: frontend
priority: low
status: implemented
workflow-state: done
related-issues: []
estimated-effort: 12 hours
updated_at: 2026-02-10
---

# Musical Simulation Audio

## Summary
- Add tone sequences for every job completion and need threshold crossing.
- Make hunting/combat audible with distinct motifs.

## Context
- User request: distinct sounds for hunting, each job, and each need; use tone sequences so the sim feels musical.

## Relevant Files
- `web/src/audio.ts` (tone generation and mute controls).
- `web/src/App.tsx` (tick handling, snapshot diffs).
- `web/src/components/JobQueuePanel.tsx` (job labels/colors).
- `web/src/components/AgentCard.tsx` (job labels).
- `web/src/types/index.ts` (agent shape).

## Issues / PRs
- No related issues found via `gh issue list --limit 20`.

## Requirements
- Distinct tone sequences for all job types.
- Distinct tone sequences for all needs (food, water, rest, sleep, warmth, health, security, mood).
- Hunting/combat gets its own motif.
- Use existing tone synthesis (no external assets).
- Note behavior change in `docs/notes`.

## Plan
### Phase 1 - Investigation
- Review `web/src/audio.ts` and tick handling in `web/src/App.tsx`.

### Phase 2 - Implementation
- Add tone sequence helper in `web/src/audio.ts`.
- Detect job completion + need threshold crossings in `web/src/App.tsx`.
- Map each job/need to a distinct tone sequence.
- Update job labels for hunt jobs in UI components.

### Phase 3 - Documentation
- Add note entry describing the musical cues.

## Definition of Done
- Job completion triggers distinct tone sequences for each job.
- Needs crossing thresholds trigger distinct tone sequences.
- Hunting/combat plays a dedicated motif.
- Notes updated.

## Change Log
- 2026-01-20: Spec created.
- 2026-01-20: Added tone sequences for jobs/needs and wired tick diff audio hooks.

## Closure Notes (2026-02-10)

- Closed as `done` with `status: implemented`.
- Core musical cue behavior was delivered and documented; this spec remains as a completed implementation record.
