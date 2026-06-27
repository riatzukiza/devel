---
uuid: 8e162a1d-3821-4f05-b490-21e5b818812a
title: "Rebrand `openhax/codex` Package and Documentation"
slug: openhax-codex-rebrand
status: incoming
priority: P2
tags: []
created_at: "2026-02-03T06:36:00.409448Z"
estimates:
  complexity: ''
  scale: ''
  time_to_completion: ''
storyPoints: null
---
# Rebrand `openhax/codex` Package and Documentation

## Background & References
- `orgs/open-hax/codex/package.json:1-69` previously used the legacy npm scope and pointed to the prior GitHub repo; all metadata must reflect the `openhax/codex` identity.
- `orgs/open-hax/codex/README.md:3-759`, `docs/index.md:5-139`, `docs/getting-started.md:38-317`, `docs/configuration.md:10-328`, and other docs/screens referenced the legacy org for badges, npm links, and GitHub Pages; each needs to reference `open-hax` branding exclusively.
- Config files (`config/full-opencode.json:4`, `config/minimal-opencode.json:3`), TypeScript sources (`index.ts:22-63`), HTML assets (`lib/oauth-success.html:551`), scripts (`scripts/test-all-models.sh:135`), and metadata files (`CONTRIBUTING.md:3`, `CROSS_REFERENCES.md:111`, `bun.lock:5`) must drop any legacy naming or URLs.
- Branding callouts in `README.md:10` and `docs/index.md:9` should highlight the new owner rather than the previous fork.

## Existing Issues / PRs
- None located relating to the rebrand or package rename after searching the repo for `openhax` and `codex` references outside the new directory.

## Definition of Done
1. `package.json` renamed to `openhax/codex`, version reset to `0.0.0`, and repository/bugs/homepage fields point to `https://github.com/open-hax/codex`.
2. Generated lockfiles (`package-lock.json`, `bun.lock`, `pnpm-lock.yaml` if present) reflect the new package metadata / version.
3. Source files, configs, docs, scripts, and HTML assets no longer reference the legacy npm scope or GitHub repo (except within historical changelog entries if absolutely required).
4. Documentation badges, quick links, and code snippets refer to the `open-hax/codex` repo + npm package name (`openhax/codex`) and updated GitHub Pages namespace.
5. Workspace-level docs/specs referencing the package reflect the rebrand, ensuring there are no lingering mentions of the old repository.
6. Automated search confirms there are no lingering references to the legacy plugin name, scope, or GitHub org outside historical changelog contexts.

## Plan (Phases)
### Phase 1: Metadata Update
- Update `package.json`, `package-lock.json`, `bun.lock`, and any other lockfiles to rename the package and reset the version.
- Adjust repository/homepage/bugs URLs plus author/contact metadata to the `open-hax` org.

### Phase 2: Source & Config Rebrand
- Replace legacy package identifiers in TypeScript sources, config JSON files, HTML templates, scripts, and internal docs.
- Update CLI examples (`scripts/test-all-models.sh`, config JSON) to use the new name.

### Phase 3: Documentation Refresh
- Rewrite README, docs (`docs/*`, `CROSS_REFERENCES.md`, `CONTRIBUTING.md`, `SECURITY.md`, etc.) to reference the new package name, badges, GitHub Pages links, and remove references to the previous repository/org.
- Update workspace-level documentation (AGENTS, master index, manifests) if new references are required.

### Phase 4: Verification
- Run `rg` scans to ensure no legacy branding terms remain anywhere in the workspace.
- Document changes in relevant specs/changelogs as part of the rebrand.
