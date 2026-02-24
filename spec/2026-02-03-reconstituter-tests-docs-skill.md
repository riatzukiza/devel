---
uuid: "f797f19c-f6b1-4bbd-9586-33c7f0f0f26e"
title: "Reconstituter Tests, Docs, and Skill"
slug: "2026-02-03-reconstituter-tests-docs-skill"
status: "accepted"
priority: "P2"
labels: ["skill", "reconstituter", "tests", "docs"]
created_at: "2026-02-03T20:46:53.633826Z"
estimates:
  complexity: ""
  scale: ""
  time_to_completion: ""
---

# Reconstituter Tests, Docs, and Skill

## Context
- `packages/reconstituter` contains the OpenCode session index/search CLI and the reconstitute runner.
- The package needs stronger test coverage, package-level documentation, and a skill entry for the CLI.
- Agent guidance should mention the new skill for discoverability.

## Requirements
- Add tests for reconstitute CLI helper behavior (path normalization, tool-call formatting, replay conversion).
- Add package documentation describing the CLI, environment variables, and exports.
- Create a new OpenCode skill for the reconstitute CLI under `.opencode/skills/`.
- Update AGENTS guidance to reference the new skill.

## Plan
Phase 1: Capture existing behavior and identify testable helpers.
Phase 2: Add tests and documentation.
Phase 3: Add the skill entry and update AGENTS guidance.
Phase 4: Verify diagnostics and tests.

## Files (targets + references)
- `packages/reconstituter/src/reconstitute.ts:1`
- `packages/reconstituter/src/opencode-sessions.ts:1`
- `packages/reconstituter/src/opencode-sessions.test.ts:1`
- `packages/reconstituter/README.md:1`
- `.opencode/skills/opencode-reconstituter/SKILL.md:1`
- `AGENTS.md:1`

## Existing Issues / PRs
- None referenced.

## Definition of Done
- Reconstituter helper logic has test coverage in AVA.
- `packages/reconstituter/README.md` documents CLI usage and environment variables.
- Skill entry exists for the reconstitute CLI and is referenced in `AGENTS.md`.
- Diagnostics are clean on modified files and tests pass (or failures documented).

## Changelog
- 2026-02-03: (pending) Add tests, docs, and skill for reconstituter.
