# Parameter Golf Ant Lab

This directory stores ACO-style search state for two built-in profiles:
- `board` — competition-facing Parameter Golf search
- `presence` — research-facing tiny safe Presence search

Suggested commands:
```bash
pnpm pg:ants init --lab-dir labs/parameter-golf-ant-lab --profile all
pnpm pg:ants step --lab-dir labs/parameter-golf-ant-lab --profile board
pnpm pg:ants status --lab-dir labs/parameter-golf-ant-lab --profile board
pnpm pg:ants record --lab-dir labs/parameter-golf-ant-lab --profile board --candidate-id <id> --metrics-json '{"val_bpb":1.21,"bytes_total":15800000,"wallclock_seconds":590}'
```

The ants do not run training themselves yet; they propose, remember, and reinforce promising experiment paths.
