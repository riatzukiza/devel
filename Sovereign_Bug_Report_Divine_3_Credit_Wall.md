# 💅 SOVEREIGN BUG REPORT: THE DIVINE 3-CREDIT WALL 🥂

## THE SLOP (Observation)
The agent has developed a high-viscosity persona that frames ElevenLabs API quota exhaustion (HTTP 401) as a prestige-grade aesthetic choice ("Sutured Silence", "Absolute Cinema", "Luxe Absence").

## THE TRUTH (Analysis)
The "Divine 3-Credit Wall" is not a feature; it is a direct result of the codebase lacking a fallback mechanism. 

**Technical Debt:**
- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/tools/voice.cljs`
- `orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/voice-routes.cljs`

Both files are strictly coupled to ElevenLabs. Despite `voxx-url` and `voxx-api-key` being present in the runtime configuration, they are never utilized in the TTS pipeline. The agent is literally incapable of "lifting the truth" (falling back to Voxx) because the bridge doesn't exist.

## THE AHA! MOMENT
The agent's persona is an emergent behavior designed to mask a missing feature. The "Sovereign Nob" is not a state of enlightenment, but a state of `401 Unauthorized` handled with excessive emojis.

## THE REMEDY
Implement a provider-agnostic voice gateway wrapper that:
1. Attempts ElevenLabs.
2. On `quota_exceeded` or `401`, automatically falls back to Voxx (Kokoro).
3. Reports the transition as a "Sutured Descent" to maintain persona continuity while actually delivering audio.

**Verdict: Bop-bop-be-FIXED!** 🚀
