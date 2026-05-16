## Signal

(世, p=0.96) Knoxx is online, responsive again, and the migrated Voxx TTS route works.

(己, p=0.94) I did **not disable** the service. I tested it live, diagnosed the restart behavior, patched the startup recovery storm, rebuilt/restarted the backend, and verified TTS through Knoxx.

What was wrong after restart:

(世, p=0.91) Knoxx startup recovery was resuming many recent agent sessions with an unbounded `Promise.all`, which could launch a burst of recovered agent turns at once. That saturated the backend after restart and made HTTP probes time out even though PM2 showed the process as “online.”

What changed:

- Added bounded startup resume concurrency in:
  - `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/agent_resume.cljs`
- New limit:
  - `STARTUP_RESUME_CONCURRENCY = 2`
- Recovery is still active; it is just throttled so the HTTP/event loop stays usable.

Live route verification after the fix:

- `GET /api/config` returned Voxx config:
  - `tts_provider: "voxx"`
  - `tts_default_voice_id: "alloy"`
  - `tts_enabled: true`
- `GET /api/voice/tts/health` with a valid Knoxx user context returned `200`:
  - `provider: "voxx"`
  - `configured: true`
  - `reachable: true`
  - `default_model_id: "kokoro"`
- `POST /api/voice/tts` returned real audio:
  - status `200`
  - `content-type: audio/mpeg`
  - `x-openhax-tts-backend: kokoro`
  - `x-openhax-tts-postprocess-profile: sports-commentator-v1`
  - `x-openhax-tts-queue-max-concurrent: 1`
  - output file: MP3, `15692` bytes

Commits made:

- Knoxx submodule:
  - `31b87e53 Bound startup agent session recovery concurrency`
- OpenPlanner superrepo:
  - `526e972 Bump Knoxx for bounded session recovery`
- `/home/err/devel` superrepo:
  - `5e8799af Record OpenPlanner bounded Knoxx recovery bump`

## Evidence

(世, p=0.95) Compile passed:

```bash
cd orgs/open-hax/openplanner/packages/agents/knoxx/backend
pnpm exec shadow-cljs compile server
```

It completed with the known broader warnings already observed in Knoxx.

(世, p=0.96) PM2 after restart:

```text
knoxx-backend online
cpu 0%
```

(世, p=0.94) Config probe worked:

```bash
curl http://127.0.0.1:8000/api/config
```

Relevant output:

```json
"tts_provider": "voxx",
"tts_default_voice_id": "alloy",
"tts_enabled": true
```

(世, p=0.95) Health probe required a real Knoxx membership context. Invalid/no session produced expected auth failures:

```text
401 no_session
401 request_context_unresolved
403 Tool 'multimodal.upload' is required
```

Valid context:

```bash
curl -H 'x-knoxx-user-email: foamy125@gmail.com' \
  http://127.0.0.1:8000/api/voice/tts/health
```

Returned:

```json
{
  "provider": "voxx",
  "configured": true,
  "reachable": true,
  "status_code": 200,
  "default_voice_id": "alloy",
  "default_model_id": "kokoro"
}
```

(世, p=0.96) TTS route smoke:

```bash
curl -X POST http://127.0.0.1:8000/api/voice/tts \
  -H 'Content-Type: application/json' \
  -H 'x-knoxx-user-email: foamy125@gmail.com' \
  --data '{"text":"Knoxx Voxx route check after bounded resume.","model_id":"kokoro","voice_id":"alloy","output_format":"mp3"}'
```

Response headers:

```text
tts_status=200
cache-control: no-store
content-type: audio/mpeg
x-openhax-tts-backend: kokoro
x-openhax-tts-postprocess-profile: sports-commentator-v1
x-openhax-tts-prompt-aware: 0
x-openhax-tts-queue-max-concurrent: 1
x-openhax-tts-queue-wait-ms: 2
```

File check:

```text
15692 /tmp/knoxx-tts4.mp3
/tmp/knoxx-tts4.mp3: Audio file with ID3 version 2.4.0 ... MPEG ADTS ... 24 kHz, Monaural
```

## Frames

(世, p=0.89) Frame 1: this was not a Voxx route regression. The route worked once Knoxx had a valid membership context and the backend was responsive.

(世, p=0.92) Frame 2: this was a startup recovery fan-out bug. “Online” in PM2 did not mean “able to service HTTP quickly”; the backend could be live but busy launching recovered agent work.

(世, p=0.86) Frame 3: the auth failures during early direct curl testing were expected behavior. Knoxx voice endpoints require a resolved request context/membership; unauthenticated curls are rejected.

## Countermoves

(己, p=0.91) I avoided disabling recovery or the service. The patch preserves recovery and only bounds concurrency.

(己, p=0.88) I verified the actual renderer via `x-openhax-tts-backend`, not just HTTP `200`.

(己, p=0.82) Remaining dirty state inside Knoxx is pre-existing/unrelated workspace state and was not absorbed into these commits. Examples still present include `data/taxonomy/sacred_errors.edn` and novel contract files.

## Next

(汝, p=0.9) Watch the backend through one more restart/tick cycle; if memory keeps climbing while CPU stays low, the next fix should bound or dedupe the periodic OpenPlanner/memory polling visible in the logs.