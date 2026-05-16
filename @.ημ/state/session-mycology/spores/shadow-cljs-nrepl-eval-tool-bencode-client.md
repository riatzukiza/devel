# Skill Spore: shadow-cljs-nrepl-eval-tool-bencode-client

- Generated: 2026-04-24T14:45:28.824Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: session
- Reflection kind: sporeworthy
- p-efficiency: 0.70
- p-friction: 0.68
- p-skill-candidate: 0.74

## Lesson


## Better path next time


## Candidate description
Implement a Knoxx custom tool that speaks nREPL bencode over node:net, clones a session, and evals either CLJ directly or CLJS via shadow.cljs.devtools.api/cljs-eval build-id; include safe output clipping, timeout handling, and strict role gating via capability + system prompt.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: shadow-cljs-nrepl-eval-tool-bencode-client
description: "Implement a Knoxx custom tool that speaks nREPL bencode over node:net, clones a session, and evals either CLJ directly or CLJS via shadow.cljs.devtools.api/cljs-eval build-id; include safe output clipping, timeout handling, and strict role gating via capability + system prompt."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# shadow-cljs-nrepl-eval-tool-bencode-client

## Goal
Implement a Knoxx custom tool that speaks nREPL bencode over node:net, clones a session, and evals either CLJ directly or CLJS via shadow.cljs.devtools.api/cljs-eval build-id; include safe output clipping, timeout handling, and strict role gating via capability + system prompt.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "shadow-cljs-nrepl-eval-tool-bencode-client")
  (v "ημ.skill/shadow-cljs-nrepl-eval-tool-bencode-client@0.0.1-spore")
  (intent "Implement a Knoxx custom tool that speaks nREPL bencode over node:net, clones a session, and evals either CLJ directly or CLJS via shadow.cljs.devtools.api/cljs-eval build-id; include safe output clipping, timeout handling, and strict role gating via capability + system prompt.")

  (activation
    (priority 35)
    (explicit ["skill:shadow-cljs-nrepl-eval-tool-bencode-client"])
    (triggers ["shadow-cljs-nrepl-eval-tool-bencode-client"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/shadow-cljs-nrepl-eval-tool-bencode-client/SKILL.md
- /home/err/.pi/agent/skills/shadow-cljs-nrepl-eval-tool-bencode-client/CONTRACT.edn
