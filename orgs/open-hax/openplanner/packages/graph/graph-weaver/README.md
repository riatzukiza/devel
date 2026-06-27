# devel-graph-weaver

A small dev service that:

1. builds a graph from OpenPlanner (recommended) or local filesystem scan
2. shows it in a WebGL graph view
3. passively grows a web graph from discovered external links using an ACO-ish crawler


> Built with [GLM-5](https://z.ai) — part of the [z.ai](https://z.ai) startup ecosystem and the [Ussyverse](https://ussy.cloud).

## Reading order

1. `docs/INDEX.md`
2. `docs/FORK_TALES_SOURCE_MAP.md`
3. `specs/service-surface.md`
4. `specs/graph-layers-and-storage.md`
5. `specs/query-preview-and-mutation.md`

## Source Modes (`GRAPH_WEAVER_LOCAL_SOURCE`)

The graph source is controlled by the `GRAPH_WEAVER_LOCAL_SOURCE` environment variable:

| Mode | Description | Use Case |
|------|-------------|----------|
| `openplanner-graph` | **RECOMMENDED** - Fetches graph from OpenPlanner `/v1/graph/export` | Visualization of documents, sessions, memory |
| `repo` | Scans local filesystem for code-level edges (imports, requires, links) | Code dependency analysis |
| `openplanner-lakes` | Multi-project aggregation from OpenPlanner lakes | Cross-project graph |
| `none` | No automatic source, manual overlay only | Custom graphs |

### Recommended Configuration

```bash
# Primary mode: Use OpenPlanner as source of truth
GRAPH_WEAVER_LOCAL_SOURCE=openplanner-graph
OPENPLANNER_BASE_URL=http://openplanner:3000
OPENPLANNER_API_KEY=your-api-key
```

### Avoiding Duplication

**Do NOT** run both Knoxx document ingestion AND graph-weaver `repo` mode on the same files. This creates duplicate processing:

- **Knoxx ingestion** → OpenPlanner `/v1/documents` → Document embeddings
- **Graph-weaver `repo`** → Local scan → Code-level edges

Instead:
- Use `openplanner-graph` mode to visualize documents from OpenPlanner
- Use `repo` mode ONLY when you need code-level import/dependency analysis
- See [knowledge-ops-ingestion-architecture.md](../knoxx/specs/knowledge-ops-ingestion-architecture.md) for details

## Run (docker)

```bash
docker compose -f orgs/octave-commons/graph-weaver/compose.yaml up
```

Then open:

- `http://127.0.0.1:8796/`

GraphQL:

- endpoint: `http://127.0.0.1:8796/graphql`
- GraphiQL UI: `http://127.0.0.1:8796/graphiql`

## Env

- `REPO_ROOT` (default: repo root via `git rev-parse`)
- `PORT` (default: `8796`)
- `HOST` (default: `0.0.0.0`)

- `GRAPH_WEAVER_LOCAL_SOURCE` (default: `repo`) — See modes above
- `OPENPLANNER_BASE_URL` — Required for `openplanner-graph` and `openplanner-lakes` modes
- `OPENPLANNER_API_KEY` — API key for OpenPlanner authentication
- `OPENPLANNER_PROJECTS` — Comma-separated project list for `openplanner-graph` mode

- `WEAVER_ANTS` (default: `4`)
- `WEAVER_DISPATCH_INTERVAL_MS` (default: `15000`)
- `WEAVER_MAX_CONCURRENCY` (default: `2`)

Optional:

- `GRAPH_WEAVER_ADMIN_TOKEN` — if set, GraphQL mutations require `Authorization: Bearer <token>`
- `STATE_DIR` (default: `.opencode/runtime`) — where config + user-layer graph snapshots are stored
- `INCLUDE_SEMANTIC_EDGES` — Include kNN semantic similarity edges from OpenPlanner
- `SEMANTIC_MIN_SIMILARITY` — Minimum similarity threshold for semantic edges

## Adjacent repos

- `octave-commons/graph-weaver-aco` — ACO traversal kernel
- `octave-commons/myrmex` — richer extraction/integration orchestrator
