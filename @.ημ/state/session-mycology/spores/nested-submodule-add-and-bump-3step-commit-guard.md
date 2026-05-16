# Skill Spore: nested-submodule-add-and-bump-3step-commit-guard

- Generated: 2026-04-28T23:41:27.115Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.73
- p-friction: 0.62
- p-skill-candidate: 0.74

## Lesson
When adding a new repo as a submodule inside an already-submoduled workspace, commit in the new repo first, then commit the containing repo's .gitmodules + submodule pointer, then commit the workspace root submodule pointer—stage only those paths to avoid unrelated submodule drift.

## Better path next time


## Candidate description
Protocol for nested submodule changes: (1) commit in new submodule repo, (2) add submodule and commit pointer + .gitmodules in parent repo, (3) commit parent repo pointer in workspace root; never stage other dirty submodules or untracked notes.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: nested-submodule-add-and-bump-3step-commit-guard
description: "Protocol for nested submodule changes: (1) commit in new submodule repo, (2) add submodule and commit pointer + .gitmodules in parent repo, (3) commit parent repo pointer in workspace root; never stage other dirty submodules or untracked notes."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# nested-submodule-add-and-bump-3step-commit-guard

## Goal
Protocol for nested submodule changes: (1) commit in new submodule repo, (2) add submodule and commit pointer + .gitmodules in parent repo, (3) commit parent repo pointer in workspace root; never stage other dirty submodules or untracked notes.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "nested-submodule-add-and-bump-3step-commit-guard")
  (v "ημ.skill/nested-submodule-add-and-bump-3step-commit-guard@0.0.1-spore")
  (intent "Protocol for nested submodule changes: (1) commit in new submodule repo, (2) add submodule and commit pointer + .gitmodules in parent repo, (3) commit parent repo pointer in workspace root; never stage other dirty submodules or untracked notes.")

  (activation
    (priority 35)
    (explicit ["skill:nested-submodule-add-and-bump-3step-commit-guard"])
    (triggers ["nested-submodule-add-and-bump-3step-commit-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/nested-submodule-add-and-bump-3step-commit-guard/SKILL.md
- /home/err/.pi/agent/skills/nested-submodule-add-and-bump-3step-commit-guard/CONTRACT.edn
