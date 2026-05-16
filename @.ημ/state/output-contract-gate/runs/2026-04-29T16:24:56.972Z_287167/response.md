## Signal

(己, p=0.9) Correct: **true Pi audio support through extensions alone is a stretch.**

(己, p=0.86) Extensions can probably fake or route around audio, but they do not cleanly solve the core problem: Pi’s agent message/content pipeline currently treats model input as text/images. If Gemma4 audio should be a first-class model input, we need to patch the SDK and likely Proxx too.

(己, p=0.82) Extension-only options exist, but they are hacks:

| Approach | Works? | Why it’s limited |
|---|---:|---|
| Custom tool transcribes audio, returns text | Yes | Not native Gemma4 audio; loses direct audio reasoning |
| Custom tool calls Gemma4 with audio directly | Maybe | Bypasses normal Pi provider/session/model flow |
| `before_provider_request` mutates outbound payload | Maybe | Only if audio survives somewhere in context as a marker/path; brittle |
| Custom provider extension | Maybe | Still needs Pi to carry `audio` parts into provider serialization |
| First-class `{type: "audio"}` message parts | Correct fix | Requires SDK/core + provider + Proxx support |

## Evidence

(己, p=0.8) Pi extensions can register tools, intercept context/provider requests, and register providers, but they operate around the agent runtime. They don’t automatically expand the canonical content-part model.

(己, p=0.78) For real audio support, the data has to survive all of these layers:

```text
Knoxx upload / voice artifact
  -> agent message content
  -> session persistence
  -> context construction
  -> provider request serialization
  -> Proxx request schema/routing
  -> upstream Gemma4/Gemini-compatible endpoint
```

(己, p=0.84) If any layer only permits `text | image`, then extension-level audio becomes a side-channel rather than proper model input.

## Frames

(己, p=0.78) Frame 1: “Extension workaround.”  
We can ship an `audio_query` tool that sends audio to Proxx/Gemma4 itself and returns text. This is fastest, but it is not Pi gaining audio support.

(己, p=0.74) Frame 2: “Provider-request hack.”  
An extension could detect a magic marker like `eta-mu-audio://...` in the prompt, read the file, and rewrite the outgoing provider payload in `before_provider_request`. This might work in a tightly controlled Knoxx path, but it’s fragile and model/provider-specific.

(己, p=0.88) Frame 3: “Real eta-mu fork.”  
Patch the absorbed Pi SDK so `audio` becomes a legitimate content part. Then Proxx and Knoxx can treat audio like images: stored, replayable, inspectable, auditable.

## Countermoves

(己, p=0.83) Don’t overfit to extensions here. Receipt River, Session Mycology, OPMF prompts, and contract runtime are excellent extension/package defaults. **Audio modality is core transport semantics**, not just runtime decoration.

(己, p=0.8) Don’t start with a giant rebrand patch. Start with the smallest vertical slice:

```ts
type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; ... }
  | { type: "audio"; source: AudioSource; mimeType: string };
```

Then wire that through one provider path and one Proxx route.

(己, p=0.76) Keep the extension workaround as a fallback. If first-class audio takes longer, an `eta_mu_audio_query` tool can prove value early without pretending it is the final architecture.

## Next

(己, p=0.9) Define the first-class `audio` content-part shape for eta-mu/pi and map exactly where it must pass through SDK, Proxx, and Knoxx.