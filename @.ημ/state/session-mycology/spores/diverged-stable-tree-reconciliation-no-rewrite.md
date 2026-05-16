# Skill Spore: diverged-stable-tree-reconciliation-no-rewrite

- Generated: 2026-04-29T01:36:02.139Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.64
- p-friction: 0.82
- p-skill-candidate: 0.78

## Lesson
For heavily diverged histories after rollback recovery, a transparent 'stable tree over recovered main' merge can be safer and clearer than forcing a giant cherry-pick conflict campaign in one sitting.

## Better path next time


## Candidate description
When a working stable branch diverges from a recovered rollback main, tag the stable tip, test it, attempt explicit cherry-picks only until conflict complexity is proven, then use an audited ours-merge from stable to record recovered-main ancestry while preserving the stable tree; push WIP backup branches for abandoned approaches.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: diverged-stable-tree-reconciliation-no-rewrite
description: "When a working stable branch diverges from a recovered rollback main, tag the stable tip, test it, attempt explicit cherry-picks only until conflict complexity is proven, then use an audited ours-merge from stable to record recovered-main ancestry while preserving the stable tree; push WIP backup branches for abandoned approaches."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# diverged-stable-tree-reconciliation-no-rewrite

## Goal
When a working stable branch diverges from a recovered rollback main, tag the stable tip, test it, attempt explicit cherry-picks only until conflict complexity is proven, then use an audited ours-merge from stable to record recovered-main ancestry while preserving the stable tree; push WIP backup branches for abandoned approaches.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "diverged-stable-tree-reconciliation-no-rewrite")
  (v "ημ.skill/diverged-stable-tree-reconciliation-no-rewrite@0.0.1-spore")
  (intent "When a working stable branch diverges from a recovered rollback main, tag the stable tip, test it, attempt explicit cherry-picks only until conflict complexity is proven, then use an audited ours-merge from stable to record recovered-main ancestry while preserving the stable tree; push WIP backup branches for abandoned approaches.")

  (activation
    (priority 35)
    (explicit ["skill:diverged-stable-tree-reconciliation-no-rewrite"])
    (triggers ["diverged-stable-tree-reconciliation-no-rewrite"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/diverged-stable-tree-reconciliation-no-rewrite/SKILL.md
- /home/err/.pi/agent/skills/diverged-stable-tree-reconciliation-no-rewrite/CONTRACT.edn
