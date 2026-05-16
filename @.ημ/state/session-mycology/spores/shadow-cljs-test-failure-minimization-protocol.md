# Skill Spore: shadow-cljs-test-failure-minimization-protocol

- Generated: 2026-04-25T01:53:29.355Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.58
- p-friction: 0.82
- p-skill-candidate: 0.74

## Lesson
When tests fail due to JS-object vs map boundaries, lock the abstraction boundary with js->clj normalization and make regression tests stub model-support predicates to avoid conflating normalization with capability gating.

## Better path next time
Run clj-kondo on the specific failing file before attempting broad refactors; avoid deleting untracked paths with rm -rf unless scoped and verified tracked/untracked via git status.

## Candidate description
Protocol for isolating and fixing failing shadow-cljs node-test suites: read full /tmp truncated logs, fix parse errors first (paren balance), then adjust tests with with-redefs for referred vars, and treat capability/contract EDN as part of test surface.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: shadow-cljs-test-failure-minimization-protocol
description: "Protocol for isolating and fixing failing shadow-cljs node-test suites: read full /tmp truncated logs, fix parse errors first (paren balance), then adjust tests with with-redefs for referred vars, and treat capability/contract EDN as part of test surface."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# shadow-cljs-test-failure-minimization-protocol

## Goal
Protocol for isolating and fixing failing shadow-cljs node-test suites: read full /tmp truncated logs, fix parse errors first (paren balance), then adjust tests with with-redefs for referred vars, and treat capability/contract EDN as part of test surface.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "shadow-cljs-test-failure-minimization-protocol")
  (v "ημ.skill/shadow-cljs-test-failure-minimization-protocol@0.0.1-spore")
  (intent "Protocol for isolating and fixing failing shadow-cljs node-test suites: read full /tmp truncated logs, fix parse errors first (paren balance), then adjust tests with with-redefs for referred vars, and treat capability/contract EDN as part of test surface.")

  (activation
    (priority 35)
    (explicit ["skill:shadow-cljs-test-failure-minimization-protocol"])
    (triggers ["shadow-cljs-test-failure-minimization-protocol"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/shadow-cljs-test-failure-minimization-protocol/SKILL.md
- /home/err/.pi/agent/skills/shadow-cljs-test-failure-minimization-protocol/CONTRACT.edn
