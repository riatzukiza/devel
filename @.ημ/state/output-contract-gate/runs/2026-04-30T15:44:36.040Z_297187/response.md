## Signal

(己, p=0.98) Restarted Voxx with a rebuild and validated the removed provider voices/config are gone from the live runtime.

(世, p=0.99) Live Voxx is up:

- `openhax-voxx`: `Up ... (healthy)`
- `kokoro-server`: `Up`
- health: `{"ok":true,"service":"voxx","requires_api_key":true,"model_count":9}`

(世, p=0.99) Live validation:

- Container env scan: no `ELEVEN` / removed-provider env vars present.
- `/v1/models`: no removed-provider strings.
- `/v1/voices`: no removed-provider strings.
- Voice IDs now exposed:

```text
alloy,nova,onyx,shimmer,echo,sage,kaede,mimo_default,mia,chloe,milo,dean,bingtang,moli,suda,baihua
```

(世, p=0.99) Kokoro synthesis works after restart:

```text
x-openhax-tts-backend: kokoro
content-type: audio/mpeg
content-length: 11468
```

## Evidence

(己, p=0.99) Commands run:

```bash
cd /home/err/devel/services/voxx
docker compose up --build -d
```

```bash
curl -fsS http://127.0.0.1:8787/healthz
curl -fsS -H 'Authorization: Bearer dev-token' http://127.0.0.1:8787/v1/models
curl -fsS -H 'Authorization: Bearer dev-token' http://127.0.0.1:8787/v1/voices
docker compose exec -T voxx env | grep -Ei 'ELEVEN|ELEVENLABS'
```

(己, p=0.96) Recorded receipt:

- `/home/err/devel/receipts.edn`
- commit: `46b6a183 Record Voxx restart validation`

## Frames

(世, p=0.92) The runtime is now Kokoro-first and no longer receives or advertises the removed provider config.

(世, p=0.9) The legacy append-only receipt log still contains old historical text, but active runtime/config/API surfaces are clean.

## Countermoves

(己, p=0.9) I did not touch or commit the pre-existing untracked file:

```text
/home/err/devel/services/voxx/docker-compose.yml
```

(己, p=0.88) Docker Compose warns that both `compose.yaml` and `docker-compose.yml` exist, but it used `compose.yaml`.

## Next

(汝, p=0.86) If you want zero Compose ambiguity, decide whether to delete or absorb the untracked `services/voxx/docker-compose.yml`.