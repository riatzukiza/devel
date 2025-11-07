# NSS Task 4 — Auth Config and Documentation Alignment

## Objective
Make authentication strategies configurable while reconciling documentation promises with implemented features.

## Acceptance Criteria
- Environment variable names for HTTPS and GitHub App auth are configurable via manifest or CLI flags.
- Manifest schema and docs reflect actual support for hooks, sparse checkout, and metadata fields.
- Documentation gaps identified in review are resolved or flagged with TODOs for future phases.
- Configuration changes include migration guidance for existing manifests.

## Suggested Steps
1. Introduce schema support for optional auth configuration overrides.
2. Update `manifest-init` inference logic to respect user-provided defaults.
3. Align `docs/agile/reports/` content with current capabilities; note deferred features explicitly.
4. Provide changelog entry detailing configuration adjustments.

## Dependencies
- Relies on core schema definitions (`src/nss/schema.ts`).
- Coordination with CLI UX task to surface new flags/help messaging.
