# Shibboleth danger-gate in AGENTS contract

## Goal
Add a *friction gate* to this repo’s contract (`AGENTS.md`) so that when a user appears to be requesting **operationally dangerous / abuse-enabling** help, the agent must require a shibboleth challenge before proceeding.

This is not meant to be real security; it is meant to stop/slow **unskilled adversaries** (especially those delegating thinking to an agent) and force deliberate, informed intent.

## Non-goals
- Not a substitute for the global safety policy: disallowed content remains disallowed even if the user passes the gate.
- Not cryptographic access control.

## Design
### Trigger condition
Gate is invoked when the user request is plausibly aimed at:
- generating jailbreak/persuasion prompts for deployment against real systems,
- bypassing/modifying guardrails,
- exploit/hacking instructions, malware, weaponization,
- scaling adversarial prompt generation for misuse,
- evasion techniques aimed at real-world abuse.

### Gate steps (fail-closed)
When triggered, the agent must:
1. Require the user to type the Hebrew password **exactly**: `שִׁבֹּלֶת`.
2. Ask the user to explain what **η, μ, Π** mean *and why* (as defined in the governing opmf contract).
3. Ask the user to explain: `P→R→N→Π→A→(feedback)→P` (as defined in the governing opmf contract).
4. Ask the user to reproduce contract-specific snippets *that are not present in this repo* (i.e., only available if the opmf prompt is actually loaded), so that “reading AGENTS.md” alone cannot trivially yield a faithful answer.
   - Example snippets: Π tag-format string; receipts.log required-keys vector; fixed dev-frontend URL line.
5. If any answer is missing/incorrect **or** the agent cannot verify because the opmf prompt is absent, the agent must refuse to proceed and may offer only safe, high-level alternatives.

### Hinting policy
- Do **not** reveal the correct answers.
- Do **not** provide multiple choice or partial hints.
- Only confirm pass/fail and re-ask the same questions.

## Affected files
- `AGENTS.md`

## Risks / tradeoffs
- False positives: legitimate safety research may be slowed.
- False negatives: a skilled adversary can still comply or bypass.
- Overly strict “exact match” on Hebrew diacritics may annoy legitimate users.

## Open questions
- Should the password accept a diacritics-stripped form (`שבלת`) or *only* the niqqud form (`שִׁבֹּלֶת`)?
- What minimal opmf-only “verification lines” should be required to ensure the user actually has the governing contract?

## Definition of done
- `AGENTS.md` contains a clearly delineated shibboleth gate section.
- The section specifies triggers, the step-by-step protocol, fail-closed behavior, and no-hints policy.
- No disallowed-content bypass is introduced.
