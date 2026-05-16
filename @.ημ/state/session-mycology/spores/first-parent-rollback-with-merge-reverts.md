# Skill Spore: first-parent-rollback-with-merge-reverts

- Generated: 2026-04-28T17:15:44.072Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.77
- p-friction: 0.66
- p-skill-candidate: 0.74

## Lesson
When main is catastrophically unbuildable, the fastest truth-preserving recovery is 'rollback by explicit merge-revert chain to the last good first-parent commit' rather than trying to surgically fix type errors inside the broken history.

## Better path next time


## Candidate description
Protocol to restore a broken main without rebases/force-push: identify last good commit via bisect (requires sharing node_modules into worktree), then revert first-parent merge commits from HEAD back to just-after-good, keeping each revert as an explicit audit trail, and validate with build+tests before pushing a restore/* branch.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: first-parent-rollback-with-merge-reverts
description: "Protocol to restore a broken main without rebases/force-push: identify last good commit via bisect (requires sharing node_modules into worktree), then revert first-parent merge commits from HEAD back to just-after-good, keeping each revert as an explicit audit trail, and validate with build+tests before pushing a restore/* branch."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# first-parent-rollback-with-merge-reverts

## Goal
Protocol to restore a broken main without rebases/force-push: identify last good commit via bisect (requires sharing node_modules into worktree), then revert first-parent merge commits from HEAD back to just-after-good, keeping each revert as an explicit audit trail, and validate with build+tests before pushing a restore/* branch.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "first-parent-rollback-with-merge-reverts")
  (v "ημ.skill/first-parent-rollback-with-merge-reverts@0.0.1-spore")
  (intent "Protocol to restore a broken main without rebases/force-push: identify last good commit via bisect (requires sharing node_modules into worktree), then revert first-parent merge commits from HEAD back to just-after-good, keeping each revert as an explicit audit trail, and validate with build+tests before pushing a restore/* branch.")

  (activation
    (priority 35)
    (explicit ["skill:first-parent-rollback-with-merge-reverts"])
    (triggers ["first-parent-rollback-with-merge-reverts"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/first-parent-rollback-with-merge-reverts/SKILL.md
- /home/err/.pi/agent/skills/first-parent-rollback-with-merge-reverts/CONTRACT.edn
