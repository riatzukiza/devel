# AT Protocol auth standardization skill

## Status
Draft

## Goal
Create a reusable skill that standardizes human login, service identity, and inter-service auth around AT Protocol identities (Bluesky/ATProto), and register that skill in the operation-mindfuck skill graph.

## Background
- The current workspace has multiple services and hosts with ad-hoc bearer tokens and host-local secrets.
- The user wants a single human login flow rooted in a Bluesky account and does not want to think about repeated auth.
- The user explicitly requested a skill and explicit registration in the mindfuck skill registry.

## Constraints
- Treat the human identity anchor as an AT Protocol identity, not a local username/password silo.
- Prefer centralized auth-broker/session behaviors over per-service bespoke login flows.
- Standardize around DID-based identity and ATProto OAuth behaviors.
- The deliverable for this turn is the reusable skill + registry wiring, not a full system rollout across every service.

## Plan
1. Review pi skill docs and existing skill patterns.
2. Author a new global skill under `~/.pi/agent/skills/`.
3. Add a project-local OpenCode-visible skill link under `.opencode/skill/`.
4. Update workspace `AGENTS.md` so the skill is visible in the skill list.
5. Add the skill to `~/.pi/agent/operation-mindfuck/ημΠ.dev.v5.skill-graph.lisp`.
6. Verify the new files/links exist and the registry entry is present.

## Risks
- AT Protocol auth details evolve; the skill should encode durable architectural guidance, not brittle endpoint trivia.
- The skill must not overpromise a finished rollout that has not actually been implemented yet.
- Registry edits affect agent behavior globally, so the wording should stay bounded and reusable.

## Definition of done
- A new ATProto auth standardization skill exists with valid frontmatter.
- A matching `CONTRACT.edn` exists.
- `.opencode/skill/<name>/SKILL.md` points to the canonical skill.
- `AGENTS.md` references the new skill.
- The operation-mindfuck skill registry contains the new skill entry.
