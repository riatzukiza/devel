---
name: knoxx-model-contracts
description: Write Knoxx model and model-family contracts with normal file tools, recording provider, allowlist, reasoning, thinking, context, tokens, and inputs.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-model-contracts
  version: 2
---

# Skill: Knoxx Model Contracts

## Goal
Create or repair Knoxx model and model-family EDN files.

## Use This Skill When
- The user asks to add or update a Knoxx model or model family.
- You are editing `contracts/model_families/*.edn` or `contracts/models/*.edn`.
- An agent references a missing, mislabeled, or incorrectly allowlisted model.

## Tool Rule
Use the regular file tools:

- `read` existing model/model-family examples.
- `edit` existing contracts.
- `write` new contracts.
- Validate changed EDN with `bb` or `clojure`.

## Minimal Model Family Shape
```edn
{:model-family/id "gpt"
 :model-family/provider :openai
 :model-family/prefixes ["gpt-"]
 :model-family/allowlisted true
 :model-family/reasoning true
 :model-family/default-thinking :medium
 :model-family/thinking-levels [:off :low :medium :high]
 :model-family/context-window 400000
 :model-family/max-tokens 128000
 :model-family/input [:text :image]}
```

## Minimal Model Shape
```edn
{:model/id "gpt-5.4"
 :model-family/id "gpt"
 :model/provider :openai
 :model/label "GPT-5.4"
 :model/allowlisted true
 :model/reasoning true
 :model/default-thinking :medium
 :model/thinking-levels [:off :low :medium :high]
 :model/input [:text :image]}
```

## Steps
1. Read similar model contracts first.
2. Verify fresh provider/model claims before encoding them.
3. Keep model ids as strings.
4. Keep family prefixes consistent with model ids.
5. Match agent `:thinking` values to supported model thinking levels.
6. Validate changed EDN with `bb` or `clojure`.
7. Summarize affected agents if model ids changed.

## Output
- Updated model/model-family EDN path(s).
- Verification source or uncertainty note.
- Affected agent references.
- `bb`/`clojure` validation result or known gap.
