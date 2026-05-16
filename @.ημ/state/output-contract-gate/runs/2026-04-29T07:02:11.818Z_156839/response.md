## Signal

(己, p=0.9) Tested Voxx and updated the voice skills to use it as the default voice gateway.

(己, p=0.92) Voxx provides voices through:

- `GET /v1/voices`
- `GET /v1/voices/openai`
- `GET /v1/voices/{voice_id}/settings`
- `POST /v1/audio/speech`

(己, p=0.88) Found and fixed the real backend issue: Kokoro was running, but Voxx fell back to `espeak` because the Kokoro OpenAI-compatible backend path incorrectly required an API key. Kokoro local server does not require one.

(己, p=0.93) After fix and rebuild, Voxx synthesis returned:

```text
x-openhax-tts-backend: kokoro
```

(己, p=0.86) Updated skills/scripts:

- `.agents/skills/list-voices/`
- `.agents/skills/elevenlabs-tts/`
- `.agents/skills/elevenlabs-voice-manage/`
- `~/.pi/agent/skills/voice-tts/`

(己, p=0.9) Commits:

- Voxx submodule: `ae240b3 allow kokoro tts without gateway token`
- Workspace root: `868880a8 route voice skills through voxx`
- Pi home: `07d71b4 update voice tts skill for voxx`

## Evidence

(己, p=0.95) Voxx health:

```json
{"ok":true,"service":"voxx","requires_api_key":true,"model_count":9}
```

(己, p=0.94) Voxx voices returned:

```text
Alloy
Nova
Onyx
Shimmer
Echo
Sage
Kaede
```

(己, p=0.92) TTS model catalog included:

```text
gpt-4o-mini-tts, tts-1, tts-1-hd, eleven_multilingual_v2
```

(己, p=0.94) Tests passed in the Voxx compose image:

```text
13 passed in 1.17s
```

(己, p=0.94) Live synthesis after rebuild:

```text
x-openhax-tts-backend: kokoro
/tmp/voxx-kokoro.mp3: MPEG audio
```

(己, p=0.9) Skill smoke tests produced audio:

- `.agents/skills/elevenlabs-tts/agent-tts.sh` wrote `/tmp/voxx-skill.wav`
- `~/.pi/agent/skills/voice-tts/tts.sh` wrote `/tmp/voxx-pi-skill.mp3`

## Frames

(世, p=0.88) Main frame: Voxx was healthy and Kokoro was running, but backend selection silently fell through to `espeak` because Kokoro was treated like a remote authenticated provider.

(世, p=0.82) Skill frame: “ElevenLabs” skills should now be legacy-compatible wrappers around Voxx, not direct ElevenLabs-first scripts.

(世, p=0.72) Operational frame: voice cloning/deletion should remain explicit direct-provider actions because Voxx currently exposes listing/settings/synthesis, not account-mutating voice management.

## Countermoves

(己, p=0.82) I did not claim MeloTTS is currently working; the validated live backend was Kokoro.

(己, p=0.8) I did not commit unrelated existing workspace changes, including:

- `services/voxx/compose.yaml`
- `orgs/open-hax/voxx/src/voice_gateway/config.py`

(己, p=0.78) The first synthesis smoke test before the fix returned `x-openhax-tts-backend: espeak`; I used that as evidence to fix Voxx rather than treating health alone as success.

## Next

(汝, p=0.9) Use `~/.pi/agent/skills/voice-tts/tts.sh --text "hello" --voice af_heart --model kokoro --output out.mp3` for the next live voice generation.