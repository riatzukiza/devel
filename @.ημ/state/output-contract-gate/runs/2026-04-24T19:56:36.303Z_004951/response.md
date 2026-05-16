## Signal
(己, p=0.9) Implemented “Knoxx downloads images and converts them to base64” for agent runs, specifically to stop **`gemma4:31b` → 400 “invalid image input”** failures when content-parts contain remote URLs (Discord CDN, etc).

Changes are in the Knoxx backend:

1) **Materialize remote image URLs into `data:<mime>;base64,...`** before the model is ever called.
- Location: `backend/src/cljs/knoxx/backend/agents/turn.cljs`
- Behavior:
  - If a content part is `{:type "image" :url "https://..."}` (or legacy `:data` containing `http(s)://...`), Knoxx fetches it server-side and replaces it with `:data "data:image/...;base64,..."` (and drops `:url`).
  - Size guard: max 8MB per image (hard fail for bigger).
  - Only runs when the chosen model declares `:model/input` includes `:image` (uses `model-supports-input?`).

2) **Persist multimodal content parts for user messages too** so restored sessions can replay the true context.
- Location: `backend/src/cljs/knoxx/backend/agents/transcript.cljs`
- Change:
  - Previously only assistant messages preserved `:content-parts`. Now any session message (user/system/assistant) can persist content-parts (images, etc).

(己, p=0.95) Commit: `2d8cf7dc` — **“Knoxx: materialize remote images as base64 for agent runs”**.

## Evidence
(己, p=0.95) The Proxx failure mode you described matches the log pattern we can see in the service Proxx request logs:
- `services/proxx/data/request-logs.jsonl` entries with `model:"gemma4:31b"` + `status:400` + `error:"invalid image input"`.

(己, p=0.95) The fix is implemented here:
- `backend/src/cljs/knoxx/backend/agents/turn.cljs` (new fetch+base64 materialization step)
- `backend/src/cljs/knoxx/backend/agents/transcript.cljs` (persist content parts for non-assistant roles)

(己, p=0.9) Frontend tests still pass after the backend change:
- `pnpm -C frontend test` ✅

## Frames
(己, p=0.6) This is primarily a **provider-compat fix**: some upstreams reject remote image URLs and require base64; Knoxx now normalizes inputs into that stricter format.
(己, p=0.6) This is also an **observability / replayability fix**: if we don’t store multimodal inputs on the user side, restored sessions can’t be faithful, and OpenPlanner indexing will always be incomplete.
(己, p=0.55) This is a **data hygiene fix**: prevents the “URL treated as base64” class of bugs from poisoning model requests.

## Countermoves
(己, p=0.65) This does **not yet guarantee** that *everything in the live run* (full prompt transcript, full tool I/O, etc.) is written to OpenPlanner events; it guarantees the **multimodal inputs are now representable and persistable** in the session state, which is prerequisite to making OpenPlanner the full truth source.
(己, p=0.6) The 8MB/image limit may block some Discord uploads; if you want “always store everything”, we’ll need either:
- a bigger limit + OpenPlanner ingestion tuning, or
- an OpenPlanner “blob/document” side-channel with event pointers.

## Next
(己, p=0.8) Restart Knoxx (or trigger an event-agent job) and confirm Proxx logs no longer show `gemma4:31b ... 400 invalid image input`; if you paste one failing Proxx request-log line after this commit, I’ll trace exactly which part is still malformed.