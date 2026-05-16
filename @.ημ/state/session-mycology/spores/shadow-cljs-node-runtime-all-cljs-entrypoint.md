# Skill Spore: shadow-cljs-node-runtime-all-cljs-entrypoint

- Generated: 2026-04-24T14:12:42.733Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.77
- p-friction: 0.55
- p-skill-candidate: 0.76

## Lesson


## Better path next time


## Candidate description
Pattern for eliminating handwritten Node shims: create CLJS entrypoint ns that imports Node deps, provide runtime shims (fs promises + createReadStream), add shadow build {:target :esm :runtime :node :modules {:server {:init-fn ...}}}, update package.json scripts, and remove js/require usage by switching to ESM imports.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: shadow-cljs-node-runtime-all-cljs-entrypoint
description: "Pattern for eliminating handwritten Node shims: create CLJS entrypoint ns that imports Node deps, provide runtime shims (fs promises + createReadStream), add shadow build {:target :esm :runtime :node :modules {:server {:init-fn ...}}}, update package.json scripts, and remove js/require usage by switching to ESM imports."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# shadow-cljs-node-runtime-all-cljs-entrypoint

## Goal
Pattern for eliminating handwritten Node shims: create CLJS entrypoint ns that imports Node deps, provide runtime shims (fs promises + createReadStream), add shadow build {:target :esm :runtime :node :modules {:server {:init-fn ...}}}, update package.json scripts, and remove js/require usage by switching to ESM imports.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "shadow-cljs-node-runtime-all-cljs-entrypoint")
  (v "ημ.skill/shadow-cljs-node-runtime-all-cljs-entrypoint@0.0.1-spore")
  (intent "Pattern for eliminating handwritten Node shims: create CLJS entrypoint ns that imports Node deps, provide runtime shims (fs promises + createReadStream), add shadow build {:target :esm :runtime :node :modules {:server {:init-fn ...}}}, update package.json scripts, and remove js/require usage by switching to ESM imports.")

  (activation
    (priority 35)
    (explicit ["skill:shadow-cljs-node-runtime-all-cljs-entrypoint"])
    (triggers ["shadow-cljs-node-runtime-all-cljs-entrypoint"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/shadow-cljs-node-runtime-all-cljs-entrypoint/SKILL.md
- /home/err/.pi/agent/skills/shadow-cljs-node-runtime-all-cljs-entrypoint/CONTRACT.edn
