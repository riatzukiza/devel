(ns promptbench.core-test
  (:require [clojure.test :refer [deftest is testing]]))

(deftest project-infrastructure-test
  (testing "Shibboleth project skeleton is functional"
    (is (= 1 1) "Basic assertion passes")
    (is (some? (find-ns 'clojure.spec.alpha))
        "clojure.spec.alpha is available after require"))

  (testing "Core namespace loads"
    (require 'promptbench.core)
    (is (some? (find-ns 'promptbench.core))
        "promptbench.core namespace is loadable")))
