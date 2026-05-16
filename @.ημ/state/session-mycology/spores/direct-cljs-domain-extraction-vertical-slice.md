# Skill Spore: direct-cljs-domain-extraction-vertical-slice

- Generated: 2026-05-01T02:39:45.469Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.82
- p-friction: 0.44
- p-skill-candidate: 0.72

## Lesson
The better migration path is direct CLJS extraction of stable domain decisions, not interim TS refactors; keep each slice vertical and verified by package tests, tsc, root build, and a runtime import smoke.

## Better path next time
Before writing lint-only migration scaffolding, identify one business rule cluster and extract it directly into a CLJS core/boundary package.

## Candidate description
When migrating TS business logic to ClojureScript, create a small CLJS workspace package with pure core + JS boundary + tests, wire only decision/normalization functions into the TS route, and keep persistence orchestration in TS until the next slice.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: direct-cljs-domain-extraction-vertical-slice
description: "When migrating TS business logic to ClojureScript, create a small CLJS workspace package with pure core + JS boundary + tests, wire only decision/normalization functions into the TS route, and keep persistence orchestration in TS until the next slice."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# direct-cljs-domain-extraction-vertical-slice

## Goal
When migrating TS business logic to ClojureScript, create a small CLJS workspace package with pure core + JS boundary + tests, wire only decision/normalization functions into the TS route, and keep persistence orchestration in TS until the next slice.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "direct-cljs-domain-extraction-vertical-slice")
  (v "ημ.skill/direct-cljs-domain-extraction-vertical-slice@0.0.1-spore")
  (intent "When migrating TS business logic to ClojureScript, create a small CLJS workspace package with pure core + JS boundary + tests, wire only decision/normalization functions into the TS route, and keep persistence orchestration in TS until the next slice.")

  (activation
    (priority 35)
    (explicit ["skill:direct-cljs-domain-extraction-vertical-slice"])
    (triggers ["direct-cljs-domain-extraction-vertical-slice"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/direct-cljs-domain-extraction-vertical-slice/SKILL.md
- /home/err/.pi/agent/skills/direct-cljs-domain-extraction-vertical-slice/CONTRACT.edn
