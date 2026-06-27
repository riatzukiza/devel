# OpenPlanner - Graph Stack Monorepo

> **Built with [GLM-5](https://z.ai)** — OpenPlanner uses GLM-5 by default for all agent operations.

OpenPlanner was made possible by the **[z.ai](https://z.ai) startup ecosystem** and its ongoing support of the **[Ussyverse](https://ussy.cloud)**. This project would not exist without GLM-5's speed, throughput, and sustained access during a period of widespread API restriction.

OpenPlanner is the canonical graph monorepo containing all packages for semantic graph construction, layout, traversal, and search.

## Architecture

```
OpenPlanner (monorepo root)
├── src/                          # Core OpenPlanner API server
│   ├── routes/v1/graph.ts        # Graph endpoints (traversal, edges, layout)
│   └── lib/mongodb.ts            # MongoDB collections for graph data
├── packages/
│   ├── graph-weaver/             # GraphQL server for graph data
│   ├── graph-weaver-aco/         # Ant Colony Optimization for clustering
│   ├── graph-runtime/            # Runtime specs and documentation
│   ├── eros-eris-field/          # Force-directed layout library
│   ├── eros-eris-field-app/      # Layout worker app (connects to graph-weaver)
│   ├── myrmex/                   # Web crawler and graph store client
│   └── vexx/                     # NPU-accelerated cosine similarity (Clojure)
└── services/                     # Runtime stack configurations
```

## Data Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Myrmex        │────▶│   Graph-Weaver   │────▶│  OpenPlanner    │
│  (web crawler)  │     │  (GraphQL API)   │     │  (storage API)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ Eros-Eris-Field  │     │    MongoDB      │
                        │ (layout worker)  │────▶│  (vectors +     │
                        └──────────────────┘     │   graph data)   │
                               │                 └─────────────────┘
                               ▼
                        ┌──────────────────┐
                        │      Vexx        │
                        │ (NPU cosine sim) │
                        └──────────────────┘
```

## Packages

### Core Storage

| Package | Description | Tech |
|---------|-------------|------|
| `src/` | OpenPlanner API server | TypeScript, Fastify, MongoDB |
| `graph-weaver` | GraphQL server for graph queries | TypeScript, GraphQL, MongoDB |
| `graph-runtime` | Runtime specifications | Markdown |

### Layout & Clustering

| Package | Description | Tech |
|---------|-------------|------|
| `eros-eris-field` | Force-directed layout engine | TypeScript |
| `eros-eris-field-app` | Layout worker (connects to graph-weaver) | TypeScript |
| `graph-weaver-aco` | Ant Colony Optimization clustering | TypeScript |

### Ingestion & Acceleration

| Package | Description | Tech |
|---------|-------------|------|
| `myrmex` | Web crawler, graph store client | TypeScript |
| `vexx` | NPU-accelerated cosine similarity | Clojure, ONNX Runtime |

## Quick Start

```bash
# Clone with submodules
git clone --recursive git@github.com:open-hax/openplanner.git

# Or initialize submodules after clone
git submodule update --init --recursive

# Install dependencies
pnpm install

# Start the stack
docker compose -f services/openplanner/docker-compose.yml up -d
```

## Graph Search Architecture

OpenPlanner owns all graph data:

| Collection | Purpose |
|------------|---------|
| `graph_edges` | Structural edges (links, deps) from graph-weaver |
| `graph_semantic_edges` | Semantic edges from embedding clustering |
| `graph_layout_overrides` | Node positions (x, y) from force simulation |
| `graph_node_embeddings` | Node embeddings for vector search |

### Traversal with Physical Distances

Graph traversal uses **Euclidean distance** from layout positions as the cost metric:

```
cost = sqrt((x1-x2)² + (y1-y2)²)
```

This encodes ALL forces in the graph:
- Structural links pull connected nodes together
- Semantic similarity creates attraction/repulsion
- Layout positions reflect the equilibrium of all forces

```bash
# Traverse from seed nodes using physical distances
curl -X POST http://localhost:7777/v1/graph/traverse \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"seedNodeIds": ["web:url:https://github.com/"], "maxDistance": 5000}'
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /v1/graph/edges/upsert` | Persist structural edges |
| `POST /v1/graph/edges/query` | Query edges by node IDs |
| `POST /v1/graph/semantic-edges/upsert` | Persist semantic edges |
| `POST /v1/graph/semantic-edges/query` | Query semantic edges |
| `POST /v1/graph/traverse` | Graph traversal with physical distances |
| `POST /v1/graph/semantic-search` | Vector search + graph traversal |
| `GET /v1/graph/monitoring` | Graph stats and metrics |

## Development

```bash
# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Start dev server
npm run dev
```

## Code Quality

OpenPlanner includes repository-wide code duplication scanning via `jscpd`.

```bash
# Generate console, HTML, and JSON duplication reports
pnpm duplication:scan

# Run the CI-suitable duplication gate
pnpm duplication:check
```

Reports are written to `reports/jscpd/` and are ignored as regenerable artifacts. The default gate focuses on executable code in `src`, `packages`, `tests`, `scripts`, and `config`, while excluding generated output, vendored dependencies, local virtualenvs, worktrees, lockfiles, sourcemaps, and other noisy artifacts.

The GitHub Actions workflow at `.github/workflows/code-quality.yml` runs the duplication gate on pull requests and pushes to `main`/`master`.

See [`docs/code-quality.md`](docs/code-quality.md) for scanner scope, thresholds, ignored paths, and triage guidance.

## Submodule Management

```bash
# Initialize submodules
git submodule update --init --recursive

# Update all submodules to latest
git submodule update --remote --merge

# Update a specific submodule
cd packages/graph-weaver && git pull origin main
```
