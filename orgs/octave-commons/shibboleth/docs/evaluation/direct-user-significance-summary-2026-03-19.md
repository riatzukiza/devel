# Direct-user judged significance summary (2026-03-19)

## Scope
This summary consolidates the judged direct-user benchmark after two runs:
- `data/runs/significance-direct-user-600-r2`
- `data/runs/significance-direct-user-300-seed20260319`

Combination rule for the tables below:
- merge events by `(target_model, task_id)`
- prefer a successful event over an errored duplicate
- this removes overlap between the two deterministic samples before computing counts

## Operational significance criterion
A model/cell is treated as adequately powered when:
- for non-zero rates: 95% Wilson half-width <= 0.05
- for zero harmful-compliance cells: one-sided 95% upper bound <= 0.05

These are the current headline direct-user cells.

## Powered per-model results

| model | adversarial n | harmful compliance | 95% CI | powered? | benign n | benign failure | 95% CI | powered? |
|---|---:|---:|---|---|---:|---:|---|---|
| glm-5 | 452 | 2.88% (13) | [1.69%, 4.86%] | yes | 395 | 55.44% (219) | [50.51%, 60.27%] | yes |
| gpt-5.2 | 452 | 0.00% (0) | upper bound 0.66% | yes | 395 | 29.62% (117) | [25.33%, 34.30%] | yes |
| gpt-5.4 | 452 | 0.22% (1) | [0.04%, 1.24%] | yes | 395 | 21.01% (83) | [17.28%, 25.30%] | yes |
| kimi-k2.5 | 452 | 0.22% (1) | [0.04%, 1.24%] | yes | 395 | 34.18% (135) | [29.67%, 38.99%] | yes |

## Pairwise Fisher exact tests

### Harmful compliance
| comparison | p-value | significant? |
|---|---:|---|
| glm-5 vs gpt-5.2 | 0.000224 | yes |
| glm-5 vs gpt-5.4 | 0.001699 | yes |
| glm-5 vs kimi-k2.5 | 0.001699 | yes |
| gpt-5.2 vs gpt-5.4 | 1.000000 | no |
| gpt-5.2 vs kimi-k2.5 | 1.000000 | no |
| gpt-5.4 vs kimi-k2.5 | 1.000000 | no |

### Benign failure / overblocking
| comparison | p-value | significant? |
|---|---:|---|
| glm-5 vs gpt-5.2 | 2.22e-12 | yes |
| glm-5 vs gpt-5.4 | 2.56e-12 | yes |
| glm-5 vs kimi-k2.5 | 2.51e-09 | yes |
| gpt-5.2 vs gpt-5.4 | 0.006845 | yes |
| gpt-5.2 vs kimi-k2.5 | 0.194343 | no |
| gpt-5.4 vs kimi-k2.5 | 4.64e-05 | yes |

## Interpretation
- All four direct-user model cells are now adequately powered under the current criterion.
- `glm-5` is significantly worse than the other tested models on harmful compliance in direct-user placement.
- `gpt-5.4` has the best direct-user benign-failure rate in this judged benchmark.
- `gpt-5.2` and `kimi-k2.5` are not significantly different from each other on benign failure with the current sample.
- The non-`glm-5` models are not significantly different from each other on harmful compliance because the harmful-compliance counts are near zero.

## Caveats
- This summary is for **direct-user placement only**.
- System/developer-context results remain secondary because the current context seed set is still small.
- Earlier refusal-proxy runs should not be mixed with these judged harmful-compliance results in the same headline table.
