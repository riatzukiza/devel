# Shared-depth RMS interface local summary — 2026-03-20

| Rank | Variant | final val_bpb | bytes_total | train_time_ms |
|---:|---|---:|---:|---:|
| 1 | v0 full (4 physical, RMS + phase scales) | 1.657651 | 5912023 | 908129 |
| 2 | v0 full (6 physical, RMS + phase scales) | 1.677411 | 8910213 | 257236 |
| 3 | v0 full (4 physical, phase scales only) | 1.701560 | 6103395 | 254641 |
| 4 | v0 full (4 physical, RMS only) | 1.702169 | 6092264 | 257219 |

## Takeaways

- 4 physical blocks beat 6 physical blocks in this family under the current local full-validation setup.
- The full interface wins: removing extra projection RMSNorm or removing phase-conditioned scales both degrade performance to ~1.70 bpb.
- Phase-scales-only (`1.701560`) is slightly better than RMS-only (`1.702169`), but both are materially worse than the combined interface (`1.657651`).
- This frontier family remains weaker on score than the strongest board candidates, but dramatically smaller in artifact size (~5.9MB).
