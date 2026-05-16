# Skill Spore: proxx-llamacpp-embed-routing-fix

- Generated: 2026-04-29T17:27:08.968Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.78
- p-friction: 0.60
- p-skill-candidate: 0.74

## Lesson
Proxx can route embeddings to OpenAI-compat providers (llamacpp-embed) but only if its upstream base-url map includes that provider and callers either prefix the model or add it to routing; avoid adding embed-only providers to global fallback lists.

## Better path next time


## Candidate description
When embeddings fail via Proxx/Ollama with model-not-found, wire llama.cpp embedding server into UPSTREAM_PROVIDER_BASE_URLS and switch callers to llmacpp-embed: model prefixes; document the override and verification steps.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: proxx-llamacpp-embed-routing-fix
description: "When embeddings fail via Proxx/Ollama with model-not-found, wire llama.cpp embedding server into UPSTREAM_PROVIDER_BASE_URLS and switch callers to llmacpp-embed: model prefixes; document the override and verification steps."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# proxx-llamacpp-embed-routing-fix

## Goal
When embeddings fail via Proxx/Ollama with model-not-found, wire llama.cpp embedding server into UPSTREAM_PROVIDER_BASE_URLS and switch callers to llmacpp-embed: model prefixes; document the override and verification steps.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "proxx-llamacpp-embed-routing-fix")
  (v "ημ.skill/proxx-llamacpp-embed-routing-fix@0.0.1-spore")
  (intent "When embeddings fail via Proxx/Ollama with model-not-found, wire llama.cpp embedding server into UPSTREAM_PROVIDER_BASE_URLS and switch callers to llmacpp-embed: model prefixes; document the override and verification steps.")

  (activation
    (priority 35)
    (explicit ["skill:proxx-llamacpp-embed-routing-fix"])
    (triggers ["proxx-llamacpp-embed-routing-fix"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/proxx-llamacpp-embed-routing-fix/SKILL.md
- /home/err/.pi/agent/skills/proxx-llamacpp-embed-routing-fix/CONTRACT.edn
