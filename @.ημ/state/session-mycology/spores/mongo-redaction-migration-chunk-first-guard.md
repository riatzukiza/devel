# Skill Spore: mongo-redaction-migration-chunk-first-guard

- Generated: 2026-04-29T08:07:36.031Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.64
- p-friction: 0.82
- p-skill-candidate: 0.76

## Lesson
Bulk event-first redaction can leave vector text behind if interrupted; chunk-first plus verification markers makes live batches resumable.

## Better path next time


## Candidate description
For destructive reference-first Mongo redaction migrations, update dependent chunk/vector rows before parent text redaction, add repair markers for interrupted runs, and expose state endpoints that catch partial parent/vector divergence.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: mongo-redaction-migration-chunk-first-guard
description: "For destructive reference-first Mongo redaction migrations, update dependent chunk/vector rows before parent text redaction, add repair markers for interrupted runs, and expose state endpoints that catch partial parent/vector divergence."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# mongo-redaction-migration-chunk-first-guard

## Goal
For destructive reference-first Mongo redaction migrations, update dependent chunk/vector rows before parent text redaction, add repair markers for interrupted runs, and expose state endpoints that catch partial parent/vector divergence.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "mongo-redaction-migration-chunk-first-guard")
  (v "ημ.skill/mongo-redaction-migration-chunk-first-guard@0.0.1-spore")
  (intent "For destructive reference-first Mongo redaction migrations, update dependent chunk/vector rows before parent text redaction, add repair markers for interrupted runs, and expose state endpoints that catch partial parent/vector divergence.")

  (activation
    (priority 35)
    (explicit ["skill:mongo-redaction-migration-chunk-first-guard"])
    (triggers ["mongo-redaction-migration-chunk-first-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/mongo-redaction-migration-chunk-first-guard/SKILL.md
- /home/err/.pi/agent/skills/mongo-redaction-migration-chunk-first-guard/CONTRACT.edn
