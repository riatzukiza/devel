# Fork Tales Source Map

`graph-weaver` is not a one-to-one transplant of the old Fork Tales crawler service.
It is a **descendant** that braids together:
- the old Web Graph Weaver service doctrine
- later field/crawler integration work
- a new local-repo graph layer
- a user-editable overlay

## Primary upstream sources

### 1. Original Web Graph Weaver service
- `orgs/octave-commons/fork_tales/docs/WEB_GRAPH_WEAVER.md`
- `orgs/octave-commons/fork_tales/specs/drafts/web-graph-weaver.md`
- `orgs/octave-commons/fork_tales/part64/code/web_graph_weaver.js`

These define the original crawler service shape:
- ethical crawl guardrails
- live event stream
- graph APIs
- dashboard integration

### 2. Runtime integration notes
- `orgs/octave-commons/fork_tales/specs/drafts/weaver-graph-field-integration.md`
- `specs/drafts/radar-crawler-integration-2026-03-20.md`

These show the crawler graph becoming part of larger runtime knowledge surfaces instead of living alone.

### 3. The extracted ACO kernel
- `octave-commons/graph-weaver-aco`

This repo imports the extracted traversal kernel rather than embedding all crawl logic itself.

## What this repo adds beyond the original service

This repo is not just a crawler surface. It adds:
- a local repo scanner that respects tracked files and extracts links/imports/dependencies
- a merged graph with `local`, `web`, and `user` layers
- GraphQL query and mutation surface
- preview endpoints for files and URLs
- Mongo-backed persistence for web and user graph layers

## Honest status

This repo is a hybrid descendant:
- part extraction from the old crawler doctrine
- part new graph workbench for the devel workspace

That hybrid nature is real and should remain explicit in the docs.
