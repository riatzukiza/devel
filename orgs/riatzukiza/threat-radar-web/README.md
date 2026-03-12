# Threat Radar Web

Render-hosted wall-of-clocks frontend for the threat radar platform.

## What it shows

- one tile per active radar
- animated clock hand from reduced live state
- uncertainty arcs
- disagreement halo
- submission and source counts

## Local

```bash
pnpm --filter @riatzukiza/threat-radar-web dev
```

The dev server proxies `/api` to `http://127.0.0.1:10002`.
