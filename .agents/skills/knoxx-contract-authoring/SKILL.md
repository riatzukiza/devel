---
name: knoxx-contract-authoring
description: Author Knoxx EDN contracts in the canonical contracts/ tree using ordinary read, edit, and write file tools with simple validation discipline.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-contract-writing
  version: 2
---

# Skill: Knoxx Contract Authoring

## Goal
Create or revise Knoxx EDN contracts as normal repository files.

## Use This Skill When
- The user asks you to write, edit, clone, review, or repair a Knoxx contract.
- The target repo is `orgs/open-hax/openplanner/packages/agents/knoxx`.
- The work touches `contracts/agents`, `contracts/actors`, `contracts/roles`, `contracts/capabilities`, `contracts/policies`, `contracts/model_families`, or `contracts/models`.

## Do Not Use This Skill When
- The user asks for generic pi/OpenCode skill authoring.
- The request targets generated files, secrets, `node_modules`, or `backend/dist`.

## Tool Rule
Use the regular file tools:

- `read` to inspect existing contracts and schema files.
- `edit` to change existing contract files.
- `write` to create new contract files or intentionally rewrite a whole contract.

Validate with `bb` or `clojure`, not a special contract-writing tool. That is the contract-writing workflow.

## Canonical Paths
- Agents: `contracts/agents/<id>.edn`
- Actors/users: `contracts/actors/<id>.edn`
- Roles: `contracts/roles/<slug>.edn`
- Capabilities: `contracts/capabilities/<slug>.edn`
- Policies: `contracts/policies/<id>.edn`
- Model families: `contracts/model_families/<id>.edn`
- Models: `contracts/models/<id>.edn`

## Required Id Fields
- Agent/policy: `:contract/id` string.
- Actor: `:actor/id` string.
- Role: `:role/id` keyword.
- Capability: `:cap/id` keyword.
- Model family: `:model-family/id` string.
- Model: `:model/id` string.

## Steps
1. Read the closest existing contract of the same class.
2. Put the new or changed EDN in the correct canonical path.
3. Keep ids consistent with the filename and contract class.
4. Use plain, readable EDN; do not store secrets.
5. Validate syntax/schema with `bb` or `clojure`, then summarize what changed.

## Validation
At minimum, parse changed EDN with Babashka or Clojure, for example:

```bash
bb -e '(require '\''[clojure.edn :as edn]) (doseq [f *command-line-args*] (edn/read-string (slurp f)) (println "ok" f))' contracts/agents/example.edn
```

Prefer a project Clojure/Babashka validation task if one exists.

## Output
- Contract file path(s) changed.
- Record id and contract class.
- `bb`/`clojure` validation result or explicit validation gap.
