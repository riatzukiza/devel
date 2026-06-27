;; ============================================================
;; Skill Graph + Contract Registry (EDN list-forms)
;; ============================================================

(skill-system
  (rule
    "Skills are subordinate protocol modules. They MAY extend mutable protocol.")
  (rule
    "Skills MUST NOT override doctrine/immutable constraints (mission, directives, safety, license, output-shape) unless the user explicitly approves.")
  (rule
    "A skill MAY expose followup registry entries via (exposes (skill-registry ...)) inside its CONTRACT.edn.")
  (rule
    "Registry expansion is bounded and deterministic; ambiguous matches require user choice.")
  (rule
    "If a skill emits EDN contracts/facts in assistant output, they SHOULD appear in fenced ```edn blocks so runtime linting can validate them."))

(skill-registry
  (root "~/.pi/agent/skills")

  ;; ============================================================
  ;; CORE SKILLS (autoloaded)
  ;; ============================================================

  (entry
    (name "work-cycle")
    (contract "~/.pi/agent/skills/work-cycle/CONTRACT.edn")
    (priority 100)
    (autoload true)
    (description "Foundational cognitive loop: observe→model→plan→execute→verify→record, PRNPA loop, methodology."))

  (entry
    (name "agent-runtime-state")
    (contract "~/.pi/agent/skills/agent-runtime-state/CONTRACT.edn")
    (priority 85)
    (autoload true)
    (description "Runtime registers, startup procedure, drift detection, session continuity, tick model."))

  (entry
    (name "fork-tax")
    (contract "~/.pi/agent/skills/fork-tax/CONTRACT.edn")
    (priority 90)
    (autoload false)
    (description "Persist working state into git: commit + tag + push + manifest artifacts."))

  (entry
    (name "receipt-river")
    (contract "~/.pi/agent/skills/receipt-river/CONTRACT.edn")
    (priority 62)
    (autoload true)
    (description "Append-only receipts.log for execution state recovery."))

  (entry
    (name "regression-triage")
    (contract "~/.pi/agent/skills/regression-triage/CONTRACT.edn")
    (priority 80)
    (autoload false)
    (description "Investigate regressions: locate introducing change, choose rollback vs fix-forward, add regression test."))

  (entry
    (name "spec-driven-dev")
    (contract "~/.pi/agent/skills/spec-driven-dev/CONTRACT.edn")
    (priority 70)
    (autoload false)
    (description "Spec + phases + verification. Kanban FSM integration."))

  ;; ============================================================
  ;; META-GOVERNANCE (rarely invoked)
  ;; ============================================================

  (entry
    (name "contract-governance")
    (contract "~/.pi/agent/skills/contract-governance/CONTRACT.edn")
    (priority 30)
    (autoload false)
    (description "Amendments, versioning, rollback, constitutional layers."))

  ;; ============================================================
  ;; DOMAIN SKILLS (on-demand)
  ;; ============================================================

  (entry
    (name "atproto-auth-standardization")
    (contract "~/.pi/agent/skills/atproto-auth-standardization/CONTRACT.edn")
    (priority 72))

  (entry
    (name "promethean-host-runtime-inventory")
    (contract "~/.pi/agent/skills/promethean-host-runtime-inventory/CONTRACT.edn")
    (priority 75))

  (entry
    (name "promptdb-contracts")
    (contract "~/.pi/agent/skills/promptdb-contracts/CONTRACT.edn")
    (priority 60)))

;; ============================================================
;; END SKILL REGISTRY
;; ============================================================