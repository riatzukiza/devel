# Spec: Backend Coverage Reporting

## Prompt
User request: “set up coverage reporting” for existing backend behaviors.

## Code References
- `backend/src/fantasia/sim/core.clj:18-410` — world ticking pipeline and deterministic helper functions that need coverage measurement.
- `backend/src/fantasia/sim/myth.clj:3-41` — ledger decay + attribution math already under test.
- `backend/deps.edn:1-22` — alias definitions where test/coverage runners are configured.

## Existing Issues / PRs
- None referenced.

## Definition of Done
1. Coverage runner alias exists (e.g., `clojure -M:coverage`) producing reports without manual flag juggling.
2. Running the alias executes current test suite and emits standard Cloverage outputs (HTML + summary) into a reproducible location (default `target/coverage`).
3. Documented command in summary / future contributor notes so the workflow is clear.

## Requirements & Notes
- Use `cloverage/cloverage` since it is the common OSS option for Clojure CLI projects.
- Keep configuration minimal but pin the library version for reproducibility.
- Ensure both `src` and `test` paths are provided; prefer namespace filters that cover `fantasia.*`.
- Running coverage should not mutate source files; rely on default report location.
