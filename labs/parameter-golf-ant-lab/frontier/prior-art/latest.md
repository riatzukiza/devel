# frontier prior-art synthesis

- generatedAt: 2026-03-20T20:04:11.222Z
- sources: unofficial leaderboard, research garden, autoresearch writeup

## Cluster/value evidence

### shared_depth

| Value | score | evidence |
|---|---:|---|
| depth-recurrence | 1.700 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>hint:challenge-history/likely-strategy-families.md |
| cross-layer-tying | 1.200 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/index.md |
| phase-conditioned-sharing | 0.780 | garden:frontiers/compression-interfaces-for-shared-depth.md<br>hint:frontiers/compression-interfaces-for-shared-depth.md<br>garden:frontiers/entropy-friendly-model-structure.md |
| none | 0.595 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/index.md<br>garden:challenge-history/likely-strategy-families.md |
| role-state-recurrence | 0.200 | garden:moonshots/index.md<br>garden:moonshots/role-state-recurrence.md<br>hint:moonshots/role-state-recurrence.md |

### quantization_recipe

| Value | score | evidence |
|---|---:|---|
| int6-qat | 1.896 | garden:challenge-history/index.md<br>hint:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md |
| mixed-int6-fp16 | 1.314 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md |
| int8-row | 0.747 | garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md<br>garden:challenge-history/public-runs/naive-baseline.md |
| global-codebook | 0.600 | garden:frontiers/byte-allocation-beats-average-bit-width.md<br>garden:frontiers/entropy-friendly-model-structure.md<br>garden:frontiers/rate-distortion-for-artifact-caps.md |
| bitnet-ternary | 0.200 | garden:challenge-history/public-runs/naive-baseline.md<br>garden:challenge-history/submission-archetypes.md<br>garden:frontiers/compression-interfaces-for-shared-depth.md |

### eval_strategy

| Value | score | evidence |
|---|---:|---|
| iterative-refinement | 0.775 | garden:challenge-history/likely-strategy-families.md<br>hint:challenge-history/likely-strategy-families.md<br>garden:challenge-history/submission-archetypes.md |
| standard-roundtrip | 0.453 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md<br>garden:challenge-history/public-runs/naive-baseline.md |
| sliding-window | 0.158 | leaderboard:Int6 11L + SmearGate + BigramHash + SWA + OrthoInit + MuonWD (val_bpb 1.1555)<br>leaderboard:[Val Only]: MLP 3x + STE int6 QAT + sliding window, val_bpb=0.9588<br>leaderboard:Record Update: val_bpb=0.9271 (val-only) + 1.1465 (standard) |
| ttt | 0.049 | leaderboard:Draft: SOTA+ TTT + RoPE50K + EMA + Curriculum (pending H100 run)<br>leaderboard:Record: FarnsworthEngine v1 — TTT + 11L Int6 MLP3x, val_bpb=1.1303 |
| doc-isolated-sliding | 0.000 |  |

### vocab_strategy

| Value | score | evidence |
|---|---:|---|
| sp4096 | 0.176 | hint:challenge-history/likely-strategy-families.md<br>hint:lanes/tokenizer-and-vocabulary.md<br>leaderboard:[Val Only]: MLP 3x + STE int6 QAT + sliding window, val_bpb=0.9588 |
| sp2048 | 0.156 | leaderboard:[WIP] Depth-recurrent QAT: 3x4 loops, 768d, 15.6MB artifact<br>leaderboard:11-Layer Int6 + WD=0.04 + SWA + FA3 (val_bpb: 1.1318)<br>leaderboard:4 the Leaderboard: 11L Int6 + SmearGate + Batch Optimization (val_bpb=1.1400) |
| bigramhash | 0.137 | leaderboard:Draft: SOTA+ TTT + RoPE50K + EMA + Curriculum (pending H100 run)<br>leaderboard:Int6 11L + SmearGate + BigramHash + SWA + OrthoInit + MuonWD (val_bpb 1.1555)<br>leaderboard:Record: FarnsworthEngine v1 — TTT + 11L Int6 MLP3x, val_bpb=1.1303 |
| sp1024 | 0.137 | garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md<br>garden:challenge-history/public-runs/index.md |
| byte260 | 0.000 |  |

### optimizer_recipe

| Value | score | evidence |
|---|---:|---|
| adaptive-schedule | 0.495 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/index.md<br>garden:challenge-history/likely-strategy-families.md |
| muon | 0.189 | garden:frontiers/learned-weight-codecs-and-compressible-training.md<br>leaderboard:Int6 11L + SmearGate + BigramHash + SWA + OrthoInit + MuonWD (val_bpb 1.1555)<br>leaderboard:[Val Only]: MLP 3x + STE int6 QAT + sliding window, val_bpb=0.9588 |
| muon-swa | 0.173 | garden:ideas/head-to-depth-budget-swap.md<br>garden:ideas/index.md<br>leaderboard:Int6 11L + SmearGate + BigramHash + SWA + OrthoInit + MuonWD (val_bpb 1.1555) |
| muon-warmdown | 0.037 | leaderboard:[Val Only]: MLP 3x + STE int6 QAT + sliding window, val_bpb=0.9588<br>leaderboard:Record: Int6 MLP3x + SmearGate + BigramHash + MuonWD + SWA (mean val_bpb=1.1483)<br>leaderboard:Submission: OrthoInit + Int6 MLP3x + SmearGate + BigramHash (val_bpb: 1.1524) |
| normuon | 0.018 | leaderboard:Record: Int6 STE + SmearGate + Seq2048 + OrthoInit + RoPE50K + SWA/100 (mean val_bpb=1.1507)<br>leaderboard:Record submission : Int6 + MLP 3x + Flash Attention 3 + NorMuon, val_bpb = 1.1532<br>leaderboard:Record: Int6 + MLP 3x + NorMuon + SmearGate + BigramHash + OrthoInit + Sliding Window, val_bpb=1.1541 |

### specialization

| Value | score | evidence |
|---|---:|---|
| lens-heads | 1.362 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md |
| norm-only | 0.840 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/naive-baseline.md |
| micro-gates | 0.747 | garden:frontiers/compression-interfaces-for-shared-depth.md<br>hint:frontiers/compression-interfaces-for-shared-depth.md<br>garden:hypotheses/ledger.md |
| none | 0.595 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/index.md<br>garden:challenge-history/likely-strategy-families.md |
| persistent-role-state | 0.200 | garden:moonshots/index.md<br>garden:moonshots/role-state-recurrence.md<br>hint:moonshots/role-state-recurrence.md |

### artifact_interface

| Value | score | evidence |
|---|---:|---|
| outlier-protected | 1.314 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md |
| regenerated-head | 0.740 | garden:challenge-history/conceptual-evolution.md<br>garden:challenge-history/likely-strategy-families.md<br>garden:challenge-history/submission-archetypes.md |
| codec-bank | 0.620 | garden:frontiers/byte-allocation-beats-average-bit-width.md<br>garden:frontiers/entropy-friendly-model-structure.md<br>garden:frontiers/learned-weight-codecs-and-compressible-training.md |
| artifact-native | 0.280 | garden:frontiers/learned-weight-codecs-and-compressible-training.md<br>garden:moonshots/artifact-dropout.md<br>garden:moonshots/artifact-native-training.md |
| plain-zlib | 0.221 | garden:challenge-history/public-runs/four-hour-quasi10b-sp1024.md<br>garden:challenge-history/public-runs/naive-baseline.md<br>garden:challenge-history/submission-archetypes.md |

## Frontier strategies

| Strategy | effectivePrior | risk | hypothesis |
|---|---:|---|---|
| Int6 sliding MLP3x | 1.000 | medium | Fuse the strongest visible public motifs — int6-ish quantization, sliding-window evaluation, MLP-heavy capacity, and optimizer tuning — into one explicit frontier family. |
| Shared-depth RMS interface | 1.000 | medium | Combine the research-garden seam between shared depth, extra normalization, and tiny role-specific adaptation into a compression-aware recurrent interface. |
| Global codebook backbone | 1.000 | high | Exploit recurrence twice: once in the architecture and once in the codec, amortizing storage through a shared codebook bank rather than per-tensor compression alone. |
| Tokenizer head swap | 0.815 | high | Trade a more aggressive tokenizer/vocabulary move against a compressed or regenerated output head, following the garden's tokenizer-head co-design lane. |
| Role-state recurrence | 0.783 | high | Specialize repeated depth through tiny persistent role state instead of storing more unique layers, borrowing the garden's role-state recurrence moonshot. |
| Artifact-native TTT | 0.695 | high | Lean into evaluation-time compute and artifact-native training ideas: store less, adapt more at evaluation, and let compute stand in for artifact bytes. |

## Search procedure notes

- The research garden is being used as a semantic prior over architecture families, not as a source of claimed results.
- The unofficial leaderboard is being used as public frontier signal, especially around quantization, sliding-window eval, optimizer tuning, and tokenizer/head tradeoffs.
- Fork Tales influence here is procedural: treat prior art as a graph of motifs, strategies, and evidence, then bias search through cluster-level synthesis rather than isolated knobs.
