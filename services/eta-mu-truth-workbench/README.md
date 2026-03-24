# @workspace/eta-mu-truth-workbench

Fastify-based eta-mu service that serves:

- a public crystal / manifest site,
- an operator truth-resolution workbench,
- low-level truth APIs,
- live control-plane state for known vaults.

## Run

```bash
cd devel

# Point at a vault root that contains `.Π/` and `.opencode/runtime/eta_mu_mounts.v1.json`
ETA_MU_VAULT_ROOT=/home/err/devel/orgs/octave-commons/promethean \
  WEB_PORT=8790 \
  pnpm --filter @workspace/eta-mu-truth-workbench dev
```

Open:
- http://127.0.0.1:8790/

Routes:
- `/` — public eta-mu crystal / manifest site
- `/workbench` — operator truth-resolution workbench
- `/api/site/overview` — public substrate summary
- `/api/truth/*` — low-level truth APIs
- `/api/control-plane/vaults` — all known vault states
- `/api/control-plane/:vaultId` — one vault state (`proxx`, `voxx`, ...)
- `/api/control-plane/receipts` — recent control-plane receipts / actuation log
- `/health` — service health

Optional auth:
- `ETA_MU_GITHUB_TOKEN` (or `GITHUB_TOKEN`) enables authenticated GitHub GraphQL reads for exact unresolved review-thread counts in control-plane vault cards.

Automation:
- `ETA_MU_AUTOMATION_ENABLED` — enable the narrow actuation loop (defaults to `true`)
- `ETA_MU_AUTOMATION_INTERVAL_MS` — scheduler interval for actuation checks
- `ETA_MU_AUTOMATION_VAULTS` — comma-separated vault ids eligible for automation (defaults to `proxx`)
- `ETA_MU_CONTROL_PLANE_RECEIPTS_PATH` — JSONL receipt log for successful control-plane actions

## Notes

- Truth ops append to: `<vault>/.Π/ημ_truth_ops.v1.jsonl`
- View caches emit to: `<vault>/.opencode/runtime/eta_mu_docs_*.v1.jsonl`

GPL-3.0-only
