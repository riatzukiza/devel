# Spec: Salt Chroma Collection Names With Model

## Summary
- Append a sanitized embedding model suffix to Chroma collection names to avoid dimension conflicts.
- Apply the salting to OpenCode sessions indexing/search and reconstitute sessions/notes.
- Update docs/skills to reflect base-name + model suffix behavior.

## Requirements
- `CHROMA_COLLECTION` becomes a base name; actual collection name appends `__<model-suffix>`.
- `CHROMA_COLLECTION_SESSIONS` and `CHROMA_COLLECTION_NOTES` become base names with model suffixes.
- Avoid breaking if the base name already ends with the suffix.
- Update docs and OpenCode command/skill docs accordingly.

## Files and Line References
- `packages/reconstituter/src/opencode-sessions.ts:57` add collection salting helper + base name env.
- `packages/reconstituter/src/reconstitute.ts:87` add collection salting helper + base names.
- `index_opencode_sessions.ts:41` apply collection salting + base name env.
- `search_opencode_sessions.ts:15` apply collection salting for search.
- `OPENCODE-SESSIONS-INDEXER.md:62` document salted collection names.
- `packages/reconstituter/README.md:33` document salted collection names.
- `.opencode/skills/opencode-session-search/SKILL.md:83` document salted collection names.
- `.opencode/skills/opencode-reconstituter/SKILL.md:55` document salted collection names.
- `.opencode/commands/opencode-sessions-index.md:10` document salted collection names.
- `.opencode/commands/opencode-sessions-search.md:10` document salted collection names.

## Definition of Done
- Indexing and search use the same salted collection name.
- Reconstitute sessions/notes collections are salted with model suffix.
- Docs mention base name + model suffix behavior.
- `lsp_diagnostics` clean for modified TS files; Markdown LSP failures documented if tool unavailable.
- `pnpm -C packages/reconstituter test`, `pnpm -C packages/reconstituter exec tsc -p tsconfig.json --noEmit`, and `pnpm build` succeed.

## Change Log
- 2026-02-03: Initial spec drafted.
