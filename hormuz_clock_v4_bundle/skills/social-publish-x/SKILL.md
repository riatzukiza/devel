# Social Publish — X / Twitter

Use this skill to publish Hormuz clock updates to X using the current Manage Posts API flow.

## Purpose
Convert a snapshot report into an X post or a short thread with image support.

## When to use
Use this skill when asked to:
- post a daily clock update to X
- publish a short thread covering state, branches, and rewind triggers
- compare two clock versions in a short format

## Inputs
Expected inputs can include:
- latest snapshot markdown
- image path or public asset URL
- target voice (`neutral`, `analyst`, `broad-public`)
- character budget preferences

## Workflow
1. Build a short summary and optional continuation posts.
2. Enforce platform length limits before publish.
3. Use `scripts/social/post_x.mjs` with OAuth user access token.
4. Default to dry-run unless explicitly told to publish.

## Guardrails
- Distinguish observed facts from model priors.
- Do not publish if auth is missing or token scope is unclear.
- Attach sources in replies when the main post is too short.
- Respect rate limits and handle non-2xx responses explicitly.

## Evolution rule
Keep X-specific length and media behavior in the adapter, not in the core state model.
