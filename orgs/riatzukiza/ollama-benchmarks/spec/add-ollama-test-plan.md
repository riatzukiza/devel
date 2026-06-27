# Add Ollama helper tests

## Code references
- `ollama.clj:64-100` – helpers parsed from the CLI plus the `ollama-chat` HTTP wrapper (focus lines 80-99 for `mean` and 86-101 for `md-table`).

## Requirements
- Create a small `clojure.test` namespace under `test/` that exercises the pure helper functions in `ollama.clj` so their behavior is captured and can be run via `clj -M:test`.

## Definition of done
- New test file exists at `test/ollama_test.clj`.
- Tests verify `ollama/mean` handles empty and numeric sequences and that `ollama/md-table` produces the expected markdown structure for a sample result.
- Running `clj -M:test` finishes without failures.

## Phases

### Phase 1: Investigate helper functions
- Confirm how `mean` and `md-table` are defined in `ollama.clj` so the tests know which inputs and outputs to validate.

### Phase 2: Implement tests
- Create `test/ollama_test.clj`, require `[clojure.test :refer :all]` and `[ollama :as ollama]`.
- Add `deftest` blocks covering `mean` (empty seq => nil, non-empty => average) and `md-table` (checks header and sanitized rows for multi-line prompts).
### Phase 3: Validate via test runner
- Run `clj -M:test` to ensure the new tests execute and pass in a clean environment.
