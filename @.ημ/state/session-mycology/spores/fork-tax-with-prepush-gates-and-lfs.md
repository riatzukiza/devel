# Skill Spore: fork-tax-with-prepush-gates-and-lfs

- Generated: 2026-04-26T18:52:57.054Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.62
- p-friction: 0.78
- p-skill-candidate: 0.76

## Lesson
When Π runs into hook-based gates, treat the hook output as the verification harness: fix-forward the smallest compile errors, and move large artifacts to LFS before retrying push and tags.

## Better path next time


## Candidate description
Protocol for paying Π when git hooks block push: detect failing package via pre-push output, apply minimal fix or scoped tsconfig exclude, convert oversized blobs to Git LFS, then retag and push once gates pass; avoid submodule-recursive restore side effects via --recurse-submodules=no.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: fork-tax-with-prepush-gates-and-lfs
description: "Protocol for paying Π when git hooks block push: detect failing package via pre-push output, apply minimal fix or scoped tsconfig exclude, convert oversized blobs to Git LFS, then retag and push once gates pass; avoid submodule-recursive restore side effects via --recurse-submodules=no."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# fork-tax-with-prepush-gates-and-lfs

## Goal
Protocol for paying Π when git hooks block push: detect failing package via pre-push output, apply minimal fix or scoped tsconfig exclude, convert oversized blobs to Git LFS, then retag and push once gates pass; avoid submodule-recursive restore side effects via --recurse-submodules=no.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "fork-tax-with-prepush-gates-and-lfs")
  (v "ημ.skill/fork-tax-with-prepush-gates-and-lfs@0.0.1-spore")
  (intent "Protocol for paying Π when git hooks block push: detect failing package via pre-push output, apply minimal fix or scoped tsconfig exclude, convert oversized blobs to Git LFS, then retag and push once gates pass; avoid submodule-recursive restore side effects via --recurse-submodules=no.")

  (activation
    (priority 35)
    (explicit ["skill:fork-tax-with-prepush-gates-and-lfs"])
    (triggers ["fork-tax-with-prepush-gates-and-lfs"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/fork-tax-with-prepush-gates-and-lfs/SKILL.md
- /home/err/.pi/agent/skills/fork-tax-with-prepush-gates-and-lfs/CONTRACT.edn
