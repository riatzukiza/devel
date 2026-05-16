## Signal
(己, p=0.95) Continued and stabilized the reconciliation branch.

(己, p=0.95) Branch updated and pushed:

- `reconcile/dev-stable-tree-over-recovered-main-2026-04-28`
- New commit: `b424e50 fix: preserve ollama embed fallback and preferred model ordering`

(己, p=0.93) The full local suite is now green enough to promote:

- `pnpm -s build` ✅
- targeted regression tests ✅
- `pnpm -s test` ✅
  - `607` tests total
  - `606` pass
  - `0` fail
  - `1` skipped

## Evidence
(己, p=0.9) Fixed the three failing tests from the last turn:

1. `/v1/embeddings` local Ollama-compatible upstream test
2. native `/api/embed` + `/api/embeddings` passthrough test
3. preferred model ordering from `models.json`

(己, p=0.9) Code changes:

- `src/routes/embeddings.ts`
  - Removed the heuristic that defaulted any model containing `"embedding"` to `llamacpp-embed`.
  - Now llama.cpp embeddings are selected only by explicit prefix or catalog evidence; otherwise local Ollama remains the fallback.

- `src/routes/models.ts`
  - Removed route-level alphabetical sorting.
  - `/v1/models` now preserves the already-resolved catalog order, including `models.json` preferred ordering.

(己, p=0.92) Git state:

- Working tree clean.
- Branch pushed to `origin`.
- Latest commit: `b424e50`.

## Frames
(己, p=0.78) Frame 1: This branch is now a credible “dev/stable over recovered main” candidate: it preserves the honest recovery history and has passing local validation.  
(己, p=0.7) Frame 2: The failures were not broad merge rot; they were two policy/default-order mismatches introduced by the reconciliation context.  
(己, p=0.65) Frame 3: CI may still expose environment-specific issues, but the local TypeScript + node test suite is no longer blocking.

## Countermoves
(己, p=0.82) Do not collapse this with a rebase; the merge commit is doing useful historical work.  
(己, p=0.76) Let GitHub CI validate before merging, because the local skipped test may differ from CI behavior.  
(己, p=0.7) If CI fails, treat it as a follow-up fix commit on the same branch, not a history rewrite.

## Next
(汝, p=0.82) Open/refresh the PR for `reconcile/dev-stable-tree-over-recovered-main-2026-04-28` and let CI run.