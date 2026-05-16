## Signal

(己, p=0.95) Voxx now has Xiaomi MiMo TTS working through the unified Voxx gateway, with ElevenLabs excluded from the default runtime order.

(己, p=0.95) Implemented and committed:

- Voxx submodule commit: `74b3601 add xiaomi mimo tts bridge`
- Root workspace commit: `62213643 wire voxx xiaomi mimo and kokoro runtime`

(己, p=0.9) Backend status through Voxx:

- `xiaomi_mimo`: working; default live backend.
- `kokoro`: working again through a non-root derived sidecar image.
- `espeak`: working fallback.
- `melo`: not working in the current compose image because the `melo` Python package is not installed; Voxx correctly returns unavailable/falls through.
- `elevenlabs`: intentionally skipped/excluded.

## Evidence

(己, p=0.98) Tests passed:

- `docker run --rm -v /home/err/devel/orgs/open-hax/voxx:/work -w /work openhax/voxx:compose sh -lc 'PYTHONPATH=src python -m pytest -q'`
- Result: `15 passed in 1.02s`

(己, p=0.95) Live Voxx header proof:

- Default synthesis returned:
  - `x-openhax-tts-backend: xiaomi_mimo`
- Forced Kokoro synthesis returned:
  - `x-openhax-tts-backend: kokoro`
- Forced eSpeak synthesis returned:
  - `x-openhax-tts-backend: espeak`

(己, p=0.9) Compose validated:

- `docker compose config` succeeded.
- `docker compose up --build -d` rebuilt and restarted Voxx/Kokoro.

(己, p=0.95) Receipt recorded in `/home/err/devel/receipts.edn`.

## Frames

(世, p=0.85) The important integration detail was that Xiaomi MiMo does not support `/v1/audio/speech` directly; Voxx now bridges OpenAI-style TTS requests into MiMo `/v1/chat/completions` with an `audio` response and decodes the returned base64 audio.

(世, p=0.8) The local env had typo-prefixed `XAIOMI_*` keys, so Voxx accepts both canonical `XIAOMI_*` and legacy `XAIOMI_*` names without exposing or rewriting secrets.

(世, p=0.8) Kokoro’s upstream image was not safe to run as arbitrary UID `1000:1000`; it needed a real passwd user plus preinstalled first-start dependencies, so the runtime now uses a derived non-root image.

## Countermoves

(己, p=0.9) I did not print or commit API keys.

(己, p=0.85) I did not stage unrelated workspace changes; only Voxx/source/runtime files plus the receipt and submodule pointer were committed.

(己, p=0.8) `services/voxx/docker-compose.yml` remains untracked and was not committed because it was outside the intended scoped changes.

## Next

(汝, p=0.9) Try one real voice call through your existing voice skill path and confirm the voice quality you want from `xiaomi_mimo` vs `kokoro`.