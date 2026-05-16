# Skill Spore: subrepo-path-scoped-commit-guard

- Generated: 2026-04-24T19:01:19.490Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.62
- p-friction: 0.74
- p-skill-candidate: 0.77

## Lesson
pi-coding-agent AgentSession.prompt only accepts string; for content parts use sendUserMessage and extract supported attachments; also verify staged file list before committing inside nested repos.

## Better path next time


## Candidate description
Protocol for committing in nested repos/submodules: always check `git diff --cached --name-only` and `git status --porcelain` in that repo before commit; if accidental multi-file commit happens, immediately `git reset --mixed HEAD~1` to restore and recommit path-scoped changes; optionally use `git commit <path>` or `git add -p`.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: subrepo-path-scoped-commit-guard
description: "Protocol for committing in nested repos/submodules: always check `git diff --cached --name-only` and `git status --porcelain` in that repo before commit; if accidental multi-file commit happens, immediately `git reset --mixed HEAD~1` to restore and recommit path-scoped changes; optionally use `git commit <path>` or `git add -p`."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# subrepo-path-scoped-commit-guard

## Goal
Protocol for committing in nested repos/submodules: always check `git diff --cached --name-only` and `git status --porcelain` in that repo before commit; if accidental multi-file commit happens, immediately `git reset --mixed HEAD~1` to restore and recommit path-scoped changes; optionally use `git commit <path>` or `git add -p`.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "subrepo-path-scoped-commit-guard")
  (v "ημ.skill/subrepo-path-scoped-commit-guard@0.0.1-spore")
  (intent "Protocol for committing in nested repos/submodules: always check `git diff --cached --name-only` and `git status --porcelain` in that repo before commit; if accidental multi-file commit happens, immediately `git reset --mixed HEAD~1` to restore and recommit path-scoped changes; optionally use `git commit <path>` or `git add -p`.")

  (activation
    (priority 35)
    (explicit ["skill:subrepo-path-scoped-commit-guard"])
    (triggers ["subrepo-path-scoped-commit-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/subrepo-path-scoped-commit-guard/SKILL.md
- /home/err/.pi/agent/skills/subrepo-path-scoped-commit-guard/CONTRACT.edn
