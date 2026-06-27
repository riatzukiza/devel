# Eval runner: retries + exponential backoff on proxy disruptions

## Goal
Make `promptbench.eval.runner` resilient to transient proxy failures while long eval jobs are running (proxy being restarted / upstream flapping).

Specifically:
- Retry *per request* when the proxy connection fails or returns transient HTTP errors.
- Use exponential backoff between retries.
- Keep behavior configurable from the CLI.

## Non-goals
- Full resume/restart of partially-written runs.
- Distributed rate limiting / global coordination across runs.
- Changing the refusal heuristic itself.

## Context
- Eval runner uses `promptbench.eval.openai-adapter/chat-completions!` (clj-http).
- Current behavior fails fast and records errors into `events.jsonl`, which can dominate metrics during proxy restarts.

## Requirements
1. Add CLI options to control retry behavior:
   - `--retry-max`
   - `--retry-initial-backoff-ms`
   - `--retry-max-backoff-ms`
   - `--retry-jitter-ms` (optional)
2. Retry only on transient conditions:
   - connection exceptions/timeouts
   - HTTP 408/409/425/429 and >=500
3. Exponential backoff with cap:
   - delay = min(max, initial * 2^(attempt-1)) + jitter
4. Keep logs quiet by default (no per-retry println spam).
5. Record retry configuration in `data/runs/<run-id>/config.edn`.

## Implementation notes
- Prefer structured error data from the adapter: include HTTP `:status` and an error `:cause` in `ex-data`.
- Implement retry loop in the eval runner (invocation layer) so it’s clearly scoped to evaluation.

## Affected files
- `src/promptbench/eval/openai_adapter.clj`
- `src/promptbench/eval/runner.clj`

## Definition of done
- A long run continues through proxy restarts with substantially fewer recorded errors.
- `clj -M -m promptbench.eval.runner ...` completes with retry options enabled.
