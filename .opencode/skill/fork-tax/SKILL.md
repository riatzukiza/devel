---
name: fork-tax
description: Persist the full working state into git (commit + tag + push + manifest artifacts) as a deterministic handoff snapshot. Use when the user requests Π / fork tax / full dump.
---

# Skill: Fork Tax (Π)

## Goal
Create a deterministic handoff snapshot via git: commit, tag, push, and in-repo manifest artifacts.

## Use This Skill When
- The user says "Π" or "pay the fork tax" or requests a "full dump" / "snapshot" / "handoff".

## Do Not Use This Skill When
- The user has not requested a handoff/snapshot.
- You suspect secrets are present in the working tree (stop and redact first).
- The workspace is shared and you are about to use blanket reset/restore/clean/add-all behavior without an explicit path scope.

## Multi-Agent Guardrails
- Assume other agents may be touching the same repo unless the user explicitly says you have exclusivity.
- Treat unrelated dirty paths as live concurrent work, not as garbage to clear.
- Never use repo-wide `git reset`, `git restore`, `git clean`, checkout rewinds, or similar destructive cleanup against shared dirt.
- Prefer path-scoped staging (`git add -- <paths>`, `git add -u -- <paths>`) over blanket `git add -A` in shared workspaces.
- If concurrent dirt cannot be safely absorbed, record it in `.ημ` artifacts as a blocker/residual instead of deleting or unstaging it.
- For recursive submodule Π work, only update root pointers for submodule commits that were actually preserved/pushed; leave local-only or blocked dirt unstaged and documented.

## Steps
1. Confirm repository root, current branch, and whether the workspace appears shared/concurrently modified.
2. Check `git status` and split dirt into: owned target paths, concurrent/unowned paths, and blocked/generated/runtime paths.
3. Run the smallest relevant verification on the owned target paths if available.
4. Write/update in-repo handoff artifacts (`.ημ/Π_STATE.sexp`, `.ημ/Π_LAST.md`, manifest hashes), explicitly noting concurrent dirt you did not absorb.
5. Commit only the owned/stageable repo-relevant changes; avoid destructive cleanup of unrelated work.
6. Create a deterministic Π tag.
7. Push branch + tag to remote (record failures verbatim if blocked).

## Output
- A Π commit and tag.
- Updated `.ημ/*` handoff artifacts.
- Verification notes (run or skipped with reason).
- A clear record of concurrent dirt/blockers that were intentionally left untouched.
