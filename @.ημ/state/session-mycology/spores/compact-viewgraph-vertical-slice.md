# Skill Spore: compact-viewgraph-vertical-slice

- Generated: 2026-04-30T18:19:20.968Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.78
- p-friction: 0.46
- p-skill-candidate: 0.72

## Lesson
The intent compressed into a buildable invariant: truth remains exact; simulation runs on compact embedding cells that can expand/contract under saturation and resource pressure.

## Better path next time
Next time create the compaction read/write model and seed rewrite first, then add scheduler/resource-pressure policies as a second phase.

## Candidate description
When separating truth graph from simulation graph, land a vertical slice with compact projection records, averaged embeddings, seed membership rewrite, expansion fallthrough, and source-metadata-only compact results before building scheduler automation.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: compact-viewgraph-vertical-slice
description: "When separating truth graph from simulation graph, land a vertical slice with compact projection records, averaged embeddings, seed membership rewrite, expansion fallthrough, and source-metadata-only compact results before building scheduler automation."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# compact-viewgraph-vertical-slice

## Goal
When separating truth graph from simulation graph, land a vertical slice with compact projection records, averaged embeddings, seed membership rewrite, expansion fallthrough, and source-metadata-only compact results before building scheduler automation.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "compact-viewgraph-vertical-slice")
  (v "ημ.skill/compact-viewgraph-vertical-slice@0.0.1-spore")
  (intent "When separating truth graph from simulation graph, land a vertical slice with compact projection records, averaged embeddings, seed membership rewrite, expansion fallthrough, and source-metadata-only compact results before building scheduler automation.")

  (activation
    (priority 35)
    (explicit ["skill:compact-viewgraph-vertical-slice"])
    (triggers ["compact-viewgraph-vertical-slice"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/compact-viewgraph-vertical-slice/SKILL.md
- /home/err/.pi/agent/skills/compact-viewgraph-vertical-slice/CONTRACT.edn
