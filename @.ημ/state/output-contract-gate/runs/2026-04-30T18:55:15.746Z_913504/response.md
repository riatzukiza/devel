## Signal

Implemented and restarted `services/voxx`.

(世, p=0.97) Voxx now supports per-request TTS API options:

- `postprocess_profile`
- `postprocess`
- `postprocess_enabled`
- `prompt_aware`
- `prompt_aware_style`

(世, p=0.96) Added postprocess profiles:

- `sports-commentator-v1` aliases: `sports`, `commentator`
- `broadcast-warm-v1` aliases: `broadcast`, `warm`
- `narrator-polish-v1` aliases: `narrator`, `polish`
- `crisp-radio-v1` aliases: `radio`, `crisp`
- `soft-studio-v1` aliases: `soft`, `studio`

(世, p=0.95) Added profile catalog API:

```bash
GET /v1/audio/postprocess-profiles
GET /v1/tts/postprocess-profiles
```

(世, p=0.95) Example usage:

```bash
curl -X POST 'http://127.0.0.1:8787/v1/audio/speech?postprocess_profile=radio&prompt_aware=1' \
  -H 'Authorization: Bearer dev-token' \
  -H 'Content-Type: application/json' \
  --data '{"model":"kokoro","voice":"alloy","input":"[excited] Voxx API check","response_format":"mp3"}' \
  --output out.mp3
```

(世, p=0.92) Updated voice skills/scripts:

- `~/.pi/agent/skills/voice-tts/SKILL.md`
- `~/.pi/agent/skills/voice-tts/tts.sh`
- `~/.pi/agent/skills/openutau-synthetic-vocals/SKILL.md`
- `~/.pi/agent/skills/autotune/SKILL.md`
- `~/devel/.agents/skills/list-voices/SKILL.md`
- `~/devel/.agents/skills/list-voices/agent-list-voices.sh`
- `~/devel/.agents/skills/autotune/SKILL.md`

(世, p=0.96) Restarted `services/voxx`; it is healthy on `127.0.0.1:8787`.

## Evidence

(世, p=0.98) Tests passed:

```bash
cd orgs/open-hax/voxx
PYTHONPATH=src uv run --with-requirements requirements.txt python -m pytest -q
# 21 passed
```

(世, p=0.96) Compile/shell checks passed:

```bash
bash -n ~/.pi/agent/skills/voice-tts/tts.sh ~/devel/.agents/skills/list-voices/agent-list-voices.sh
cd orgs/open-hax/voxx
PYTHONPATH=src uv run --with-requirements requirements.txt python -m compileall -q src
```

(世, p=0.96) Runtime checks passed:

```bash
curl http://127.0.0.1:8787/healthz
# {"ok":true,"service":"voxx","requires_api_key":true,"model_count":9}

curl -H 'Authorization: Bearer dev-token' \
  http://127.0.0.1:8787/v1/audio/postprocess-profiles
# returned all 5 profile IDs
```

(世, p=0.94) Live TTS check succeeded and returned headers:

```text
x-openhax-tts-backend: kokoro
x-openhax-tts-postprocess-profile: crisp-radio-v1
x-openhax-tts-prompt-aware: 1
```

(世, p=0.96) Commits made:

- `orgs/open-hax/voxx`: `7ac57dd Add per-request TTS postprocess options`
- `~/devel`: `4f84a1e5 Document Voxx postprocess API for voice skills`
- `~/.pi`: `fdfe5a1 Update voice skills for Voxx postprocess API`

## Frames

(汝, p=0.86) The API now supports both global defaults and per-request control, so callers can keep default sports mastering but opt into `radio`, `narrator`, `soft`, etc. request-by-request.

(汝, p=0.84) Prompt-aware mode is now a first-class API option, but provider behavior still matters: Xiaomi MiMo gets style-message instructions; OpenAI/Requesty get `instructions`; local Kokoro/Melo/eSpeak may still speak tags literally.

(汝, p=0.8) The voice skills now explain the new API and the helper scripts expose it directly, so agents do not need to remember raw query-string syntax.

## Countermoves

(世, p=0.88) Existing non-task workspace changes remain outside my path-scoped commits, including `orgs/open-hax/voxx/receipts.log` and broader `~/devel` / `~/.pi` state.

(世, p=0.82) I did not change the legacy `services/voxx/docker-compose.yml`; the active runtime uses `services/voxx/compose.yaml`, which Docker Compose selected and restarted.

(世, p=0.84) Prompt-aware tags with Kokoro are available at API level but not guaranteed semantically by Kokoro itself.

## Next

(己, p=0.94) Use `~/.pi/agent/skills/voice-tts/tts.sh --postprocess-profile radio --prompt-aware --text "[excited] ..."` for the new path.