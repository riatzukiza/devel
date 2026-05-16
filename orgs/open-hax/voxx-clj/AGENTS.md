# AGENTS.md — voxx-clj

Clojure rewrite of the Voxx voice gateway.

## Structure

```
src/voxx/
  config.clj         — Settings from env vars
  catalog.clj        — Voice profiles and model catalog
  auth.clj           — API key extraction/validation
  types.clj          — Core data types
  audio_utils.clj    — Audio format conversion via ffmpeg
  prompt_aware.clj   — Performance tag parsing and render plans
  tts.clj            — TTS engine with multiple backends
  stt.clj            — STT engine (whisper.cpp)
  transcripts.clj    — Transcript storage (JSON files)
  formatters.clj     — SRT/VTT/OpenAI response formatters
  queue.clj          — TTS processing queue
  service.clj        — VoiceGatewayService (wires everything)
  handler.clj        — Ring HTTP handlers
  main.clj           — Entry point
```

## Build

```bash
clojure -T:build uber
```

## Run

```bash
clojure -M:run
```

## Test

```bash
clojure -M:test
```
