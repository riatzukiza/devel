# @workspace/eta-mu-truth-workbench

Lowest-level UI for ημ truth resolution (truth graph vs view graph), separate from simulation.

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

## Notes

- Truth ops append to: `<vault>/.Π/ημ_truth_ops.v1.jsonl`
- View caches emit to: `<vault>/.opencode/runtime/eta_mu_docs_*.v1.jsonl`

GPL-3.0-only
