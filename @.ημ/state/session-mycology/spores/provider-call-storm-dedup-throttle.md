# Skill Spore: provider-call-storm-dedup-throttle

- Generated: 2026-05-01T00:04:51.360Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.88
- p-friction: 0.44
- p-skill-candidate: 0.74

## Lesson
Session-title storms came from cache warm paths that checked only resolved cache, not in-flight promises; provider calls need both per-key dedupe and global serialization.

## Better path next time
Search for provider-backed cache warmers first, then patch per-key promise tracking and a central queue in the provider boundary.

## Candidate description
When UI/background cache warmers call an LLM/provider per missing item, dedupe in-flight work by cache key and add a central provider-call queue before optimizing the downstream service.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: provider-call-storm-dedup-throttle
description: "When UI/background cache warmers call an LLM/provider per missing item, dedupe in-flight work by cache key and add a central provider-call queue before optimizing the downstream service."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# provider-call-storm-dedup-throttle

## Goal
When UI/background cache warmers call an LLM/provider per missing item, dedupe in-flight work by cache key and add a central provider-call queue before optimizing the downstream service.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "provider-call-storm-dedup-throttle")
  (v "ημ.skill/provider-call-storm-dedup-throttle@0.0.1-spore")
  (intent "When UI/background cache warmers call an LLM/provider per missing item, dedupe in-flight work by cache key and add a central provider-call queue before optimizing the downstream service.")

  (activation
    (priority 35)
    (explicit ["skill:provider-call-storm-dedup-throttle"])
    (triggers ["provider-call-storm-dedup-throttle"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/provider-call-storm-dedup-throttle/SKILL.md
- /home/err/.pi/agent/skills/provider-call-storm-dedup-throttle/CONTRACT.edn
