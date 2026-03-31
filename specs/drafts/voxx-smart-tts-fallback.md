# Voxx smart TTS fallback

## Open questions
- None blocking. Working assumption: Voxx should remain Battlebussy's single TTS endpoint while selecting the best available backend from local Melo/espeak plus optional remote providers when credentials are present.

## Risks
- Remote-provider fallbacks could hide outages if the chosen order is opaque.
- Voice identity may drift across providers unless we define explicit alias mapping and headers/metadata.
- Deployment needs secret propagation for remote providers without echoing tokens into logs.

## Priority
- High: make Battlebussy commentary sound less robotic now while preserving a clean path to a specific ElevenLabs voice later.

## Implementation phases
1. Research current provider options, including low-cost/free candidates and models.dev-discoverable audio/TTS providers.
2. Add Voxx config + engine support for smart backend ordering and provider-aware voice mapping.
3. Add tests for backend selection/fallback behavior and document the operator-facing env knobs.
4. Optionally deploy the updated Voxx runtime with the best currently available credentialed provider.

## Affected files
- `orgs/open-hax/voxx/src/voice_gateway/config.py`
- `orgs/open-hax/voxx/src/voice_gateway/catalog.py`
- `orgs/open-hax/voxx/src/voice_gateway/tts.py`
- `orgs/open-hax/voxx/src/voice_gateway/service.py`
- `orgs/open-hax/voxx/tests/*`
- `orgs/open-hax/voxx/README.md`
- `services/voxx/.env.example`
- `services/voxx/README.md`
- `services/voxx/compose.yaml`

## Existing evidence
- Battlebussy commentary currently selects `voxx` and points to the deployed Voxx endpoint.
- Current production Voxx only had local Melo/espeak behavior configured before this pass.
- Local operator env has `REQUESTY_API_TOKEN` available; `ELEVENLABS_API_KEY` appears unset in local shell and deployed containers during this pass.

## Definition of done
- Voxx can choose from a configured backend order and fall back automatically when a backend is unavailable or errors.
- Voxx surfaces which backend actually synthesized a clip.
- Tests cover backend selection and failure fallback.
- Docs describe current free/cheap provider options and how to steer Voxx toward Requesty now and ElevenLabs later.
