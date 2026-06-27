# Frontend DevTools Guidance Update

## Context
- Add concise Chrome DevTools best practices to the root AGENTS guide for checking frontend health during development.

## Related Files (refs)
- AGENTS.md: commands and new "Frontend status checks (Chrome DevTools)" section (lines 2-17).
- packages/opencode-reactant/DEVELOPMENT.md: dev startup commands and environment setup (lines 1-37).

## Existing Issues / PRs
- Not reviewed in this pass; none referenced.

## Definition of Done
- Root AGENTS.md documents actionable Chrome DevTools steps for assessing frontend status.
- Guidance covers console errors, WebSocket health, HTTP responses, cache/storage resets, and basic performance checks.
- No conflicting frontend instructions left unresolved in related docs.

## Requirements & Steps
1. Review existing frontend docs for overlap or conflict with new guidance.
2. Add the Chrome DevTools checklist near the run commands in AGENTS.md to keep it discoverable.
3. Ensure advice targets localhost dev workflow (ports 8700/8787, shadow-cljs hot reload expectations).
