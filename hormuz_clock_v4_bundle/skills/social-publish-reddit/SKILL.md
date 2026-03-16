# Social Publish — Reddit

Use this skill to publish longer-form Hormuz clock updates to Reddit.

## Purpose
Turn the latest snapshot into a subreddit post that preserves nuance, methodology, and source labeling.

## When to use
Use this skill when asked to:
- publish a daily or weekly update post on Reddit
- create a methodology thread
- post a discussion prompt with the latest clock image

## Inputs
Expected inputs can include:
- snapshot markdown
- image path or hosted image URL
- subreddit name
- flair id or flair text if needed

## Workflow
1. Build a Reddit-friendly title and body.
2. Validate subreddit requirements, flair, and character lengths.
3. Use `scripts/social/post_reddit.mjs` with OAuth bearer token.
4. Default to dry-run unless explicitly told to publish.

## Guardrails
- Do not hide uncertainty.
- Respect subreddit rules and flair requirements.
- Keep tokens in env only.
- Handle submission failure clearly instead of retrying blindly.

## Evolution rule
If the clock gains new signal classes, summarize them in prose rather than dumping raw JSON into the post body.
