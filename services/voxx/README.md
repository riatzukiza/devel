# voxx devops home

Canonical source: `../../orgs/open-hax/voxx`

This directory is the workspace-local home for runtime/devops material for `voxx`:
- Compose stack
- compose-only Dockerfile
- env example
- persistent runtime volume managed by Compose

## Local compose
```bash
cd /home/err/devel/services/voxx
docker compose up --build -d
curl http://127.0.0.1:8788/healthz
```

The compose default now binds Voxx to loopback (`127.0.0.1`) so it can sit behind a reverse proxy without exposing a raw public port. Override with `VOXX_BIND_HOST=0.0.0.0` only when you explicitly want direct network exposure.

For smarter TTS quality without changing Battlebussy away from `COMMENTARY_TTS_PROVIDER=voxx`, pass remote-provider creds straight into the compose runtime and let Voxx fall back automatically:

```bash
cd /home/err/devel/services/voxx
REQUESTY_API_TOKEN=... \
VOICE_GATEWAY_TTS_BACKEND_ORDER=requesty,melo,espeak \
docker compose up --build -d
```

When a premium ElevenLabs voice is ready later, add `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` and switch the order, for example:

```bash
VOICE_GATEWAY_TTS_BACKEND_ORDER=elevenlabs,requesty,melo,espeak
```

If port `8788` is busy:
```bash
VOXX_PORT=8798 docker compose up --build -d
```

## Source workflows
For source edits, work in `../../orgs/open-hax/voxx`.
