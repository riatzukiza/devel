# Shared-depth vs board summary — 2026-03-20

| Rank | Variant | final val_bpb | bytes_total | train_time_ms |
|---:|---|---:|---:|---:|
| 1 | Throughput push board winner | 1.611407 | 10036271 | 691552 |
| 2 | Wide-balance board variant | 1.623124 | 10246842 | 558318 |
| 3 | Shared-depth RMS v0 (4 phys, RMS + phase) | 1.657651 | 5912023 | 908129 |
| 4 | Shared-depth crossover (throughput + RMS interface) | 1.667460 | 6025823 | 384074 |
| 5 | Shared-depth RMS v0 (4 phys, phase only) | 1.701560 | 6103395 | 254641 |
| 6 | Shared-depth RMS v0 (4 phys, RMS only) | 1.702169 | 6092264 | 257219 |

## Read

- The strongest board candidate still wins on score.
- Shared-depth RMS v0 remains compelling on artifact size (~5.9MB) but trails the best board family on `val_bpb`.
- The throughput crossover did not beat the base shared-depth RMS v0, suggesting the shared-depth family wants a different optimization regime than the board leader.
