## Signal

(己, p=0.99) Tested every Voxx TTS provider path.

(世, p=0.98) Current Voxx backend order was restored to:

```text
kokoro,melo,espeak
```

(世, p=0.98) Voxx is healthy after testing:

```json
{"ok":true,"service":"voxx","requires_api_key":true,"model_count":9,"tts_queue":{"active":0,"waiting":0,"max_concurrent":1,"max_pending":32,"timeout_seconds":120.0}}
```

(己, p=0.98) Receipt committed:

- `/home/err/devel`: `9b974dc9 Record Voxx provider smoke tests`

## Evidence

(己, p=0.98) Single-provider smoke results:

| Provider | HTTP | Backend header | Result |
|---|---:|---|---|
| `kokoro` | 200 | `kokoro` | works |
| `xiaomi_mimo` | 200 | `xiaomi_mimo` | works |
| `requesty` | 503 | none | provider returned upstream `402` |
| `openai` | 503 | none | not configured |
| `melo` | 503 | none | unavailable / package not installed |
| `espeak` | 200 | `espeak` | works |

(己, p=0.98) Fallback-order smoke results:

| Backend order | HTTP | Backend used | Result |
|---|---:|---|---|
| `requesty,kokoro,melo,espeak` | 200 | `kokoro` | requesty failed with quota/payment status, then fell back locally |
| `openai,kokoro,melo,espeak` | 200 | `kokoro` | openai not configured, then fell back locally |
| `xiaomi_mimo,kokoro,melo,espeak` | 200 | `xiaomi_mimo` | Xiaomi worked first try |

(世, p=0.95) Provider credential presence, without exposing secrets:

```text
XIAOMI_MIMO_API_KEY=unset
XAIOMI_MIMO_API_KEY=set
REQUESTY_API_TOKEN=set
OPENAI_API_KEY=unset
KOKORO_API_KEY=unset
```

## Frames

(己, p=0.95) Xiaomi MiMo is currently usable through the legacy typo env var `XAIOMI_MIMO_API_KEY`; Voxx still recognizes it.

(己, p=0.94) Requesty is configured but currently not usable for this TTS request because the upstream returned `402`. The fallback behavior works when Kokoro follows it.

(己, p=0.94) Local reliable providers right now are `kokoro` and `espeak`; `melo` is only a configured fallback slot but not installed/available in the Voxx container.

## Countermoves

(己, p=0.98) I did not print API keys or token values.

(己, p=0.98) I restored the service after testing, so it is not left pinned to a remote provider.

(己, p=0.92) Recommended runtime order if you want to use Xiaomi free TTS opportunistically:

```bash
VOICE_GATEWAY_TTS_BACKEND_ORDER=xiaomi_mimo,kokoro,melo,espeak
```

That uses Xiaomi while it works, then degrades locally.

## Next

(汝, p=0.86) If you want, I can make `xiaomi_mimo,kokoro,melo,espeak` the persistent default in `services/voxx/compose.yaml` now.