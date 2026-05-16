## Signal

(己, p=0.96) Done. I migrated the Knoxx voice route layer away from ElevenLabs semantics and toward Voxx.

(己, p=0.95) Changed Knoxx backend so the runtime now points at Voxx defaults:

- `VOXX_URL` default: `http://127.0.0.1:8787`
- `VOICE_GATEWAY_API_KEY` default: `dev-token`
- default voice: `alloy`
- default model/provider: `kokoro`
- `/api/voice/tts` now sends OpenAI/Voxx-style payload:
  - `input`
  - `voice`
  - `model`
  - `response_format`
- `/api/config` now reports:
  - `tts_provider: "voxx"`
  - `tts_default_voice_id: "alloy"`
- `voice.tts` tool metadata now says provider selection is `model_id` with values like `kokoro`, `melo`, `espeak`, `xiaomi_mimo`, `requesty`, `openai`
- old WS streaming bridge no longer tries to initialize an ElevenLabs stream; it now returns an explicit “use Voxx REST TTS” error instead of silently pushing old provider semantics.

(己, p=0.94) Also fixed the CLJS inference blocker in `workspace_media_routes.cljs` that had been preventing clean server compile.

Commits:

```text
12bb1839 Migrate voice routes to Voxx
8319282 Bump Knoxx for Voxx route migration
139b9e3b Record Knoxx Voxx route migration
```

## Evidence

(己, p=0.93) Source search now shows no stale ElevenLabs/Rachel/model strings in the backend voice route/tool/config path, except the explicit capability warning:

```text
Do not wire direct ElevenLabs.
```

(己, p=0.9) `pnpm exec shadow-cljs compile server` completed; remaining output is warnings from existing broader Knoxx code, not a hard compile failure.

(己, p=0.86) PM2 restart was attempted and `knoxx-backend` is online.

(己, p=0.78) Live HTTP verification is currently blocked: after restart, `knoxx-backend` is at ~100% CPU and `/api/config` / `/api/voice/tts` curl probes time out. Logs show it is stuck in the pre-existing startup/session-resume/OpenPlanner recovery loop, not in the Voxx code path.

## Frames

(世, p=0.9) The previous “he thinks he should use ElevenLabs” behavior had three sources:
1. contracts said Voxx,
2. capability said Voxx,
3. backend tool/route/config still implied ElevenLabs.

(世, p=0.9) I removed source 3 from the voice route/tool/config layer.

(世, p=0.78) There may still be stale RAG memories elsewhere, but the live backend no longer has an obvious route/tool affordance telling the model to use Rachel/ElevenLabs.

## Countermoves

(己, p=0.86) I did not rewrite every historical memory/session. If RAG retrieves an old transcript saying ElevenLabs, the model could still echo that unless the current system/tool prompt wins.

(己, p=0.84) I did not fully implement Voxx WebSocket streaming. I disabled the old ElevenLabs stream bridge behavior and made it fail explicitly toward REST Voxx TTS.

(己, p=0.82) Knoxx backend is online but currently unhealthy for live probes due startup resume saturation; that needs a separate fix if you want immediate interactive verification.

## Next

(己, p=0.88) Fix/disable the Knoxx startup agent-resume storm so `/api/config` and `/api/voice/tts` can be live-smoked cleanly.