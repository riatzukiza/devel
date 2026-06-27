# Knowledge Graph Config File Support

## Context

- Need a persistent config file so CLI options (e.g., Mermaid limits) are respected when rendering diagrams for Obsidian.
- Current CLI takes ad-hoc JSON args; no config file is read.

## Code References

- `src/cli.ts`: CLI commands and argument parsing, mermaid command at lines ~198-212.
- `src/visualization/mermaid.ts`: MermaidOptions definition and defaults (`limit` default 400, `dropIsolated` true) lines ~6-148.

## Requirements

- Introduce a repo-level config file (JSON or YAML) loaded by the CLI, e.g., `knowledge-graph.config.{json,yaml,yml}` in the working directory / repository root.
- Support at least `mermaid` options: `direction`, `limit`, `edgeLimit`, `types`, `pathPrefix`, `dropIsolated`, `output` (optional default output path).
- Allow future extension (e.g., database path, export defaults) without breaking shape.
- Merge precedence: CLI flags/args override config; config overrides built-in defaults.
- If config file is missing or malformed, fall back to current defaults and surface a clear error message for invalid config.
- Keep generated Mermaid output wrapped in a fenced code block; no behavior regressions for existing commands.

## Definition of Done

- CLI loads config file when present and applies it to `mermaid` command defaults.
- New config format documented (file name, supported fields, example) and referenced for Obsidian users.
- Obsidian diagram generation can be simplified via config (e.g., lower `limit`/`edgeLimit`, set `dropIsolated`: true) without extra CLI JSON typing.
- No breaking changes to existing CLI usage; explicit CLI JSON args still work and take precedence.

Backlink: see [obsidian-mermaid.md](./obsidian-mermaid.md) for the Obsidian compatibility context.
