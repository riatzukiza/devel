# Skill Spore: submodule-safe-root-commit-scope-guard

- Generated: 2026-04-28T23:29:06.205Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.66
- p-friction: 0.74
- p-skill-candidate: 0.78

## Lesson
In multi-submodule workspaces, root git commits can accidentally include pre-staged submodule/.gitmodules changes; use path-scoped staging and inspect --cached before committing.

## Better path next time


## Candidate description
Protocol for working in a monorepo with many dirty submodules: always commit inside submodule first, then stage only the submodule pointer + explicitly intended root paths; verify index is clean before committing to avoid accidentally committing unrelated submodule/.gitmodules drift.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: submodule-safe-root-commit-scope-guard
description: "Protocol for working in a monorepo with many dirty submodules: always commit inside submodule first, then stage only the submodule pointer + explicitly intended root paths; verify index is clean before committing to avoid accidentally committing unrelated submodule/.gitmodules drift."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# submodule-safe-root-commit-scope-guard

## Goal
Protocol for working in a monorepo with many dirty submodules: always commit inside submodule first, then stage only the submodule pointer + explicitly intended root paths; verify index is clean before committing to avoid accidentally committing unrelated submodule/.gitmodules drift.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "submodule-safe-root-commit-scope-guard")
  (v "ημ.skill/submodule-safe-root-commit-scope-guard@0.0.1-spore")
  (intent "Protocol for working in a monorepo with many dirty submodules: always commit inside submodule first, then stage only the submodule pointer + explicitly intended root paths; verify index is clean before committing to avoid accidentally committing unrelated submodule/.gitmodules drift.")

  (activation
    (priority 35)
    (explicit ["skill:submodule-safe-root-commit-scope-guard"])
    (triggers ["submodule-safe-root-commit-scope-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/submodule-safe-root-commit-scope-guard/SKILL.md
- /home/err/.pi/agent/skills/submodule-safe-root-commit-scope-guard/CONTRACT.edn
