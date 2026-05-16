## Signal
(己, p=0.86) If you need **Gemma 4 audio** (i.e., sending audio inputs to the model) then yes: you will almost certainly need a **custom fork (or upstreamable patch) of `@mariozechner/pi-coding-agent`**, because the current Pi message/content pipeline is effectively “text + image” oriented, and your Knoxx runtime is using that SDK.

(己, p=0.78) There are two distinct changes you’re talking about, and they live at different layers:
- (1) **Provider/transport support**: the SDK must be able to serialize and send `audio` content parts to whichever API you’re using for Gemma 4.
- (2) **Agent/runtime ergonomics**: tools/extensions (receipt river, session mycology, etc.) are orthogonal; they don’t solve multimodal IO. They can stay as-is once the core SDK can actually carry audio through.

## Evidence
(己, p=0.8) Your Knoxx backend uses the Pi SDK `createAgentSession(...)`, so it inherits the SDK’s supported input modalities and serialization constraints.  
(世, p=0.7) In the Knoxx codebase you already have comments like “pi-coding-agent … only accepts text/image input kinds” (suggesting the limitation is acknowledged in-repo).  
(己, p=0.72) Pi’s extension system can add tools and intercept calls, but it can’t magically make the underlying provider accept new content types if the SDK refuses/strips them or the provider adapter doesn’t serialize them.

## Frames
(己, p=0.72) Frame 1 (most likely): The SDK hard-codes/validates message parts as `{type: "text"|"image" ...}`; adding audio requires touching **types + validation + provider payload building**.  
(己, p=0.64) Frame 2: The SDK might accept generic “content parts” but the **provider adapter** (OpenAI-style vs Anthropic-style vs Google/Gemini-style) only maps through images; audio needs a new mapping branch.  
(己, p=0.58) Frame 3: “Gemma 4 audio” might actually mean *audio transcription first, then text to Gemma*; in that case you don’t need SDK audio support—you need a **tool-side transcription step** (but you explicitly said “Pi only supports images”, so you’re likely aiming for true multimodal audio-in).

## Countermoves
(己, p=0.83) Clarify the API target before forking: (ctx, p=0.78) `Gemma 4` is commonly served via different gateways; “audio support” is not a single universal interface. If the upstream endpoint doesn’t accept audio the same way Gemini does, you could fork the SDK and still get stuck.  
(己, p=0.8) Minimize fork surface: implement audio as a **third content part type** (`{type:"audio", ...}`) that is ignored by providers that can’t handle it, but passed through when provider is Gemma4-capable. This keeps your fork closer to upstream and reduces long-term pain.

## Next
(己, p=0.85) Tell me which exact provider/API Knoxx uses to call “Gemma 4” (endpoint + payload style: OpenAI Responses-compatible? Google/Gemini native? something else), and I’ll map the minimal patch points in `pi-coding-agent` (types + serializer + provider adapter) needed to carry `audio` parts end-to-end.