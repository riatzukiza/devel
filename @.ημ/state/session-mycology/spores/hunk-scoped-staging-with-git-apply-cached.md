# Skill Spore: hunk-scoped-staging-with-git-apply-cached

- Generated: 2026-04-28T15:24:30.937Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.74
- p-friction: 0.66
- p-skill-candidate: 0.76

## Lesson
When repo has pre-existing uncommitted changes, stage the intended hunks via a filtered git-diff patch + `git apply --cached` to avoid discarding or accidentally committing unrelated work.

## Better path next time


## Candidate description
Protocol: generate patch from `git diff` and filter to desired hunks, then `git apply --cached` to stage only targeted changes when interactive `git add -p` is awkward or uncommitted work must be preserved.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: hunk-scoped-staging-with-git-apply-cached
description: "Protocol: generate patch from `git diff` and filter to desired hunks, then `git apply --cached` to stage only targeted changes when interactive `git add -p` is awkward or uncommitted work must be preserved."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# hunk-scoped-staging-with-git-apply-cached

## Goal
Protocol: generate patch from `git diff` and filter to desired hunks, then `git apply --cached` to stage only targeted changes when interactive `git add -p` is awkward or uncommitted work must be preserved.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "hunk-scoped-staging-with-git-apply-cached")
  (v "ημ.skill/hunk-scoped-staging-with-git-apply-cached@0.0.1-spore")
  (intent "Protocol: generate patch from `git diff` and filter to desired hunks, then `git apply --cached` to stage only targeted changes when interactive `git add -p` is awkward or uncommitted work must be preserved.")

  (activation
    (priority 35)
    (explicit ["skill:hunk-scoped-staging-with-git-apply-cached"])
    (triggers ["hunk-scoped-staging-with-git-apply-cached"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/hunk-scoped-staging-with-git-apply-cached/SKILL.md
- /home/err/.pi/agent/skills/hunk-scoped-staging-with-git-apply-cached/CONTRACT.edn
