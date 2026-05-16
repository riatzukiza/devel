# Skill Spore: pm2-shadow-cljs-hot-dev-restart-guard

- Generated: 2026-04-29T03:48:51.611Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.66
- p-friction: 0.71
- p-skill-candidate: 0.77

## Lesson
A PM2 wrapper can be 'online' while a rebuilt CLJS Node child has crashed from a newly-surfaced missing npm dependency; always pair restart with endpoint curl/log verification.

## Better path next time


## Candidate description
When restarting a PM2 app that wraps shadow-cljs watch plus Node runtime, verify both the wrapper process and the child runtime by curling an endpoint and checking new module-resolution failures after the rebuild, not just PM2 online status.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: pm2-shadow-cljs-hot-dev-restart-guard
description: "When restarting a PM2 app that wraps shadow-cljs watch plus Node runtime, verify both the wrapper process and the child runtime by curling an endpoint and checking new module-resolution failures after the rebuild, not just PM2 online status."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# pm2-shadow-cljs-hot-dev-restart-guard

## Goal
When restarting a PM2 app that wraps shadow-cljs watch plus Node runtime, verify both the wrapper process and the child runtime by curling an endpoint and checking new module-resolution failures after the rebuild, not just PM2 online status.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "pm2-shadow-cljs-hot-dev-restart-guard")
  (v "ημ.skill/pm2-shadow-cljs-hot-dev-restart-guard@0.0.1-spore")
  (intent "When restarting a PM2 app that wraps shadow-cljs watch plus Node runtime, verify both the wrapper process and the child runtime by curling an endpoint and checking new module-resolution failures after the rebuild, not just PM2 online status.")

  (activation
    (priority 35)
    (explicit ["skill:pm2-shadow-cljs-hot-dev-restart-guard"])
    (triggers ["pm2-shadow-cljs-hot-dev-restart-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/pm2-shadow-cljs-hot-dev-restart-guard/SKILL.md
- /home/err/.pi/agent/skills/pm2-shadow-cljs-hot-dev-restart-guard/CONTRACT.edn
