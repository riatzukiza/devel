# Skill Spore: cljs-edn-policy-engine-vertical-slice

- Generated: 2026-04-30T03:55:54.516Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.62
- p-friction: 0.72
- p-skill-candidate: 0.74

## Lesson
A large architecture task should be split into CLJS semantic core and TS endpoint cutover; trying both in one pass risks shallow integration.

## Better path next time
Open with a spec split and ask whether to prioritize semantic core or full endpoint replacement, then implement the selected slice completely.

## Candidate description
When adding a CLJS-owned EDN interpreter to a TS service, first land schemas/interpreter/router/loader/tests as a vertical CLJS slice, then separately wire endpoint-specific TS transport cutovers with fixtures.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: cljs-edn-policy-engine-vertical-slice
description: "When adding a CLJS-owned EDN interpreter to a TS service, first land schemas/interpreter/router/loader/tests as a vertical CLJS slice, then separately wire endpoint-specific TS transport cutovers with fixtures."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# cljs-edn-policy-engine-vertical-slice

## Goal
When adding a CLJS-owned EDN interpreter to a TS service, first land schemas/interpreter/router/loader/tests as a vertical CLJS slice, then separately wire endpoint-specific TS transport cutovers with fixtures.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "cljs-edn-policy-engine-vertical-slice")
  (v "ημ.skill/cljs-edn-policy-engine-vertical-slice@0.0.1-spore")
  (intent "When adding a CLJS-owned EDN interpreter to a TS service, first land schemas/interpreter/router/loader/tests as a vertical CLJS slice, then separately wire endpoint-specific TS transport cutovers with fixtures.")

  (activation
    (priority 35)
    (explicit ["skill:cljs-edn-policy-engine-vertical-slice"])
    (triggers ["cljs-edn-policy-engine-vertical-slice"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/cljs-edn-policy-engine-vertical-slice/SKILL.md
- /home/err/.pi/agent/skills/cljs-edn-policy-engine-vertical-slice/CONTRACT.edn
