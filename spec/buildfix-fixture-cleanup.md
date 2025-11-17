# Retire Legacy BuildFix Fixture Drops

## Context
- `orgs/riatzukiza/promethean/packages/pipelines/buildfix/README.md:247-301` documents the **repo fixture generator** and benchmark commands that rebuild realistic fixtures on demand (`repo-fixture-generator.ts`, `run-repo-fixtures.ts`).
- `orgs/riatzukiza/promethean/packages/pipelines/buildfix/README.md:359-377` explains the **massive fixture generator** CLI that creates the large-scale datasets ("Generate large-scale test fixtures (1000+ errors)"), confirming the artifacts inside `massive-fixture-generation-2/` can be safely regenerated.
- Local inspection shows >600 directories of frozen fixtures under `orgs/riatzukiza/promethean/packages/pipelines/buildfix/` (e.g., `massive-fixture-generation-2/fixture-XXXX-*.{ts,metadata.json}`, `repo-fixtures/repo-file-*`, `simple-benchmark-temp/fixtures/*`, `large-benchmark-temp/fixtures/*`, and `repo-benchmark-temp/fixtures/*`). These consume ~5.5 MB (`python` count) and clutter diffs even though the README instructs contributors to regenerate them rather than versioning the outputs.

## Existing Issues / PRs
- No open issues/PRs reference "buildfix fixture" cleanup (`rg -n "buildfix" spec docs` had no relevant tracking items).

## Requirements
1. Remove the stale fixture directories listed below while keeping generator scripts and metadata intact:
   - `packages/pipelines/buildfix/massive-fixture-generation-2/`
   - `packages/pipelines/buildfix/repo-fixtures/`
   - `packages/pipelines/buildfix/repo-benchmark-temp/`
   - `packages/pipelines/buildfix/large-benchmark-temp/`
   - `packages/pipelines/buildfix/simple-benchmark-temp/`
2. Preserve `.gitkeep` or `.projectile` markers that other tooling requires at higher-level directories (only delete them if they exist exclusively inside the fixture folders).
3. Ensure `buildfix/README.md` still references the generator commands so future developers know how to rebuild fixtures locally; no doc edits required beyond verifying instructions remain accurate.
4. Verify `git status` only shows the expected deletions plus updated `.gitmodules` pointers (if any) inside the Promethean submodule; avoid touching unrelated work.

## Plan
### Phase 1 – Inventory & Safety Net
1. Capture directory counts + sizes for each fixture family (`python` helper) to document what was deleted.
2. Confirm there are no checked-in references (imports/paths) expecting these exact fixture directories; search for `repo-fixtures`, `massive-fixture-generation-2`, etc.

### Phase 2 – Delete Fixture Trees
1. Use `rm -rf` (after verifying parent path) or `python` to remove each obsolete folder listed above inside the Promethean submodule.
2. If a directory is required for structure (e.g., `repo-fixtures/.projectile`), replace it with a `.gitkeep` plus README stub describing how to regenerate fixtures, or rely on generator directories being recreated on demand.

### Phase 3 – Verification
1. Re-run targeted searches to ensure no lingering fixture path references remain unresolved.
2. `git status` inside `orgs/riatzukiza/promethean` should show only deletions under `packages/pipelines/buildfix/`. Document the cleanup in this spec once the subproject commits are ready.

## Definition of Done
- All legacy fixture directories under `packages/pipelines/buildfix/` are removed without disturbing source code or generator scripts.
- README instructions at `orgs/riatzukiza/promethean/packages/pipelines/buildfix/README.md:247-377` still describe how to regenerate fixtures, and no additional edits are required.
- `git status` reflects only the intended deletions (plus any necessary `.gitkeep` additions).
- This spec is updated with final notes if scope changes during implementation.

## Change Log
- 2025-11-16: Removed `massive-fixture-generation-2/`, `massive-repo-fixtures/`, `repo-fixtures/`, `repo-benchmark-temp/`, `large-benchmark-temp/`, and `simple-benchmark-temp/` fixture payloads under `packages/pipelines/buildfix/`, replacing them with README placeholders that reference the generator commands documented in the BuildFix README.
