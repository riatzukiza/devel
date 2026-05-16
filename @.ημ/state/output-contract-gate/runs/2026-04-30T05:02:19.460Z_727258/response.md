## Signal

(己, p=0.96) Done. I removed active first-party references/support for the targeted voice provider from:

- `/home/err/.pi/agent/skills`
- `/home/err/devel/orgs/open-hax/voxx`
- `/home/err/devel/services/voxx`

(己, p=0.95) Voxx now defaults agent/runtime voice routing toward Kokoro:

- `VOICE_GATEWAY_TTS_BACKEND_ORDER=kokoro,melo,espeak`
- direct proprietary backend config/env vars removed from `services/voxx`
- upstream backend implementation removed from `orgs/open-hax/voxx/src/voice_gateway/tts.py`
- provider-specific settings/model/catalog references removed from Voxx code/tests/docs
- agent guidance added:
  - `/home/err/devel/orgs/open-hax/voxx/AGENTS.md`
  - `/home/err/devel/services/voxx/AGENTS.md`
  - `/home/err/.pi/agent/skills/voice-tts/SKILL.md`
  - `/home/err/.pi/agent/skills/voice-tts/CONTRACT.edn`

(己, p=0.98) Commits made:

- `/home/err/devel/orgs/open-hax/voxx`: `39dafe7 Disable direct proprietary voice backend`
- `/home/err/.pi`: `af9aa97 Prefer Voxx Kokoro for agent voice`
- `/home/err/devel`: `4a5bf6c9 Route Voxx runtime through Kokoro`

## Evidence

(己, p=0.99) Verification passed:

```bash
cd /home/err/devel/orgs/open-hax/voxx
PYTHONPATH=src uv run --with-requirements requirements.txt python -m pytest
# 15 passed
```

```bash
cd /home/err/devel/orgs/open-hax/voxx
PYTHONPATH=src uv run --with-requirements requirements.txt python -m compileall src tests
# passed
```

```bash
cd /home/err/devel/services/voxx
docker compose config
# ok
```

(己, p=0.98) Targeted search is clean for skills + active Voxx code/docs/runtime when excluding append-only receipts:

```bash
rg -n -i "eleven\s*labs|elevenlabs|eleven_labs|ELEVENLABS|eleven_" \
  /home/err/.pi/agent \
  /home/err/devel/orgs/open-hax/voxx \
  /home/err/devel/services/voxx \
  --glob '!**/receipts.log'
# no matches
```

(己, p=0.91) The only remaining targeted-path match is a historical line in append-only `/home/err/devel/orgs/open-hax/voxx/receipts.log`, which I preserved rather than rewriting ledger history.

## Frames

(世, p=0.93) The active implementation now treats Voxx as the only agent-facing voice boundary and Kokoro as the preferred local path.

(世, p=0.88) Provider-shaped compatibility routes like `/v1/text-to-speech/:voice_id` still exist as generic Voxx convenience routes, but no longer name or call the removed upstream backend.

(己, p=0.82) I scoped the cleanup to first-party pi skills and the two Voxx locations you named; I did not rewrite unrelated third-party clones elsewhere under `/home/err/devel`.

## Countermoves

(己, p=0.9) I did not stage the pre-existing untracked `/home/err/devel/services/voxx/docker-compose.yml`.

(己, p=0.88) I avoided rewriting append-only receipt history, even though one old receipt still contains the removed provider string.

(己, p=0.86) Broader `/home/err/devel` still has provider references in unrelated third-party/upstream repos; those were not changed to avoid destructive cross-repo churn outside the named Voxx scope.

## Next

(汝, p=0.8) Pull/restart the Voxx compose stack so the Kokoro-first runtime config is active.