# Skill Spore: bulk-fork-and-repoint-submodules-gh

- Generated: 2026-04-28T17:54:34.761Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.72
- p-friction: 0.67
- p-skill-candidate: 0.78

## Lesson
GitHub fork creation triggers secondary throttling; build backoff+exception ledger, and derive fork URL from .gitmodules for consistency when repointing local remotes.

## Better path next time


## Candidate description
Protocol to (1) enumerate submodules for an org prefix, (2) ensure forks exist under a target owner with gh, handling secondary rate limits, (3) rewrite .gitmodules to fork-first SSH URLs with exception list, (4) set per-submodule remotes origin/upstream deterministically, and (5) commit only scoped files.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: bulk-fork-and-repoint-submodules-gh
description: "Protocol to (1) enumerate submodules for an org prefix, (2) ensure forks exist under a target owner with gh, handling secondary rate limits, (3) rewrite .gitmodules to fork-first SSH URLs with exception list, (4) set per-submodule remotes origin/upstream deterministically, and (5) commit only scoped files."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# bulk-fork-and-repoint-submodules-gh

## Goal
Protocol to (1) enumerate submodules for an org prefix, (2) ensure forks exist under a target owner with gh, handling secondary rate limits, (3) rewrite .gitmodules to fork-first SSH URLs with exception list, (4) set per-submodule remotes origin/upstream deterministically, and (5) commit only scoped files.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "bulk-fork-and-repoint-submodules-gh")
  (v "ημ.skill/bulk-fork-and-repoint-submodules-gh@0.0.1-spore")
  (intent "Protocol to (1) enumerate submodules for an org prefix, (2) ensure forks exist under a target owner with gh, handling secondary rate limits, (3) rewrite .gitmodules to fork-first SSH URLs with exception list, (4) set per-submodule remotes origin/upstream deterministically, and (5) commit only scoped files.")

  (activation
    (priority 35)
    (explicit ["skill:bulk-fork-and-repoint-submodules-gh"])
    (triggers ["bulk-fork-and-repoint-submodules-gh"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/bulk-fork-and-repoint-submodules-gh/SKILL.md
- /home/err/.pi/agent/skills/bulk-fork-and-repoint-submodules-gh/CONTRACT.edn
