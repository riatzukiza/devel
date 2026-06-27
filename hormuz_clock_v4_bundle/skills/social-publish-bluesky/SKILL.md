# Social Publish — Bluesky

Use this skill to publish Hormuz clock updates to Bluesky in a way that is concise, source-aware, and easy to evolve.

## Purpose
Turn the latest snapshot report and clock asset into a Bluesky post or thread.

## When to use
Use this skill when asked to:
- publish a daily clock update to Bluesky
- post a thread with updated probabilities / signals
- reformat a longer report into Bluesky-length posts

## Inputs
Expected inputs can include:
- `reports/v4_snapshot.md` or another markdown brief
- `assets/hormuz_risk_clock_v4.png` or newer image
- a target tone (`clinical`, `public explainer`, `ops/status`)
- `config/social_profiles.example.yaml` values for handle / labels / defaults

## Workflow
1. Read the latest snapshot markdown and current state JSON.
2. Build one short post and an optional thread continuation.
3. Include a short source note or link when space allows.
4. Use `scripts/social/post_bluesky.mjs` with env credentials.
5. Default to dry-run unless explicitly told to publish.

## Guardrails
- Distinguish observed facts from model choices.
- Do not overstate branch probabilities as certainty.
- Prefer one image + one clear paragraph over a long thread unless needed.
- Respect Bluesky rate limits and back off on HTTP 429s.
- Keep secrets in environment variables only.

## Evolution rule
If the clock schema evolves, update the payload builder rather than hard-coding text in the post script.
