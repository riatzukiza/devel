# Settings page + config-backed related embeddings

## Scope

- Add config-schema support for related/embedding options (topN/cache/provider/etc.) and prefer config over env, with env as fallback.
- Expose read/write of config via API so UI can edit (GraphQL-based settings endpoints).
- Add UI settings page/panel to view/update related/embedding settings and persist to config file.

## Files to touch

- `src/config.ts`: extend config schema + load/save helpers (existing parsing at ~L1-114).
- `src/builder.ts`: consume config-provided related options instead of env-only (~L10-70, ~L520+).
- `src/ann/related-embeddings.ts`: ensure options coverage (defaults/types) (~L1-333).
- `src/graphql-server.ts`: load config, expose config query/mutation, pass related opts (~L1-330).
- `src/http-server.ts`: instantiate builder with config-related options (~L1-50) if needed.
- `packages/knowledge-graph-ui/src/App.tsx`: add settings UI and GraphQL calls (~L1-1537).
- `packages/knowledge-graph-ui/src/types.ts`: add client types for config response (~L1-30).

## Existing issues/refs

- User request: prefer config files + settings page for embedding-related controls over env vars.

## Definition of done

- Related/embedding defaults can be set in `knowledge-graph.config.(yaml|json)` and override envs.
- GraphQL API exposes get/save endpoints for related settings; writes config file (with path reported).
- UI shows settings panel/page to view/update related settings and saves to config file via API.
- Backwards compatibility: env vars still work if config absent.

## Requirements/notes

- Keep config path resolution consistent (use config file dir for relative paths).
- Validate/guard settings inputs (numbers non-negative, provider enum, etc.).
- Avoid breaking existing CLI behaviors; CLI args still override where applicable.
- Prefer YAML for new config writes if no existing file; preserve existing file path if present.
