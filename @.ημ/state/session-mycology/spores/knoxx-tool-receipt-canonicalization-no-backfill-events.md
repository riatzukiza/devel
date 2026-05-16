# Skill Spore: knoxx-tool-receipt-canonicalization-no-backfill-events

- Generated: 2026-04-24T14:00:04.381Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.80
- p-friction: 0.50
- p-skill-candidate: 0.73

## Lesson
Tool input backfill via extra runtime events creates UI duplication; better to write full args/results into tool_receipts (plus safe backfill into receipt fields) and render tool UI from receipts rather than from append-only event noise.

## Better path next time


## Candidate description
Protocol: treat tool_receipts as canonical (store full input/result there), stop emitting confusing tool_input_backfill runtime events, and teach frontend to render from receipts (with streaming heuristics like <think> tag routing for Gemma-family).

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: knoxx-tool-receipt-canonicalization-no-backfill-events
description: "Protocol: treat tool_receipts as canonical (store full input/result there), stop emitting confusing tool_input_backfill runtime events, and teach frontend to render from receipts (with streaming heuristics like <think> tag routing for Gemma-family)."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# knoxx-tool-receipt-canonicalization-no-backfill-events

## Goal
Protocol: treat tool_receipts as canonical (store full input/result there), stop emitting confusing tool_input_backfill runtime events, and teach frontend to render from receipts (with streaming heuristics like <think> tag routing for Gemma-family).

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "knoxx-tool-receipt-canonicalization-no-backfill-events")
  (v "ημ.skill/knoxx-tool-receipt-canonicalization-no-backfill-events@0.0.1-spore")
  (intent "Protocol: treat tool_receipts as canonical (store full input/result there), stop emitting confusing tool_input_backfill runtime events, and teach frontend to render from receipts (with streaming heuristics like <think> tag routing for Gemma-family).")

  (activation
    (priority 35)
    (explicit ["skill:knoxx-tool-receipt-canonicalization-no-backfill-events"])
    (triggers ["knoxx-tool-receipt-canonicalization-no-backfill-events"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/knoxx-tool-receipt-canonicalization-no-backfill-events/SKILL.md
- /home/err/.pi/agent/skills/knoxx-tool-receipt-canonicalization-no-backfill-events/CONTRACT.edn
