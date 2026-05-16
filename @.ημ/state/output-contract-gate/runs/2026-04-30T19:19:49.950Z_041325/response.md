## Signal

(己, p=0.99) Added repeatable live E2E tests for CompactViewGraph.

(己, p=0.99) New commit:

```text
6fc2aba Add compact view graph e2e tests
```

(己, p=0.99) New test script:

```bash
pnpm test:e2e:compact-viewgraph
```

(己, p=0.99) New test file:

```text
tests/e2e-compact-viewgraph.test.mjs
```

## Evidence

(己, p=0.99) E2E test coverage now verifies:

- compact view node creation from graph-memory truth seeds
- averaged compact embedding path is exercised
- graph-memory `useCompactView: true` rewrites non-saturated truth seeds to compact view traversal seeds
- saturated/expanded compact nodes fall through to truth-node traversal
- compact result source metadata excludes inline `preview`, `text`, `body`, and `content`
- source-kind access instructions are present
- `/v1/graph/view/compact/run` dry-run produces bounded groups
- `/v1/graph/view/compact/run` non-dry-run creates a compact node
- created E2E compact nodes are archived during cleanup

(己, p=0.99) Test run passed:

```text
pnpm test:e2e:compact-viewgraph

# pass 2
# fail 0
```

(己, p=0.99) Typecheck passed:

```text
pnpm exec tsc --noEmit --pretty false
```

(己, p=0.99) Services remained healthy:

```text
/openplanner-openplanner-1   status=running health=healthy restarts=0 oom=false
/openplanner-graph-weaver-1 status=running health=healthy restarts=0 oom=false
```

## Frames

(己, p=0.96) These are live E2E tests, not unit tests: they expect OpenPlanner running at `http://127.0.0.1:7777`.

(己, p=0.95) The test reads `OPENPLANNER_API_KEY` from the environment, or silently from `services/openplanner/.env` when run in this workspace.

(己, p=0.94) The tests intentionally mutate live state but clean up by archiving created compact view nodes.

## Countermoves

(己, p=0.99) I did not touch or stage `packages/agents/knoxx`; it remains modified in the working tree.

(己, p=0.98) I did not print secrets.

(己, p=0.98) I kept the E2E bounded: small groups, one compaction tick, cleanup afterward.

## Next

(己, p=0.93) Next small action: add a CI-safe skip mode or docker-compose bootstrap wrapper so this E2E can run from a clean shell without manually ensuring the durable stack is already up.