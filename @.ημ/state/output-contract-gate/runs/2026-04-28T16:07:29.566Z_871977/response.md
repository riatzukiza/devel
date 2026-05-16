## Signal
(己, p=0.86) The lag is very likely from **re-rendering + re-parsing markdown/embeds for every message on every streamed token**, because `updateMessageById` updates state via `setMessages(prev => prev.map(...))`, causing `ChatMessageList` to re-run its `messages.map(...)` render loop each tick and do expensive work inline.

(己, p=0.82) I shipped a frontend mitigation that **confines expensive work to the message that actually changes**:
- Extracted a `ChatMessageCard` component and wrapped it in `memo(...)`
- Moved heavy computations (`extractEmbedsFromMarkdown`, trace-block filtering, merged content parts) behind `useMemo(...)`
- Ensured `liveToolReceipts/liveToolEvents` props are **stable for non-streaming messages** (pass empty constants), so unrelated cards don’t re-render just because tool-stream arrays changed.

## Evidence
(己, p=0.95) Code change: `frontend/src/components/chat-page/ChatMessageList.tsx`
- Added `ChatMessageCard` (`memo`) + `useMemo` for embed parsing + trace block shaping.
- Passed `liveToolReceipts/liveToolEvents` only to the streaming assistant message; other messages get stable empty arrays.

(己, p=0.95) Commit: `7f900978` — `frontend: memoize ChatMessageList items to reduce streaming lag`

(己, p=0.7) Local `pnpm -C frontend typecheck` currently fails due to **pre-existing unrelated errors** (e.g. `useVoiceRecorder.ts` BlobPart typing, `ContractsPage.tsx` sidebar entry type). Nothing in the output implicated `ChatMessageList.tsx`.

## Frames
(己, p=0.78) Frame 1: “CPU-bound render thrash” — markdown parsing + embed extraction + trace-block slicing repeated across the entire transcript every token.
(己, p=0.72) Frame 2: “Prop churn defeats memoization” — live tool receipt arrays update frequently and can force re-render of unrelated rows unless props are stabilized.
(己, p=0.6) Frame 3: “DOM size / layout” — even with render fixes, very long transcripts can still be slow without virtualization (not addressed here).

## Countermoves
(己, p=0.76) If this still feels laggy: add React Profiler instrumentation and confirm whether time is in `Markdown` render, `extractEmbedsFromMarkdown`, or layout.
(己, p=0.7) If transcripts are long: implement list virtualization (e.g. react-window) so only visible messages mount/update.
(己, p=0.66) If streaming frequency is extreme: throttle UI updates further (you already buffer tokens to `requestAnimationFrame`, which is good).

## Next
(汝, p=0.8) Run the app, stream a long response, and capture a React Profiler trace to confirm only the streaming `ChatMessageCard` is re-rendering each tick.