# Render full graph for root

## Context

- Request: ensure @promethean-os/knowledge-graph can render the entire graph when starting from the root node/component.
- Current blocker: `getConnectedNodes` builds a CTE for nodes but reuses `connected_nodes` in a second query without redefining the CTE, causing SQL errors / missing edges and preventing a full graph render.

## Code References

- src/database/repository.ts:218-258 — `getConnectedNodes` builds CTE and queries nodes/edges.
- tests/database.test.ts:210-243 — connected-nodes unit test using the sqlite mock.
- spec/code-review.md:6-13 — prior review note about the missing CTE reference for edges.

## Existing Issues / PRs

- Issues: connected-nodes CTE bug already noted in repo docs; no tracked GitHub issue reviewed this session.
- PRs: none reviewed.

## Requirements

- Fix `getConnectedNodes` so edges are selected using the same recursive set as nodes (no `connected_nodes` reference errors).
- Keep depth handling and exclusion of the root node in the returned node list; include edges touching the root.
- Update tests/mocks to assert edges are returned and to fail if the CTE is absent in the edges query.

## Definition of Done

- `getConnectedNodes` returns nodes and edges for the full connected component from the root without SQL errors.
- Automated tests cover the fixed behavior and pass.
- No regressions to existing repository/query APIs.
