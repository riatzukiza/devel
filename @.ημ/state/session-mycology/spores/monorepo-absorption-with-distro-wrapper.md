# Skill Spore: monorepo-absorption-with-distro-wrapper

- Generated: 2026-04-29T16:54:57.907Z
- Recurrence: 1
- CWD: /home/err
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.82
- p-friction: 0.46
- p-skill-candidate: 0.74

## Lesson
For large absorption migrations, stage only target paths, preserve upstream licenses, expect strict pnpm to surface missing direct deps, and use a thin branded wrapper before changing imports.

## Better path next time


## Candidate description
Absorb an upstream monorepo's packages into a pnpm workspace while preserving package names first, relinking internal deps to workspace:*, adding branded wrapper packages, and smoke-building before a path-scoped commit.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: monorepo-absorption-with-distro-wrapper
description: "Absorb an upstream monorepo's packages into a pnpm workspace while preserving package names first, relinking internal deps to workspace:*, adding branded wrapper packages, and smoke-building before a path-scoped commit."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# monorepo-absorption-with-distro-wrapper

## Goal
Absorb an upstream monorepo's packages into a pnpm workspace while preserving package names first, relinking internal deps to workspace:*, adding branded wrapper packages, and smoke-building before a path-scoped commit.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "monorepo-absorption-with-distro-wrapper")
  (v "ημ.skill/monorepo-absorption-with-distro-wrapper@0.0.1-spore")
  (intent "Absorb an upstream monorepo's packages into a pnpm workspace while preserving package names first, relinking internal deps to workspace:*, adding branded wrapper packages, and smoke-building before a path-scoped commit.")

  (activation
    (priority 35)
    (explicit ["skill:monorepo-absorption-with-distro-wrapper"])
    (triggers ["monorepo-absorption-with-distro-wrapper"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/monorepo-absorption-with-distro-wrapper/SKILL.md
- /home/err/.pi/agent/skills/monorepo-absorption-with-distro-wrapper/CONTRACT.edn
