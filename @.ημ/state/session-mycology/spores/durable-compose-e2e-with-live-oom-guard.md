# Skill Spore: durable-compose-e2e-with-live-oom-guard

- Generated: 2026-04-30T16:51:22.518Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.74
- p-friction: 0.58
- p-skill-candidate: 0.73

## Lesson
The correct path was to restart from services/openplanner, not source compose; live E2E exposed an unbounded graph export OOM, so verification had to include restart-count/OOM checks after endpoint tests.

## Better path next time
Before full E2E, query compose labels for working_dir/config_files, then run bounded smoke probes first, then expensive graph export/memory probes with timeout and inspect restart counters immediately.

## Candidate description
When restarting durable compose stacks that mount source artifacts, run from the services/ deployment repo, then use live bounded E2E probes that detect OOM/restart regressions and convert unbounded export endpoints into budgeted APIs before declaring the stack healthy.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: durable-compose-e2e-with-live-oom-guard
description: "When restarting durable compose stacks that mount source artifacts, run from the services/ deployment repo, then use live bounded E2E probes that detect OOM/restart regressions and convert unbounded export endpoints into budgeted APIs before declaring the stack healthy."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# durable-compose-e2e-with-live-oom-guard

## Goal
When restarting durable compose stacks that mount source artifacts, run from the services/ deployment repo, then use live bounded E2E probes that detect OOM/restart regressions and convert unbounded export endpoints into budgeted APIs before declaring the stack healthy.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "durable-compose-e2e-with-live-oom-guard")
  (v "ημ.skill/durable-compose-e2e-with-live-oom-guard@0.0.1-spore")
  (intent "When restarting durable compose stacks that mount source artifacts, run from the services/ deployment repo, then use live bounded E2E probes that detect OOM/restart regressions and convert unbounded export endpoints into budgeted APIs before declaring the stack healthy.")

  (activation
    (priority 35)
    (explicit ["skill:durable-compose-e2e-with-live-oom-guard"])
    (triggers ["durable-compose-e2e-with-live-oom-guard"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/durable-compose-e2e-with-live-oom-guard/SKILL.md
- /home/err/.pi/agent/skills/durable-compose-e2e-with-live-oom-guard/CONTRACT.edn
