# Recovered Notes: cephalon-clj-brain/src/cephalon/brain/tools/social_discord.clj

## Status
- Source not recovered. This document summarizes references found in session/spec files.

## References
- `spec/promethean-discord-io-bridge-agent-consolidation.md` (lines 10-27): Social/Discord tools registered via shared bench-tools DSL.
- `spec/2026-01-27-duck-context-protocol.md` (lines 64-74): Social Discord tool list (open/close lists, get messages, scroll, send message, react).

## Observed behavior (from specs)
- Registers Discord social tools in the shared registry.
- Expected tool names include:
  - `social.discord.open-user-profile`
  - `social.discord.open-server-list`
  - `social.discord.close-server-list`
  - `social.discord.open-channel-list`
  - `social.discord.get-messages`
  - `social.discord.scroll`
  - `social.discord.scroll-to-present`
  - `social.discord.send-message`
  - `social.discord.react-to-message`
