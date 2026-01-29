# Skill: Workspace Navigation

## Goal
Locate the right repo, file, and pattern quickly in a multi-repo workspace.

## Use This Skill When
- The request spans multiple modules or unknown locations.
- You need to identify "where" a feature or workflow lives.
- You must confirm patterns before editing.

## Do Not Use This Skill When
- The file path is already explicit and verified.
- The task is a single, known file edit.

## Inputs
- The user's target feature or workflow description.
- Any hints in `AGENTS.md` about repository structure.

## Steps
1. Locate the most likely repo under `orgs/**` or `src/`.
2. Identify 1-2 reference files that match the requested pattern.
3. Confirm the expected edit location before changing anything.

## Strong Hints
- Prefer narrow searches first; widen only if needed.
- Use existing patterns as templates, not guesses.
- If patterns conflict, surface the ambiguity before editing.

## Output
- The file paths used as references and the planned edit location.
