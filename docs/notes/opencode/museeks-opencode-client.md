# WIP: Museeks opencode client
A clojure client for managing agents, initially opencode agents.

# Mu: intermediary message format

We keep a seperate index of chats from the agent provider
- messages
- sessions
- project (nearest git up the tree, or cwd if there is no git present).
- global settings saved in `~/.mu`
- project settings saved in `./.mu/`

## Search Everything semanticly
- Embeds all searchable assets and indexes them for vector simiarlity searching
- Exposes tools to the agent for querying message history.

## Context Management
- Context editor ui to manually investigate what is being sent to the servers
- Context Management APIs to run automations on contexts 
  - publish context updates/changes

## Pub/sub agent events
- Publish all event types as seperate streams
- Consumer subscribes only to the streams they need
### Events
- prompt.sent
- prompt.updated
- prompt.cleared
- session.created
- session.deleted
- session.idle
- session.message.part
- session.message.done
# Opencode: Community tested solution
- individually subscribable events
- 
# FUTURE
- codex
- claude
- kilocode
- zed
- discord
# Blanc: The simplest possible agent
We were thinking about our existing opencode tooling and plugin experience when starting this project
I didn't want to tie the tool to one agent provider, so I needed a simple agent to test and experiment with.
- edn configs or matching directory structure from `.blanc/`:
  - `agents.edn` and/or `agents/*.(md|edn)`
  - `mcps.edn` and/or `mcps/*.edn`
  - `models.edn` and/or `models/*.edn`
- clj plugins
  - dsl for custom tools
  - simple base tools
    - nrepl
      - start
      - stop
      - send
      - restart
    - curl
    - files
      - read
      - write
      - edit
      - move
      - delete
      - link
  - sessions
    - message history
    - forks
    - parent
    - context manager
    - send prompts


# Links

## Opencode documents

https://opencode.ai/docs
https://opencode.ai/docs/skills/
https://opencode.ai/docs/tools/
https://opencode.ai/docs/rules/
https://opencode.ai/docs/agents/
https://opencode.ai/docs/models/
https://opencode.ai/docs/commands/
https://opencode.ai/docs/custom-tools/
https://opencode.ai/docs/server/
https://opencode.ai/docs/sdk/
https://opencode.ai/docs/plugins/
https://opencode.ai/docs/ecosystem/
