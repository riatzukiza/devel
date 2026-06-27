(ns test-compilation
  (:require [clojure.test :refer [deftest is testing]]
            ;; Require all namespaces to ensure they are compiled and tracked for coverage
            [opencode-unified.buffers]
            [opencode-unified.command-palette]
            [opencode-unified.env]
            [opencode-unified.evil]
            [opencode-unified.keymap]
            [opencode-unified.layout]
            [opencode-unified.main]
            [opencode-unified.opencode]
            [opencode-unified.openplanner]
            [opencode-unified.persistence]
            [opencode-unified.plugins]
            [opencode-unified.react-reagent-seam]
            [opencode-unified.session-titles]
            [opencode-unified.state]
            [opencode-unified.theme]
            [opencode-unified.ui]
            [opencode-unified.workspace]))

(deftest test-all-namespaces-loaded
  (testing "namespaces compilation"
    (is true "All namespaces loaded successfully")))
