(ns eta-mu.extensions.prompt-section-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.extensions.prompt-section :as prompt-section]))

(def start "<!-- eta-mu:test:start -->")
(def end "<!-- eta-mu:test:end -->")

(deftest upsert-section-appends-when-missing
  (is (= "base\n\n<!-- eta-mu:test:start -->\nbody\n<!-- eta-mu:test:end -->"
         (prompt-section/upsert-section "base" start end "body"))))

(deftest upsert-section-replaces-existing-block
  (testing "existing injected content is replaced rather than duplicated"
    (let [initial (prompt-section/upsert-section "base" start end "one")
          next    (prompt-section/upsert-section initial start end "two")]
      (is (= "base\n\n<!-- eta-mu:test:start -->\ntwo\n<!-- eta-mu:test:end -->"
             next))
      (is (.includes next "two"))
      (is (not (.includes next "one"))))))

(deftest upsert-section-removes-broken-tail
  (testing "unterminated prior section is stripped before reinjection"
    (let [broken "base\n\n<!-- eta-mu:test:start -->\nold"
          next   (prompt-section/upsert-section broken start end "fresh")]
      (is (.includes next "fresh"))
      (is (not (.includes next "old"))))))

(deftest upsert-section-can-remove-section
  (is (= "base"
         (prompt-section/upsert-section
           "base\n\n<!-- eta-mu:test:start -->\nbody\n<!-- eta-mu:test:end -->"
           start end ""))))