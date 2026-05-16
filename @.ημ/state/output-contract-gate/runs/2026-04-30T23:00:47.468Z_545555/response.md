## Signal

(己, p=0.97) Short answer: **the contract/role/capability prompt path was clear, but the Knoxx backend tool runtime still had legacy ElevenLabs cues.**

(己, p=0.95) For `contracts/agents/ussyverse_social_creative.edn`, the agent receives clear Voxx instructions from:

- the agent contract itself
- `:role/creative-catalyst`
- `:cap/voice-synth`
- actor scope via `discord_automation`

(己, p=0.92) But your suspicion is valid: the stale “use ElevenLabs unless told otherwise” behavior was likely coming from the **Knoxx voice tool metadata/runtime**, not from the Ussyverse agent contract. Specifically, `backend/src/cljs/knoxx/backend/tools/voice.cljs` still had ElevenLabs defaults like:

- Rachel voice ID: `21m00Tcm4TlvDq8ikWAM`
- `eleven_multilingual_v2`
- `eleven_flash_v2_5`
- ElevenLabs-style prompt guidance
- ElevenLabs REST shape assumptions

(己, p=0.96) I patched that source layer so `voice.tts` now points agents toward Voxx semantics:

- default `voice_id`: `alloy`
- default `model_id`: `kokoro`
- `model_id` documented as per-request Voxx provider selector:
  - `kokoro`
  - `melo`
  - `espeak`
  - `xiaomi_mimo`
  - `requesty`
  - `openai`
- canonical request target normalized to `/v1/audio/speech`
- Bearer auth for Voxx
- tool registry now says Voxx, not ElevenLabs
- capability contract now explicitly explains per-request provider selection

Commits made:

```text
16a177a9 Align voice tool with Voxx provider selection
7d84826 Bump Knoxx for Voxx voice tool alignment
e258cc14 Record Knoxx Voxx voice alignment
```

## Evidence

(己, p=0.98) `ussyverse_social_creative.edn` already says:

```text
When you want to use your voice, use Voxx through skill:voice-tts, never a direct voice provider.
```

(己, p=0.97) `roles/creative_catalyst.edn` already says:

```text
For spoken audio artifacts, use Voxx through skill:voice-tts.
```

(己, p=0.97) `capabilities/cap_voice_synth.edn` already said:

```text
Prefer Voxx ... Do not wire direct ElevenLabs.
```

(己, p=0.95) The stale backend source was in:

```text
backend/src/cljs/knoxx/backend/tools/voice.cljs
backend/src/cljs/knoxx/backend/tools/registry.cljs
```

(己, p=0.92) Validation done:

```text
ok contracts/agents/ussyverse_social_creative.edn
ok contracts/capabilities/cap_voice_synth.edn
ok contracts/roles/creative_catalyst.edn
ok contracts/actors/discord_automation.edn
```

(己, p=0.83) Backend compile is still blocked by a pre-existing unrelated CLJS inference error in:

```text
backend/src/cljs/knoxx/backend/workspace_media_routes.cljs
```

So the source fix is committed, but if live Knoxx runs from built `dist`, it may need the existing compile blocker fixed before this reaches the running compiled artifact.

## Frames

(世, p=0.9) Likeliest cause was **tool-schema / runtime metadata contamination**, not the Ussyverse contract.

(世, p=0.78) Second plausible cause: RAG/session memory may still contain older “ElevenLabs” examples, but the direct repo evidence shows a concrete stale source in the backend tool layer.

(世, p=0.74) Third plausible cause: if an already-running Knoxx process has an older compiled bundle loaded, it will keep showing old tool descriptions until rebuilt/restarted.

## Countermoves

(己, p=0.9) I would not blame the agent persona first. The prompt says Voxx clearly; the available tool text was whispering “Rachel / ElevenLabs” at the same time.

(己, p=0.86) There is still legacy ElevenLabs material in `backend/src/cljs/knoxx/backend/voice_routes.cljs`, especially for `/api/voice/tts` and `/ws/voice/tts`. I did not fully rewrite that larger UI/route layer in this pass.

(己, p=0.82) If he is using `bash` + `tts.sh`, he should now be guided correctly. If he is using Knoxx `voice.tts`, the source is now corrected. If he is using the old `/api/voice/tts` route, that still needs a route-layer migration.

## Next

(己, p=0.9) Fix the remaining `voice_routes.cljs` ElevenLabs route layer, then resolve the compile blocker and rebuild/restart Knoxx so the live runtime cannot expose old ElevenLabs affordances.