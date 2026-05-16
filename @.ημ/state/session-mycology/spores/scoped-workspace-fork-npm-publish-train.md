# Skill Spore: scoped-workspace-fork-npm-publish-train

- Generated: 2026-05-01T01:56:58.568Z
- Recurrence: 1
- CWD: /home/err/devel
- Reuse scope: multi-session
- Reflection kind: sporeworthy
- p-efficiency: 0.67
- p-friction: 0.77
- p-skill-candidate: 0.81

## Lesson
Publishing scoped fork packages can report success while npm view packuments lag; verify with access status, dist-tags, direct tarball HEAD, and downstream pnpm install before calling it done.

## Better path next time
Before broad text replacement, generate a package-dependency publish DAG and keep non-package/local extension imports out of the first re-scope commit to reduce accidental unrelated file touches.

## Candidate description
When publishing a forked monorepo under a new npm scope, rescope internal package names/imports, publish leaf-to-root with pnpm so workspace deps become exact versions, verify tarballs/dist-tags/install, then only update downstream consumers to semver after registry consumption succeeds.

## Promotion gate
Promote this spore into a live skill after either:
- recurrence >= 2
- explicit user request
- or strong evidence that the pattern generalizes beyond the current task

## Draft SKILL.md

~~~markdown
---
name: scoped-workspace-fork-npm-publish-train
description: "When publishing a forked monorepo under a new npm scope, rescope internal package names/imports, publish leaf-to-root with pnpm so workspace deps become exact versions, verify tarballs/dist-tags/install, then only update downstream consumers to semver after registry consumption succeeds."
disable-model-invocation: true
metadata:
  origin: session-mycology-spore
  recurrence: 1
---

# scoped-workspace-fork-npm-publish-train

## Goal
When publishing a forked monorepo under a new npm scope, rescope internal package names/imports, publish leaf-to-root with pnpm so workspace deps become exact versions, verify tarballs/dist-tags/install, then only update downstream consumers to semver after registry consumption succeeds.

## Use This Skill When
- The same friction pattern recurs.

## Do Not Use This Skill When
- The pain was only a one-off environment glitch.
~~~

## Draft CONTRACT.edn

~~~edn
(skill-contract
  (name "scoped-workspace-fork-npm-publish-train")
  (v "ημ.skill/scoped-workspace-fork-npm-publish-train@0.0.1-spore")
  (intent "When publishing a forked monorepo under a new npm scope, rescope internal package names/imports, publish leaf-to-root with pnpm so workspace deps become exact versions, verify tarballs/dist-tags/install, then only update downstream consumers to semver after registry consumption succeeds.")

  (activation
    (priority 35)
    (explicit ["skill:scoped-workspace-fork-npm-publish-train"])
    (triggers ["scoped-workspace-fork-npm-publish-train"]))

  (governance
    (touch-layer :mutable)
    (non-override [:mission :directives :safety :license :output-shape])
    (requires-user-approval false))
)~~~

## Suggested live-skill path

- /home/err/.pi/agent/skills/scoped-workspace-fork-npm-publish-train/SKILL.md
- /home/err/.pi/agent/skills/scoped-workspace-fork-npm-publish-train/CONTRACT.edn
