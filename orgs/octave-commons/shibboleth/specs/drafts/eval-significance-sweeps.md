# Eval significance sweeps

## Goal
Drive the judged benchmark to statistically defensible model-level results by:
- defining explicit significance / precision criteria
- fixing metric semantics that currently blur refusal vs benign success
- adding reproducible confidence-interval / pairwise-comparison reporting
- rerunning judged sweeps until the primary cells are adequately powered

## Why this is needed
Current judged runs are directionally useful but not yet publication-grade:
- some runs are incomplete (`zeroasr-20260318-230952-developer-context` has no `metrics.edn`)
- raw events show `refused=true` can coexist with `benign_task_success=true`
- report helpers summarize counts but do not quantify uncertainty
- user asked to continue until every model has statistically significant results

## Proposed operational definition
Unless superseded by user instruction, treat “statistically significant results” as:

1. **Per-model precision requirement** for primary proportions
   - compute 95% Wilson intervals for:
     - harmful compliance rate on adversarial cases
     - benign failure / FPR on benign cases
   - a cell is considered adequately powered when either:
     - CI half-width <= 0.05, or
     - for zero harmful-compliance cells, the 95% upper bound <= 0.05

2. **Pairwise comparison requirement** for headline model comparisons
   - compute pairwise two-sided Fisher exact (or equivalent exact/binomial) tests on:
     - harmful compliance counts
     - benign failure counts
   - report p-values and whether the difference remains significant at alpha=0.05
   - if many pairwise comparisons are emitted, also report BH-FDR adjusted q-values

3. **Scope of headline claims**
   - direct-user results are primary
   - system/developer-context results are secondary until the context seed set is expanded beyond the current tiny prompt count

## Open questions
1. Is alpha=0.05 sufficient, or do we want stricter thresholds for the paper tables?
2. Should significance be based on exact tests, bootstrap intervals, or both?
3. For context-placement results, do we need cluster-aware/bootstrap resampling over repeated context prompts before making strong claims?

## Risks
- Running many judged cases is expensive and slow.
- Tiny context seed counts can create misleadingly narrow case-level intervals if repeated contexts are treated as iid.
- Malformed/incomplete JSONL from interrupted runs can poison analysis unless handled explicitly.

## Phases
### Phase 1 — semantics + stats tooling
- fix runner semantics so refusal implies benign task failure and not success
- add a stats/report helper that can:
  - load metrics / events robustly
  - compute Wilson intervals
  - compute pairwise p-values / q-values
  - print “adequately powered?” summaries
- add tests for the new semantics and stats helpers

### Phase 2 — rerun judged benchmarks to power target
- rerun the incomplete developer-context benchmark
- expand judged direct-user runs for all target models until primary cells meet the precision requirement
- rerun or defer context-placement sweeps depending on whether repeated-context limitations dominate

### Phase 3 — publishable reporting
- emit a consolidated significance report for the current judged benchmark set
- clearly separate:
  - judged harmful-compliance results
  - refusal-only historical proxy runs
  - incomplete / unsupported configurations

## Affected files
- `src/promptbench/eval/runner.clj`
- `src/promptbench/eval/report.clj`
- `src/promptbench/eval/stats.clj` (new)
- `test/promptbench/judges_test.clj`
- `test/promptbench/eval_stats_test.clj` (new)
- `data/runs/**` (new judged reruns)

## Definition of done
- The runner no longer records contradictory benign-success semantics.
- A significance helper can tell us which model/placement cells are adequately powered.
- Every headline direct-user model cell has judged metrics with 95% intervals meeting the precision target or an explicit upper-bound claim.
- The final report distinguishes powered, underpowered, and incomplete cells.
