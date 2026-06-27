# Details Panel Text Content

## Goal

- Show the underlying text of documentation/code nodes in the knowledge-graph UI details panel.

## Current State

- The Solid UI renders content from `node.data.content/body/markdown` when available (packages/knowledge-graph-ui/src/App.tsx:856-965) but nodes currently arrive without any text payload, so the panel is empty.
- File nodes are created without `content`; they only include title/filePath/language (services/knowledge-graph/src/builder.ts:149-174).
- The repository processor reads file text but discards it after parsing links/imports (services/knowledge-graph/src/processors/content.ts:27-73).
- `NodeData` already allows a `content` field (services/knowledge-graph/src/types/graph.ts:19-26).

## Requirements

- Persist text payload for supported text/code files when building/exporting the graph (documentation + code nodes).
- Apply a reasonable size cap (truncate/store first N chars) and mark truncation to avoid bloating exports/NDJSON.
- Keep existing link/import/dependency extraction unchanged; metadata should still include size/source.
- Ensure NDJSON/JSON export continues to work with the new `content` field.
- UI should render markdown/code for docs and code nodes using the new content; plain text fallback for other types.

## Definition of Done

- A rebuild populates `data.content` for text/code files within the size cap, and truncation is indicated when it occurs.
- The details panel displays file text/markdown/code for selected nodes in the UI.
- Tests or targeted linting for touched areas pass, or manual verification is documented.

## Existing Issues / PRs

- None observed.
