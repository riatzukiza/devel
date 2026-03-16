# Social Publish — Discord Bot

Use this skill to publish Hormuz clock updates into Discord channels via bot token.

## Purpose
Send a compact status message and optional image/embed into a configured Discord channel.

## When to use
Use this skill when asked to:
- post a daily risk clock update into Discord
- push a one-shot alert when state changes materially
- cross-post a markdown brief into an internal or public server

## Inputs
Expected inputs can include:
- latest snapshot markdown
- rendered clock image path
- target channel id
- optional ping policy / allowed mentions policy

## Workflow
1. Build a Discord-safe payload from the latest snapshot.
2. Sanitize mentions using `allowed_mentions`.
3. If sending an image, upload it first or use an existing URL.
4. Use `scripts/social/post_discord.mjs` with `DISCORD_BOT_TOKEN`.
5. Default to dry-run unless explicitly told to publish.

## Guardrails
- Never hardcode bot tokens.
- Use channel ids and message length limits explicitly.
- Avoid surprise mentions; default to no mentions.
- If the image is missing, fall back to plain text rather than failing silently.

## Evolution rule
As the state model evolves, keep platform rendering logic in `build_social_payloads.mjs` so Discord formatting stays aligned with the shared model.
