# Skill Spore: git-recovery-freeze-stable-tip-no-rewrite

- Generated: 2026-04-28T16:58:37.826Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.82
- p-friction: 0.44
- p-skill-candidate: 0.73

## Lesson
Freezing the stable tip with a pushed backup branch + annotated tag is the quickest way to guarantee nothing is lost before attempting main/staging recovery.

## Better path next time


## Candidate description
Protocol for messy divergence recovery: commit any untracked/dirty state, create backup/<branch>-<date> and stable/<branch>-<date> annotated tag, push via SSH if HTTPS auth missing, and explicitly avoid force-push/rebase to preserve audit trail.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: git-recovery-freeze-stable-tip-no-rewrite
description: "Protocol for messy divergence recovery: commit any untracked/dirty state, create backup/<branch>-<date> and stable/<branch>-<date> annotated tag, push via SSH if HTTPS auth missing, and explicitly avoid force-push/rebase to preserve audit trail."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# git-recovery-freeze-stable-tip-no-rewrite

## Goal
Protocol for messy divergence recovery: commit any untracked/dirty state, create backup/<branch>-<date> and stable/<branch>-<date> annotated tag, push via SSH if HTTPS auth missing, and explicitly avoid force-push/rebase to preserve audit trail.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "git-recovery-freeze-stable-tip-no-rewrite")
  (v "ημ.skill/git-recovery-freeze-stable-tip-no-rewrite@0.0.1-spore")
  (intent "Protocol for messy divergence recovery: commit any untracked/dirty state, create backup/<branch>-<date> and stable/<branch>-<date> annotated tag, push via SSH if HTTPS auth missing, and explicitly avoid force-push/rebase to preserve audit trail.")

  (activation
    (priority 35)
    (explicit ["skill:git-recovery-freeze-stable-tip-no-rewrite"])
    (triggers ["git-recovery-freeze-stable-tip-no-rewrite"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/git-recovery-freeze-stable-tip-no-rewrite/SKILL.md
- /home/err/.pi/agent/skills/git-recovery-freeze-stable-tip-no-rewrite/CONTRACT.edn
