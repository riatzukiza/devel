# @openhax/voxx-clj

Voxx voice gateway rewritten in Clojure. Drop-in replacement for the Python `voxx` service.

## What it provides

- **TTS** with multiple backends: Kokoro, Xiaomi MiMo, Requesty, OpenAI, espeak-ng
- **STT** via whisper.cpp (faster-whisper planned)
- **OpenAI-compatible** voice endpoints (`/v1/audio/speech`, `/v1/audio/transcriptions`, etc.)
- **Voxx voice catalog** and provider-style convenience endpoints
- **Prompt-aware rendering** with performance tags (`[excited]`, `[whisper]`, `<break time="500ms"/>`)
- **Audio postprocessing** with 6 broadcast/performance profiles
- **Concurrency-limited TTS queue** for stable multi-tenant operation

## Endpoint surface

### OpenAI-compatible
- `GET /v1/models`
- `POST /v1/audio/speech`
- `POST /v1/audio/transcriptions`
- `POST /v1/audio/translations`
- `GET /v1/audio/postprocess-profiles`

### Voxx voice catalog and provider-style routes
- `GET /v1/voices`
- `GET /v1/voices/search`
- `GET /v1/voices/:voice_id`
- `GET /v1/voices/:voice_id/settings`
- `POST /v1/text-to-speech/:voice_id`
- `POST /v1/text-to-speech/:voice_id/stream`
- `POST /v1/speech-to-text`
- `GET /v1/speech-to-text/transcripts/:transcription_id`

## Install

Requires Clojure CLI and JDK 17+:

```bash
# Install Clojure CLI (if not already installed)
curl -L -O https://github.com/clojure/brew-install/releases/latest/download/posix-install.sh
chmod +x posix-install.sh
sudo ./posix-install.sh
```

## Run

```bash
# Start the server
clojure -M:run

# Or with an alias
clojure -M -m voxx.main
```

## Build uber jar

```bash
clojure -T:build uber
java -jar target/voxx-standalone.jar
```

## Docker Compose

```bash
docker compose up --build -d
curl http://127.0.0.1:8788/healthz
```

Expected health payload:
```json
{"ok":true,"service":"voxx"}
```

## Environment variables

See `.env.example` for the complete list. Key variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_GATEWAY_PORT` | `8788` | Server port |
| `VOICE_GATEWAY_API_KEY` | (empty) | API key (empty = no auth) |
| `VOICE_GATEWAY_TTS_BACKEND_ORDER` | (auto) | Comma-separated backend priority |
| `KOKORO_TTS_VOICE` | `af_jessica` | Default Kokoro English voice |
| `KOKORO_TTS_JA_VOICE` | `jf_alpha` | Kokoro voice for Japanese-routed segments |
| `KOKORO_TTS_ZH_VOICE` | `zf_xiaoxiao` | Kokoro voice for Chinese-routed segments |
| `TTS_POSTPROCESS_ENABLED` | `true` | Enable audio postprocessing |
| `TTS_POSTPROCESS_PROFILE` | `sports-commentator-v1` | Default postprocess profile |
| `TTS_PROMPT_AWARE_DEFAULT` | `true` | Enable prompt-aware tag parsing |
| `VOICE_GATEWAY_STT_ENABLED` | `false` | Enable speech-to-text |

## Differences from Python version

- **No MeloTTS local backend** — Clojure version calls remote APIs only (kokoro, xiaomi_mimo, requesty, openai, espeak)
- **No WebSocket streaming** — REST-only in initial release (WebSocket TTS/STT planned)
- **No pydub** — Audio concatenation for prompt-aware and Kokoro multilingual per-segment synthesis uses ffmpeg
- **Same API surface** — All endpoints and response formats are identical
- **Same config names** — All environment variable names are preserved

## License

Same as the parent OpenHax project.
