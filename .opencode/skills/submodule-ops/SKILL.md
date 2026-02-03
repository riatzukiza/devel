---
name: submodule-ops
description: "Make safe, consistent changes in a workspace with many git submodules under orgs/**"
---

# Skill: Submodule Operations

## Goal
Make safe, consistent changes in a workspace with many git submodules.

## Use This Skill When
- You touch files under `orgs/**` or `.gitmodules`.
- You need to run `submodule` commands or update submodule pointers.
- You are asked to change code in multiple submodules.

## Do Not Use This Skill When
- The change is confined to the root workspace only.
- You are only editing documentation in `docs/`.

## Inputs
- The target submodule path(s).
- Any required submodule commands from `AGENTS.md`.

## Steps
1. Identify the exact submodule(s) impacted.
2. Work inside the submodule path; avoid cross-submodule edits.
3. Note any required sync/update steps before finishing.
4. Mention follow-up commands for the user if needed.

## Strong Hints
- Avoid touching submodules you do not need.
- Keep edits localized to the intended repo.
- If a change spans multiple submodules, sequence the work and call it out.

## Output
- Clear list of modified submodule paths and any follow-up commands.
