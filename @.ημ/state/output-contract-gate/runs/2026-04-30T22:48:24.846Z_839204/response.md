## Signal

(己, p=0.99) Yes. Voxx still lets you select a specific TTS provider per request.

(己, p=0.95) The request’s `model` field can name a provider, for example:

```bash
curl -X POST 'http://127.0.0.1:8787/v1/audio/speech' \
  -H 'Authorization: Bearer dev-token' \
  -H 'Content-Type: application/json' \
  --data '{
    "model": "melo",
    "voice": "alloy",
    "input": "This should render with Melo if available.",
    "response_format": "mp3"
  }' \
  --output /tmp/voxx-melo.mp3
```

(己, p=0.9) You can also keep the runtime fallback order as the default path:

```text
VOICE_GATEWAY_TTS_BACKEND_ORDER=kokoro,melo,espeak
```

Then:
- `model: "kokoro"` asks for Kokoro
- `model: "melo"` asks for Melo
- `model: "espeak"` asks for eSpeak
- remote providers like `xiaomi_mimo`, `requesty`, or `openai` can be requested if configured

(己, p=0.86) If the requested provider fails and fallback behavior is enabled by the backend logic/config, Voxx can still degrade through the configured order rather than making callers bypass Voxx.

## Evidence

(己, p=0.94) During smoke tests, provider-specific calls worked this way:
- `kokoro` → `200`, backend header `kokoro`
- `melo` → now validated `200`, backend header `melo`
- `espeak` → `200`, backend header `espeak`
- `xiaomi_mimo` → `200`, backend header `xiaomi_mimo`
- `requesty` → reached provider but returned upstream `402`
- `openai` → not configured

(己, p=0.99) The response header to confirm actual provider is:

```text
x-openhax-tts-backend: <provider>
```

## Frames

(世, p=0.9) There are two useful modes:
1. “Pick exactly this provider”: set `model` to that provider.
2. “Use the safe local chain”: leave/default to the configured order like `kokoro,melo,espeak`.

(世, p=0.83) Provider selection is still mediated by Voxx; agents should not call Kokoro/Melo/eSpeak directly.

(世, p=0.82) The `voice` field may be interpreted differently per provider; `alloy` is accepted as a compatibility/default voice name, but some providers expose their own voices.

## Countermoves

(己, p=0.86) If you need strict “no fallback, fail if this provider fails” semantics, we should verify whether the current code treats `model: "melo"` as exclusive or as preferred-with-fallback. The backend header confirms what actually happened.

(己, p=0.88) For tests/scripts, always inspect `x-openhax-tts-backend`; HTTP 200 alone does not prove which provider rendered the audio.

## Next

(己, p=0.95) Run one provider-specific curl and check `x-openhax-tts-backend`.