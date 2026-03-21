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

Voxx also now carries a backend-agnostic sports-commentator postprocess profile by default, so any provider voice can be pushed toward the same high-energy broadcast texture:

```bash
TTS_POSTPROCESS_ENABLED=1
TTS_POSTPROCESS_PROFILE=sports-commentator-v1
```

Disable it with `TTS_POSTPROCESS_ENABLED=0` if you want the raw upstream voice back.

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
