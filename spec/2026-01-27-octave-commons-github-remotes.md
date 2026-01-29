# Octave Commons GitHub remotes

## Summary
- Add GitHub remotes for three local repos under `orgs/octave-commons/`.

## Requirements
- Ensure each repo has a GitHub remote pointing to `octave-commons/<repo>.git`.
- Preserve any existing remotes.

## Plan
### Phase 1
- Inspect current git remotes for the three repos.
- Check for existing issues/PRs (if accessible).

### Phase 2
- Add missing GitHub remotes.

### Phase 3
- Verify remotes after changes.

## Definition of done
- `git remote -v` shows a GitHub remote for all three repos.
- No unrelated files modified.

## Existing issues/PRs
- `gh issue list` and `gh pr list` returned repository not found errors for all three repos.

## Code references
- No code changes required (remote configuration only).
