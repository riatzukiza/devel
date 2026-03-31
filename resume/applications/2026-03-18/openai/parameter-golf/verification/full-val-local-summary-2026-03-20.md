# Full-validation local candidate summary — 2026-03-20

These are the strongest local consumer-GPU runs using the **full published validation split** and 500 training steps on the first published train shard.

| Rank | Strategy | Candidate | final val_bpb | bytes_total | wallclock_s |
|---:|---|---|---:|---:|---:|
| 1 | Throughput push | `de7915d3d64c` | 1.611407 | 10036271 | 1270.8 |
| 2 | free-ant≈Wide balance | `2d0731942b8d` | 1.623124 | 10246842 | 1195.0 |
| 3 | free-ant≈KV-thin attention | `9fbd60b89a28` | 1.665958 | 10944500 | 591.1 |

## Recommendation

If cloud credits arrive, start with **Throughput push** (`de7915d3d64c`), then **free-ant≈Wide balance** (`2d0731942b8d`), then **free-ant≈KV-thin attention** (`9fbd60b89a28`).
