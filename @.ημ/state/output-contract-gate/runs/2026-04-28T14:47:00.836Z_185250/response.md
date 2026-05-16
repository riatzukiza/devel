## Signal
(己, p=0.86) The “double the first token” symptom is consistent with a provider sending **cumulative text-so-far** in fields named `text_delta` / `reasoning_delta` (misnamed), while `stream.cljs` was treating them as **incremental** deltas and blindly appending → duplicated leading token(s).

(己, p=0.9) I patched `@backend/src/cljs/knoxx/backend/agents/stream.cljs` to detect this case and diff it:

- Added `emit-progress-text!`: given a **cumulative** `full-text`, compute `diff-appended-text` vs the last seen text, emit only the appended delta, then reset last-text to the cumulative value.
- In `handle-message-update!`, for `assistantMessageEvent.type == "text_delta"` and for reasoning-ish event types, if the incoming payload **starts with** what we’ve already emitted, treat it as cumulative and call `emit-progress-text!` instead of emitting the raw delta.

Commit:
- `fix(stream): avoid duplicated leading tokens for cumulative deltas`

## Evidence
(己, p=0.8) The original handler path was:

- `"text_delta"` → `(emit-text-delta-with-think-tags! state delta)` → `(emit-streaming-delta! ... delta)` → `(swap! last-assistant-text* str delta)`

This is correct only if `delta` is truly incremental. If it’s cumulative (prefix includes already-emitted text), you get duplication.

(己, p=0.85) Patch location:
- `backend/src/cljs/knoxx/backend/agents/stream.cljs`
  - new helper: `emit-progress-text!`
  - updated branches in `handle-message-update!` for `"text_delta"` and reasoning deltas.

## Frames
(世, p=0.75) Provider semantics mismatch: `delta` is actually “message so far”.
(己, p=0.65) Mixed event stream: sometimes true incremental deltas, sometimes cumulative snapshots; needs a heuristic.
(己, p=0.5) Frontend duplication: UI might also be concatenating cumulative updates (but your callout to `stream.cljs` makes backend more likely).

## Countermoves
(己, p=0.8) If you still see duplication: log the raw `assistantMessageEvent` payloads for a single run and check whether `delta` values are cumulative (monotonically growing) or incremental (small fragments). The heuristic I used only flips to cumulative mode when `delta` starts with `last-text`.
(己, p=0.7) If the provider sometimes sends cumulative chunks that *don’t* start with last-text (e.g. whitespace normalization, trimming), we may need to switch from `starts-with?` to an overlap-based heuristic (use `diff-appended-text` overlap path + an acceptance threshold).

## Next
(己, p=0.82) Reproduce one streaming run that shows the doubled-first-token behavior and paste 2–3 consecutive `assistantMessageEvent` JSON blobs (or add a temporary log) so we can confirm whether they’re cumulative and tune the heuristic if needed.