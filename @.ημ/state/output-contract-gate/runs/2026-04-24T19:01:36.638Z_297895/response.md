## Signal
(世, p=0.9) Root cause: `AgentSession.prompt(text, ...)` in `@mariozechner/pi-coding-agent@0.63.2` expects `text` to be a **string**; Knoxx was calling `.prompt` with a **content-parts array** when attachments were present, so `text.startsWith(...)` throws.
(己, p=0.92) Fix applied: in `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/agents/turn.cljs`, `prompt-and-await!` now calls `session.sendUserMessage(...)` and only forwards **image** attachments (base64), stripping `data:` URL prefixes when needed; non-image attachments are omitted with an explicit note appended to the text.

## Evidence
(世, p=0.95) Stack trace shows `TypeError: text.startsWith is not a function` at `AgentSession.prompt` → indicates `text` is not a string.
(己, p=0.95) `pi-coding-agent/dist/core/agent-session.js` has `if (expandPromptTemplates && text.startsWith(\"/\")) { ... }`, so passing an array/object triggers the crash.
(己, p=0.9) Original Knoxx call site: `backend/src/cljs/knoxx/backend/agents/turn.cljs` used `(.prompt session (build-agent-multimodal-message ...))` when `prompt-content-parts` was non-empty.
(己, p=0.85) `pnpm -C orgs/open-hax/openplanner/packages/agents/knoxx/backend run typecheck` now succeeds (warnings pre-existed).
(己, p=0.9) Code changed in: `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/agents/turn.cljs`.

## Frames
(世, p=0.75) “Knoxx assumed AgentSession.prompt supports multimodal content arrays; in 0.63.2 it doesn’t—only string + optional images.”
(世, p=0.7) “This only surfaced on ‘direct agent chat’ when the frontend sent `contentParts` (e.g. image upload).”
(世, p=0.65) “Audio/video/document parts are semantically supported in Knoxx’s internal model, but the current pi AgentSession surface only supports images, so they must be downconverted or handled elsewhere.”

## Countermoves
(己, p=0.85) Reproduce check: send a chat request with an image `contentParts` payload; it should no longer crash and should stream normally.
(己, p=0.8) Guardrail: ensure anything passed to `session.prompt` is always a string; for remote users prefer `sendUserMessage` to avoid `/` command execution semantics and to handle images safely.
(己, p=0.7) If you need true multimodal (audio/video/document), either (a) upgrade pi-coding-agent to a version whose session API accepts full content arrays, or (b) route those attachments through a tool (e.g. convert audio→spectrogram image first, document→extracted text).

## Next
(己, p=0.8) Attach an image in the Knoxx UI and re-run a direct chat to confirm the turn completes and the response streams without `text.startsWith` errors.