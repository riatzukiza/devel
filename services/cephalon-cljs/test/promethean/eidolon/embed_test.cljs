(ns promethean.eidolon.embed-test
  (:require [cljs.test :refer-macros [deftest is testing]]
            [clojure.string :as str]
            [promethean.eidolon.embed :as embed]))

(deftest circuit-label-test
  (testing "circuit-label mapping for known circuits"
    (is (= "Circuit 1: Survival (health, uptime, safety)" (embed/circuit-label :c1-survival)))
    (is (= "Circuit 2: Social/Permission (relationships, access)" (embed/circuit-label :c2-social))))

  (testing "fallback circuit label uses name"
    (is (= "Circuit: something" (embed/circuit-label :something)))))

(deftest core-embedding-prompt-test
  (let [prompt (embed/core-embedding-prompt {:agent-name "Alice"
                                             :circuit :c1-survival
                                             :persistent "pers"
                                             :recent "rec"
                                             :latest "LATEST"
                                             :tags ["tag1" "tag2"]})]
    (is (str/includes? prompt "You are generating a deterministic embedding input."))
    (is (str/includes? prompt "Persistently"))
    (is (str/includes? prompt "pers"))
    (is (str/includes? prompt "As it relates to Alice:"))
    (is (str/includes? prompt "LATEST"))
    (is (str/includes? prompt "- tag1"))
    (is (str/includes? prompt "- tag2"))))

(deftest memory-embedding-input-test
  (let [mem {:memory/text "TEXT MEM" :memory/tags ["tagA" "tagB"]}]
    (let [out (embed/memory->embedding-input {:agent-name "Alice" :circuit :c2-social :persistent-snippet "persn" :recent-snippet "rec"} mem)]
      (is (str/includes? out "Circuit 2: Social/Permission (relationships, access)"))
      (is (str/includes? out "TEXT MEM"))
      (is (str/includes? out "- tagA"))
      (is (str/includes? out "- tagB")))))
