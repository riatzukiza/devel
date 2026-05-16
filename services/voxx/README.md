# voxx devops home

Canonical source: `../../orgs/open-hax/voxx`

This directory is the workspace-local home for runtime/devops material for `voxx`:
- canonical runtime Compose stack (`compose.yaml`)
- Kokoro sidecar Dockerfile (`Dockerfile.kokoro`)
- env example
- persistent runtime volume managed by Compose

The Voxx application image Dockerfile is not duplicated here. `compose.yaml` builds it from the source package at `../../orgs/open-hax/voxx/Dockerfile.compose`.

## Local compose
```bash
cd /home/err/devel/services/voxx
docker compose up --build -d
curl http://127.0.0.1:8787/healthz
```

The compose default now binds Voxx to loopback (`127.0.0.1`) so it can sit behind a reverse proxy without exposing a raw public port. Override with `VOXX_BIND_HOST=0.0.0.0` only when you explicitly want direct network exposure.

For smarter TTS quality without changing callers away from Voxx, pass remote-provider creds straight into the compose runtime and let Voxx fall back automatically. The current runtime default is Xiaomi MiMo first, then Kokoro as the one local voice fallback. eSpeak and MeloTTS are opt-in only so robotic fallback never silently ships. MeloTTS is installed in the Voxx image for explicit tests, but is not in the default provider order because its warm system-memory footprint is larger than Kokoro's on this host.

```bash
cd /home/err/devel/services/voxx
XIAOMI_MIMO_API_BASE_URL=https://api.xiaomimimo.com/v1 \
XIAOMI_MIMO_API_KEY=... \
VOICE_GATEWAY_TTS_BACKEND_ORDER=xiaomi_mimo,kokoro \
docker compose up --build -d
```

Xiaomi MiMo also accepts the legacy typo-prefixed env names `XAIOMI_MIMO_API_BASE_URL` and `XAIOMI_MIMO_API_KEY` so existing local env files keep working while callers migrate to `XIAOMI_*`.

Kokoro runs as a non-root derived image (`Dockerfile.kokoro`) using the upstream CPU PyTorch runtime. Its `/var/lib/kokoro` cache is a named Compose volume so the ~320 MB Kokoro model is downloaded once and reused across restarts.

MeloTTS runs inside the Voxx application container when explicitly selected with `VOICE_GATEWAY_TTS_BACKEND_ORDER=melo`. The source `Dockerfile.compose` installs Python 3.11, CPU PyTorch/Torchaudio, MeloTTS from GitHub, UniDic, and NLTK assets needed by `melo.api.TTS`, but Melo is intentionally not part of the default local fallback path.

Voxx STT/Whisper is gated off by default with `VOICE_GATEWAY_STT_ENABLED=0`. Use the host Knoxx NPU STT service on `http://127.0.0.1:8010` for transcription. Set `VOICE_GATEWAY_STT_ENABLED=1` only for an explicit local Voxx STT test.

The compose runtime is CPU-only by default and pins both containers to host CPUs `2-21` (`VOXX_CPUSET=2-21`) so CPUs 0-1 remain available for the host. Kokoro is configured with `KOKORO_LANG_CODE=a` by default to warm only the American voice pipeline and reduce memory pressure; Japanese (`j`) and Mandarin (`z`) pipelines are created on demand for routed segments. The current Kokoro default is the energetic American female voice `af_jessica` at `VOICE_GATEWAY_TTS_DEFAULT_SPEED=1.15` with minimal provider-side shaping. Voxx also enables a conservative TTS queue (`TTS_QUEUE_MAX_CONCURRENT=1`, `TTS_QUEUE_MAX_PENDING=32`, `TTS_QUEUE_TIMEOUT_SECONDS=120`) to prevent agent bursts from spawning unbounded synthesis work.

Kokoro requests are language-routed inside Voxx before final postprocess/mastering. Latin/English segments use the requested compatible English voice or `KOKORO_TTS_VOICE=af_jessica`; Japanese/kana or Japanese-hinted CJK segments use `KOKORO_TTS_JA_VOICE=jf_alpha`; Chinese-hinted or simplified-Chinese CJK segments use `KOKORO_TTS_ZH_VOICE=zf_xiaoxiao`. Mixed text is synthesized per segment, concatenated with ffmpeg in the Voxx container, and returned with `x-openhax-tts-language-segments` so callers can verify routing. eSpeak remains opt-in diagnostic only, never a silent multilingual fallback.

Voxx carries backend-agnostic postprocess profiles by default, so any provider voice can be pushed toward a consistent mastered texture:

```bash
TTS_POSTPROCESS_ENABLED=1
TTS_POSTPROCESS_PROFILE=sports-commentator-v1
```

Profiles can also be selected per request, without restarting the stack:

```bash
curl -X POST 'http://127.0.0.1:8787/v1/audio/speech?postprocess_profile=radio&prompt_aware=1' \
  -H "Authorization: Bearer ${VOICE_GATEWAY_API_KEY:-dev-token}" \
  -H 'Content-Type: application/json' \
  --data '{"model":"kokoro","voice":"alloy","input":"[excited] Local Voxx is alive!","response_format":"mp3"}' \
  --output /tmp/voxx-radio.mp3
```

Available profile aliases: `sports`, `broadcast`, `narrator`, `radio`, `soft`, and the opt-in expressive `sutured` / `autotune` profile; list the full catalog at `GET /v1/audio/postprocess-profiles`. Disable final mastering globally with `TTS_POSTPROCESS_ENABLED=0` or per request with `?postprocess=off`.

To force Melo for a single validation run without changing callers:

```bash
cd /home/err/devel/services/voxx
VOICE_GATEWAY_TTS_BACKEND_ORDER=melo docker compose up -d --no-build voxx
curl -X POST 'http://127.0.0.1:8787/v1/audio/speech?postprocess=off' \
  -H "Authorization: Bearer ${VOICE_GATEWAY_API_KEY:-dev-token}" \
  -H 'Content-Type: application/json' \
  --data '{"model":"kokoro","voice":"alloy","input":"Melo local fallback check.","response_format":"mp3"}' \
  --output /tmp/voxx-melo.mp3
# restore stable local order afterward
VOICE_GATEWAY_TTS_BACKEND_ORDER=xiaomi_mimo,kokoro docker compose up -d --no-build voxx
```

Prompt-aware performance is enabled by default in the current Voxx source and can be set per request with `?prompt_aware=1` / JSON `"prompt_aware": true` or disabled with `prompt_aware=false`. Voxx consumes tags like `[excited]`, `[whisper]`, `[pause]`, `[dramatic]`, `[sing]`, `[stretch]`, `[glitch]`, `[suture]`, `[laugh]`, or `<break time="500ms" />` itself: the backend receives clean segment text, then Voxx stitches segments together with tag-driven inflection filters, explicit silence for pause/break tags, a short nonverbal laugh effect, and the final postprocess/mastering profile. Musical tags emit `performance_directive` logs with pitch/tempo ratios and contour labels under the request `render_id`.

If a request hits provider status-code failures such as quota/rate limit/auth/5xx, do not rewrite prompts for a new provider. Keep the caller pointed at Voxx and set the runtime backend order with the one local voice fallback, e.g. `VOICE_GATEWAY_TTS_BACKEND_ORDER=xiaomi_mimo,kokoro`. Add `espeak` only for an explicit tiny-fallback diagnostic run.

If port `8788` is busy:
```bash
VOXX_PORT=8798 docker compose up --build -d
```

## Deploys from source-repo `main`

The source repo now carries a GitHub Actions pipeline at:

- `orgs/open-hax/voxx/.github/workflows/voxx-main.yml`

That pipeline publishes a GHCR image and, on successful `main` pushes, updates this runtime by SSH.

Operational contract on the host:
- keep runtime secrets in `services/voxx/.env`
- let CI own `services/voxx/.env.deploy`
- `.env.deploy` pins `VOXX_IMAGE=ghcr.io/...:sha-<commit>` for the currently deployed build
- deploy step runs `docker compose pull voxx && docker compose up -d --no-build voxx`

## Source workflows
For source edits, work in `../../orgs/open-hax/voxx`.
