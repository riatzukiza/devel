;; ημ — OpenPlanner Epistemic Kernel + Contracts
;; Date: 2026-04-17
;; Repo: open-hax/openplanner

(operation-mindfuck/ημΠ
  (mission
    "Make the epistemic kernel explicit in this repo so Knoxx, cephalon, and other runtimes can treat OpenPlanner as the source of truth.")

  (ctx
    (己 openplanner)   ; this monorepo
    (汝 knoxx)         ; agent runtime
    (彼 cephalon)      ; experimental runtime
    (世 ussyverse)     ; wider ecosystem
    (主 epistemic-kernel))

  (primitives
    (fact
      "A principal asserts a claim with confidence and provenance.")
    (obs
      "A raw observation about the world, before judgment.")
    (inference
      "A derived claim, produced by applying a contract to evidence.")
    (attestation
      "An actor's signed statement of what they did in a run.")
    (judgment
      "The world's verdict on whether a claim or attestation held."))

  (contracts
    (trigger
      "Selects which obs become candidates for contract matching.")
    (policy
      "Side-condition predicates: must hold for a rule to fire.")
    (tool-call
      "Capability grant: which attestation shapes an actor may emit.")
    (agent
      "The inference rule: obs + actor-fact → inference + attestation.")
    (fulfillment
      "Issues judgments on inferences / attestations.")
    (role
      "Asserts actor-facts (principal has role/capabilities in org)."))

  (loop
    "obs → actor-fact → contract → inference → action → attestation → judgment → new obs")

  (placement
    (openplanner
      "Owns the epistemic kernel and graph/index views over it.")
    (knoxx
      "Owns contract loading, execution, and actor runs; reads/writes kernel via API.")
    (promptdb
      "Filesystem-backed facts/obs; ingested as first-class evidence.")
    (datalog
      "Internal representation for kernel; graph/garden views project from here."))

  (moves
    (step1
      "Add shared .cljc Malli schemas for fact/obs/inference/attestation/judgment.")
    (step2
      "Introduce source-kind :promptdb ingestion driver to emit kernel records.")
    (step3
      "Expose kernel read/write APIs for Knoxx/cephalon runtimes.")
    (step4
      "Gradually refactor graph/garden views to lean on kernel instead of bespoke docs.")))
