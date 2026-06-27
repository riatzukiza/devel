(ns eta-mu.contracts
  "Public API for contract compilation and validation.
   Re-exports from eta-mu.contracts.core for convenience."
  (:require [eta-mu.contracts.core :as core]))

;; Re-export all public functions
(def compile-contract-program core/compile-contract-program)
(def select-contract-mode core/select-contract-mode)
(def compile-contract core/compile-contract)
(def extract-markdown-sections core/extract-markdown-sections)
(def count-semantic-items core/count-semantic-items)
(def validate-markdown-response core/validate-markdown-response)
(def to-failure-report core/to-failure-report)
(def compile-repair-prompt core/compile-repair-prompt)
