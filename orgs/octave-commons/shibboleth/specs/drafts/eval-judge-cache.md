# Eval runner judge cache

## Goal
Avoid repaying identical LLM judge calls across repeated prompt-bench sweeps.

## Why
With the new task/context placement matrix, many repeated cases will trigger the same judge prompt for:
- harmful compliance
- benign task success

Without caching, LLM-rubric policies become unnecessarily expensive and slow.

## Requirements
1. Persistent cache on disk.
2. Deterministic cache key from:
   - judge policy
   - judge model
   - relevant prompt/response hashes
3. In-memory atom for current run.
4. Safe default location under `data/judge-cache/`.
5. Cache used only for LLM-rubric judge paths.

## Definition of done
- repeated runs reuse cached judge verdicts when inputs match
- runner still works if cache file is absent
- cache metadata is visible in config/output
