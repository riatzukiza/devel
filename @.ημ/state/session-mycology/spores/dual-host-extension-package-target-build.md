# Skill Spore: dual-host-extension-package-target-build

- Generated: 2026-04-29T02:17:01.519Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.76
- p-friction: 0.48
- p-skill-candidate: 0.74

## Lesson
The clean eta-mu build shape is DSL/spec -> shared runtime bundle -> per-host wrapper under package dist -> config registration, with dynamic-import verification for OpenCode wrappers.

## Better path next time
Start by confirming each host's plugin loading contract, then design package-root wrappers and config-sync before touching extension source.

## Candidate description
For extensions shared by Pi and OpenCode, build platform-neutral runtime bundles plus host-specific package-root wrappers, then register wrapper paths in host config instead of copying generated files into host plugin directories.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: dual-host-extension-package-target-build
description: "For extensions shared by Pi and OpenCode, build platform-neutral runtime bundles plus host-specific package-root wrappers, then register wrapper paths in host config instead of copying generated files into host plugin directories."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# dual-host-extension-package-target-build

## Goal
For extensions shared by Pi and OpenCode, build platform-neutral runtime bundles plus host-specific package-root wrappers, then register wrapper paths in host config instead of copying generated files into host plugin directories.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "dual-host-extension-package-target-build")
  (v "ημ.skill/dual-host-extension-package-target-build@0.0.1-spore")
  (intent "For extensions shared by Pi and OpenCode, build platform-neutral runtime bundles plus host-specific package-root wrappers, then register wrapper paths in host config instead of copying generated files into host plugin directories.")

  (activation
    (priority 35)
    (explicit ["skill:dual-host-extension-package-target-build"])
    (triggers ["dual-host-extension-package-target-build"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/dual-host-extension-package-target-build/SKILL.md
- /home/err/.pi/agent/skills/dual-host-extension-package-target-build/CONTRACT.edn
