# Cross-Link README Coverage For Workspace Packages

## Context
- `README.md:1-140` outlines the multi-repository workspace but does not specify dependency/dependent relationships for individual packages, so consumers cannot navigate between related modules from there.
- `package.json:1-57` shows the root workspace depends directly on both external modules (e.g., `@octokit/rest`) and internal packages such as `@promethean-os/ecosystem-dsl`, yet none of those internal relationships are documented inside their owning folders.
- `rg --files -g 'package.json'` surfaced **1,573** package manifests inside the workspace; filtering to directories that also contain a `.git` pointer (nested submodules and primary repositories) narrows the actionable set to 59 first-class packages that we can document without touching generated fixtures.

## Existing Issues / PRs
- No existing specs, issues, or PRs mention "undocumented packages" (`rg -n "undocumented packages"` returned zero matches).

## Requirements
1. Treat every directory that contains both a `package.json` and `.git` metadata as a first-class package requiring documentation.
2. Each package folder must own a `README.md` that links to its internal dependencies and dependents. If a README already exists, preserve the authored content and append the dependency matrix instead of overwriting it.
3. The dependency matrix must be bidirectional: package A links to package B in a "Dependencies" list, and package B links back to package A within a "Dependents" list so every relationship is discoverable from both sides.
4. Produce a workspace-level report under `docs/reports/` summarizing which packages lacked documentation before remediation and detailing how they were updated.
5. Provide an automated way (a script committed to `scripts/`) to recompute dependency/dependent relationships and refresh the README matrices so future packages stay compliant.

## Plan
### Phase 1 – Inventory Packages
1. Implement `scripts/package-doc-matrix.ts` that shells out to `rg --files -g 'package.json'`, filters directories containing `.git`, and builds an in-memory map `{name, path, dependencies}` for those 59 packages while skipping worktrees (`/.worktrees/`).
2. Parse each package's manifest to capture `name`, `dependencies`, `devDependencies`, and resolve which dependency entries reference another first-class package (exact `name` match) to build dependency and dependent adjacency lists.

### Phase 2 – Update README Content
1. For every package, ensure a `README.md` exists; create one with a short auto-generated summary if necessary.
2. Append (or update when markers already exist) an auto-generated block that includes `## Internal Dependencies` and `## Internal Dependents` sections, each listing Markdown links to the related package READMEs using relative paths computed from the package directory.
3. Record which packages required README creation vs. updates so the final report can highlight remediation work.

### Phase 3 – Publish Workspace Report
1. Use the data captured by the script to write `docs/reports/package-doc-matrix.md`, summarizing methodology, package counts, and providing tables of previously undocumented packages plus their new README locations.
2. Document the script usage (e.g., `bun run scripts/package-doc-matrix.ts --write`) so contributors can regenerate the matrices after dependency changes.

### Phase 4 – Validation
1. Re-run the script in "report" mode to ensure no package is missing the dependency/dependent block.
2. Spot-check a few updated READMEs to confirm relative links resolve and the bidirectional relationships were created.

## Definition of Done
- `scripts/package-doc-matrix.ts` can inventory first-class packages, update README dependency/dependent blocks, and emit a JSON/Markdown summary.
- Every directory that contains both `.git` metadata and a `package.json` now also contains a README with the auto-generated dependency matrix.
- `docs/reports/package-doc-matrix.md` explains the process, lists the package coverage status before/after, and links to the script for future enforcement.
- Unit or smoke tests for the script (invoked via `bun run`) complete successfully, or manual verification steps are documented if automation is impractical.
- `git status` shows only intentional changes (script, READMEs, report, spec updates).

## Change Log
- 2025-11-16: Added `scripts/package-doc-matrix.ts#L1-L231` to build the dependency/dependent map via ripgrep, refresh each package README with an auto-generated block, and emit `docs/reports/package-doc-matrix.md#L1-L61` summarizing coverage.
- 2025-11-16: Appended the manifest-backed dependency matrix to every first-class package README (e.g., `README.md#L467-L481` and `orgs/riatzukiza/promethean/packages/kanban/README.md#L532-L549`), creating new READMEs in packages that lacked one.
