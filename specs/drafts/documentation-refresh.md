# Documentation refresh (workspace root)

## Goal
Update the root README and a small set of workspace docs so they match the current repo layout and current tooling entrypoints.

## Scope (intended)
- Root `README.md`
- `docs/README.md`
- `REPOSITORY_INDEX.md`
- `docs/MASTER_CROSS_REFERENCE_INDEX.md`
- `OPENCODE-SESSIONS-INDEXER.md`
- `CLOJURE.md`
- `CENTRALIZED_MCP_DOCUMENTATION.md`
- `spec/codex-release-monitor.md`
- Add missing OpenCode agent doc for release monitoring: `.opencode/agents/release-impact.md`

## Non-goals
- Rewriting large historical session dumps (`session-ses_*.md`, `docs/opencode-session-*.md`).
- Auditing every submodule’s own docs.

## Observations / evidence (repo-local)
- Root README references files that don’t exist / moved:
  - `.opencode/skills/pm2-process-management.md` should be `.opencode/skills/pm2-process-management/SKILL.md`.
  - Release watch section references `.opencode/agent/release-impact.md` but this repo uses `.opencode/agents/` and the file is missing.
- `docs/README.md` currently describes a “Task Master (.opencode) package” which is not what `docs/` contains in this workspace.
- `REPOSITORY_INDEX.md` and `docs/MASTER_CROSS_REFERENCE_INDEX.md` contain broken relative links (e.g. `open-hax/codex/` instead of `orgs/open-hax/codex/`).
- `OPENCODE-SESSIONS-INDEXER.md` describes a ChromaDB semantic indexer, but the current `packages/reconstituter/src/opencode-sessions.ts` indexes into OpenPlanner and searches via FTS.
- Centralized/unified Clojure MCP tooling exists but is rarely used.

## Open questions
1. Should we present ChromaDB indexing as deprecated, or keep it as an alternative path? (Recommendation: mark legacy.)
2. Should we list every submodule in README? (Recommendation: list “core” + link to `.gitmodules` / `git submodule status`.)

## Plan
### Phase 1: Link + path corrections
- Fix file path references in `README.md`, `REPOSITORY_INDEX.md`, and `docs/MASTER_CROSS_REFERENCE_INDEX.md`.
- Rewrite `docs/README.md` as an index for this workspace’s docs folder.

### Phase 2: OpenCode sessions indexer docs
- Update `OPENCODE-SESSIONS-INDEXER.md` to document the current OpenPlanner-based workflow.
- Mention legacy Chroma scripts (`index_opencode_sessions.ts`, `search_opencode_sessions.ts`) as deprecated.

### Phase 3: Clojure MCP docs + config

Decision: remove the older centralized/unified Clojure MCP servers from the workspace.

### Phase 4: Release watch agent doc
- Add `.opencode/agents/release-impact.md` with strict JSON schema and operating instructions.
- Update `README.md` + `spec/codex-release-monitor.md` to point to the correct location.

## Definition of done
- All modified docs reference existing paths.
- “Quick start” commands correspond to existing scripts/packages in this repo.
- No references remain to the removed centralized/unified Clojure MCP launchers.
