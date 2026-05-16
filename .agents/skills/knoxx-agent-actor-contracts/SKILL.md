---
name: knoxx-agent-actor-contracts
description: Write Knoxx agent and actor contracts with normal file tools, binding actors to default agents, roles, models, prompts, and allowed actor scopes.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-agent-actor-contracts
  version: 2
---

# Skill: Knoxx Agent Actor Contracts

## Goal
Create or repair Knoxx agent and actor EDN files.

## Use This Skill When
- The user asks for a new Knoxx agent, page actor, Discord/event agent, or user/actor binding.
- You are editing `contracts/agents/*.edn` or `contracts/actors/*.edn`.
- The selected actor, default agent, role, model, prompt, or tool surface does not line up.

## Tool Rule
Use the regular file tools:

- `read` nearby agent/actor examples.
- `edit` existing agent/actor contracts.
- `write` new agent/actor contracts.
- Validate changed EDN with `bb` or `clojure`.

## Minimal Agent Shape
```edn
{:contract/id "developer_agent"
 :contract/kind :agent
 :contract/version 1
 :enabled true
 :trigger-kind :manual
 :contract/actors ["chat_primary" "knoxx_default"]
 :agent {:role :developer
         :model "gpt-5.4"
         :thinking :medium}
 :prompts {:system "..."}
 :data {}
 :hooks {:before {} :after {}}}
```

## Minimal Actor Shape
```edn
{:actor/id "workspace_user"
 :actor/kind :user
 :actor/label "Workspace User"
 :actor/default-agent "developer_agent"
 :actor/roles [:developer]}
```

## Steps
1. Read the nearest existing agent and actor contracts.
2. Keep `:contract/id` and `:actor/id` aligned with filenames.
3. Bind actors to default agents intentionally.
4. Put broad permissions in roles; keep actor overrides rare.
5. Keep prompts concise and do not include secrets.
6. Validate changed EDN with `bb` or `clojure`.
7. Summarize actor → default agent → role/capabilities → model → prompt.

## Output
- New or updated agent/actor EDN path(s).
- A short resolution summary.
- `bb`/`clojure` validation result or known gap.
