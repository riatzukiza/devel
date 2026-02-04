# Cephalon TurnProcessor Discord Send Audit

## Requirements
- Locate the TurnProcessor implementation in services/cephalon-ts.
- Identify where it sends messages to Discord (sendMessage or equivalent).
- Check for length validation before sending.
- Document handling of oversized responses.

## Files and Line References
- services/cephalon-ts/src/llm/ollama.ts:1312-1359
- services/cephalon-ts/src/llm/turn-processor.ts:243-290
- services/cephalon-ts/src/discord/api-client.ts:181-209

## Existing Issues
- Not searched.

## Existing PRs
- Not searched.

## Notes
- TurnProcessor sends finalContent via discordApiClient.sendMessage without length checks or chunking.
- Oversized responses are not handled explicitly; send failures are caught and logged.

## Definition of Done
- Provide relevant paths and snippets showing the send call, any length checks (if present), and error handling for oversized responses.

## Change Log
- 2026-02-03: Added initial findings and references.
