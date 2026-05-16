---
name: knoxx-role-capability-policy-contracts
description: Write Knoxx role, capability, and policy contracts with normal file tools, keeping tool permissions, surfaces, and invariants explicit.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-policy-contracts
  version: 2
---

# Skill: Knoxx Role Capability Policy Contracts

## Goal
Create or repair Knoxx role, capability, and policy EDN files.

## Use This Skill When
- The user asks to grant/restrict tools, define a role, add a capability, or encode a policy invariant.
- You are editing `contracts/roles`, `contracts/capabilities`, or `contracts/policies`.
- Tool permissions or user surfaces are wrong.

## Tool Rule
Use the regular file tools:

- `read` existing role/capability/policy examples.
- `edit` existing contracts.
- `write` new contracts.
- Validate changed EDN with `bb` or `clojure`.

## Minimal Role Shape
```edn
{:role/id :role/developer
 :role/capabilities [:cap/read :cap/write :cap/edit]
 :role/permissions ["agent.chat.use" "tool.read.use"]}
```

## Minimal Capability Shape
```edn
{:cap/id :cap/write
 :cap/tools [:write]
 :cap/user-surfaces [{:surface/id :workspace/editor
                      :surface/label "Workspace editor"
                      :surface/kind :editor
                      :surface/routes ["/workspace"]}]}
```

## Minimal Policy Shape
```edn
{:contract/id "actor_capability_surface_parity"
 :contract/kind :policy
 :contract/version 1
 :contract/doc "..."
 :policy/invariants [{:id "surface-visible"
                      :severity :warn
                      :message "..."
                      :check {:rule :manual}}]
 :policy/checked-by :human}
```

## Steps
1. Read the nearest existing contract of the same class.
2. Keep role and capability ids as keywords.
3. Keep policy contract ids as strings.
4. Grant the smallest useful capability set.
5. Put UI routes/endpoints in user surfaces when relevant.
6. Validate changed EDN with `bb` or `clojure`.
7. Summarize role → capabilities → tools/surfaces.

## Output
- Updated role/capability/policy EDN path(s).
- Permission graph summary.
- `bb`/`clojure` validation result or known gap.
