# Threat Radar Web

React dashboard for the threat-radar platform — "Mission Control for the News." A three-lane intelligence display that expresses nuance, preserves user agency, and resists collapsing complex events into binary frames.

## Architecture

Three-lane layout with animated visualizations:

| Lane | Symbol | Color | Purpose |
|---|---|---|---|
| Global | **η** | Cyan | Macro-scale signals and world threads |
| Local | **μ** | Emerald | Community-level and regional threads |
| Connections | **Π** | Fuchsia | Cross-thread links and opportunity cards |

### Key Components

- **ThreatClock** — animated clock face showing signal intensity over time
- **RiskGauge** — composite risk indicator with uncertainty arcs
- **BranchMap** — narrative branch visualization
- **HeroPanel** — top-level status summary
- **EtaLane / MuLane** — global and local thread card lanes
- **PiLaneConnections** — cross-thread connection discovery
- **PersonalizationPanel** — user weight/preference controls
- **CriticalThinkingSection** — counter-narrative prompts
- **ActionFeed** — actionable response cards
- **FirehosePanel** — live signal stream

## Setup

### Prerequisites

- Node.js ≥ 20, pnpm
- Running threat-radar-mcp backend (default: `http://127.0.0.1:9001`)

### Install & Build

```bash
pnpm install
pnpm --filter @workspace/radar-core build
pnpm --filter @workspace/signal-embed-browser build
pnpm --filter @riatzukiza/threat-radar-web build
```

## Run

```bash
# Development (Vite dev server on port 5176)
pnpm --filter @riatzukiza/threat-radar-web dev
```

The dev server proxies `/api` requests to `http://127.0.0.1:10002`.

To point at a different backend, configure the proxy in `vite.config.ts` or set `VITE_API_URL` at build time.

### Production Preview

```bash
pnpm --filter @riatzukiza/threat-radar-web build
pnpm --filter @riatzukiza/threat-radar-web preview
```

## Dependencies

- `@workspace/radar-core` — shared Zod schemas, normalization, clustering
- `@workspace/signal-embed-browser` — browser-side ONNX cosine similarity (665B model)
- React 18, Vite 5, TypeScript 5

## Tests

```bash
pnpm --filter @riatzukiza/threat-radar-web test
```

Uses Vitest + React Testing Library + jsdom.

## License

GPL-3.0-only
