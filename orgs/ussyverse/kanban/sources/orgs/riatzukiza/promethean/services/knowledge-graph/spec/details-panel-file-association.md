# Knowledge Graph UI details panel shows stale file

## Context

- Panel content stays stuck on previous file when selecting new nodes, suggesting stale viewer state.
- Code refs: packages/knowledge-graph-ui/src/hooks/useFileViewer.ts:14-45 clears only `externalContent`, leaving `fileViewerContent` when fetch fails; packages/knowledge-graph-ui/src/App.tsx:793-934 renders `externalContent() || fileViewerContent()`, so stale content surfaces despite selection changes.

## Hypothesis

- Missing reset of file viewer state when changing selection or starting a load lets failed fetches retain the last successful file text, making the panel appear frozen on one file.

## Plan

1. Reset file viewer content/path/loading when beginning a load or when selection is absent to avoid stale text. 2) Keep error reporting but ensure no previous content remains. 3) Verify details panel updates per node selection.

## Definition of done

- Selecting different nodes loads their associated file content; previous file is not shown when a fetch fails or a node lacks a path.
- Error states display without stale content.
- Relevant checks/tests for touched areas are run or documented.

## Notes

- No linked issues or PRs observed.
