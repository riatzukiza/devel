# Local proxy board summary — 2026-03-20

These are **local proxy** runs on the RTX 4070 laptop GPU, using:
- 1 train shard
- truncated local validation shard (~2.1M tokens)
- 80 iterations
- 1 GPU docker runner

They are **not official competition scores**. They are used to rank which candidates deserve cloud credits next.

| Rank | Strategy | Candidate | val_bpb | bytes_total | wallclock_s | local_batch |
|---:|---|---|---:|---:|---:|---:|
| 1 | KV-thin attention | `f9d65cff70d6` | 2.444852 | 9058583 | 282.0 | 65536 |
| 2 | Throughput push | `de7915d3d64c` | 2.450975 | 7227805 | 267.6 | 98304 |
| 3 | Baseline anchor | `29b0fcb6da31` | 2.462956 | 8121850 | 268.6 | 65536 |
| 4 | Wide balance | `5340081a0d53` | 2.491759 | 10120146 | 300.6 | 57344 |

## Current recommendation

Burn the next serious cloud token on **KV-thin attention** (`f9d65cff70d6`) first.
