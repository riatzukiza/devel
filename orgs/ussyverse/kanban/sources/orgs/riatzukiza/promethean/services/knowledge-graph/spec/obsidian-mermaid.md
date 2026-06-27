# Obsidian Mermaid Output Review

## Context

- User: Obsidian cannot open generated Mermaid diagrams; questions about respecting settings and presence of a config file.
- Command run: `pnpm --filter @promethean-os/knowledge-graph run cli -- mermaid ./graph.md LR '{"limit":800,"edgeLimit":400,"types":["documentation","code"],"dropIsolated":true}'` writing to `services/knowledge-graph/graph.md`.

## Code References

- `src/cli.ts`: config loading (lines 86-112) plus mermaid command wiring and option parsing (lines 218-234); options can come from config or third CLI arg.
- `src/visualization/mermaid.ts`: MermaidOptions shape, defaults, filtering/limit logic (lines 6-148); default limit 400, `dropIsolated` true unless explicitly set false.

## Existing Issues

- None reviewed/linked for this behavior.

## Existing PRs

- None reviewed/linked for this behavior.

## Requirements

- Explain how the CLI respects Mermaid options (limit, edgeLimit, types, pathPrefix, dropIsolated, direction).
- Clarify the dedicated config file (`knowledge-graph.config.{json,yaml,yml}`) that now carries defaults for mermaid/export/database; note CLI args still override.
- Provide guidance to produce Obsidian-friendly diagrams (smaller output, narrow `types`/`pathPrefix`, lower limits, consider `export markdown/json` if needed).

## Definition of Done

- Share a concise answer covering available Mermaid options, defaults, and the new config file path/fields.
- Offer concrete parameter sets to generate smaller diagrams that Obsidian can render.
- Point to the output file `graph.md` and relevant code paths for future changes.
