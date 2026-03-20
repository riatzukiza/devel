# board leaderboard signals

- generatedAt: 2026-03-20T02:29:23.516Z
- source: unofficial dashboard + PR-backed submissions
- maxSubmissions: 40

## Top motifs

- quantization: 1.0000
- sliding_window: 0.6184
- mlp_heavy: 0.5040
- optimizer: 0.3474
- recurrence: 0.2554
- long_context: 0.2037
- vocab: 0.1326
- kv_structure: 0.0658
- smaller_batch: 0.0183
- ttt: 0.0064

## Strategy boosts

| Strategy | prior | signalBoost | effectivePrior | risk |
|---|---:|---:|---:|---|
| Throughput push | 0.790 | 0.116 | 0.906 | medium |
| Wide balance | 0.820 | 0.040 | 0.860 | medium |
| MLP-heavy | 0.680 | 0.180 | 0.860 | medium |
| Byte cautious | 0.610 | 0.180 | 0.790 | low |
| Deep narrow | 0.710 | 0.072 | 0.782 | medium |
| KV-thin attention | 0.760 | 0.019 | 0.779 | medium |
| Baseline anchor | 0.740 | 0.000 | 0.740 | low |
| Long-context budget | 0.560 | 0.173 | 0.733 | medium |
| KV-fat attention | 0.630 | 0.010 | 0.640 | medium |
| Capacity stress | 0.340 | 0.092 | 0.432 | high |

## Missing axes worth adding later

- quantization recipe / int6-vs-int8
- sliding-window eval mode
- recurrence / cross-layer sharing
- vocab size / tokenizer family
- embedding precision
