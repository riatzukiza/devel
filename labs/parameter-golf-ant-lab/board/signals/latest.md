# board leaderboard signals

- generatedAt: 2026-03-20T17:29:12.121Z
- source: unofficial dashboard + PR-backed submissions
- maxSubmissions: 40

## Top motifs

- quantization: 1.0000
- optimizer: 0.5874
- mlp_heavy: 0.5214
- sliding_window: 0.5026
- vocab: 0.3949
- recurrence: 0.2560
- long_context: 0.1890
- ttt: 0.1280
- kv_structure: 0.0071
- smaller_batch: 0.0067

## Local proxy boosts

- free-ant≈KV-thin attention: 0.1600
- free-ant≈Wide balance: 0.1200
- KV-thin attention: 0.0800
- Throughput push: 0.0400

## Strategy boosts

| Strategy | prior | signalBoost | effectivePrior | risk |
|---|---:|---:|---:|---|
| Throughput push | 0.790 | 0.187 | 0.977 | medium |
| MLP-heavy | 0.680 | 0.206 | 0.886 | medium |
| Wide balance | 0.820 | 0.058 | 0.878 | medium |
| KV-thin attention | 0.760 | 0.082 | 0.842 | medium |
| Byte cautious | 0.610 | 0.220 | 0.830 | low |
| Deep narrow | 0.710 | 0.071 | 0.781 | medium |
| Baseline anchor | 0.740 | 0.000 | 0.740 | low |
| Long-context budget | 0.560 | 0.146 | 0.706 | medium |
| KV-fat attention | 0.630 | 0.001 | 0.631 | medium |
| Capacity stress | 0.340 | 0.093 | 0.433 | high |

## Missing axes worth adding later

- quantization recipe / int6-vs-int8
- sliding-window eval mode
- recurrence / cross-layer sharing
- vocab size / tokenizer family
- embedding precision
