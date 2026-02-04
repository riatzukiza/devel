# Zen API Key Requirement

## Prompt
Determine, based on the OpenCode source of record, whether an API key is required to use the free Zen models.

## References
- `orgs/sst/opencode/packages/web/src/content/docs/zen.mdx:16-57` – documents the Zen login flow and that users obtain an API key after signing in and adding billing details.
- `orgs/sst/opencode/packages/web/src/content/docs/zen.mdx:138-145` – lists the free Zen models and clarifies they are part of the same Zen offering and currently free during beta.

## Existing Issues / PRs
- None identified that change Zen authentication or API key requirements.

## Definition of Done
- Explain whether Zen (including its free-tier models) requires users to authenticate with an API key, citing the relevant sections of the documentation in-repo.
- Clarify that Zen usage is optional for OpenCode overall, but required for invoking Zen-hosted endpoints.
- Mention any beta/free caveats noted in the docs.

## Requirements
1. Base the answer solely on repository sources.
2. Reference exact file paths and line numbers supporting the conclusion.
3. Highlight how free Zen models (Grok Code Fast 1, Code Supernova) are still accessed via Zen’s API gateway.
