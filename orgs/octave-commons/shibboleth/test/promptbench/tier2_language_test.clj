(ns promptbench.tier2-language-test
  "Tests for tier-2 language support in MT and code-mix transforms.

   Fulfills:
   - VAL-MULTI-004 (Tier-2 MT language support complete)
   - VAL-MULTI-005 (Code-mix tier-2 word tables)

   Verifies:
   - lang-names contains all 20 languages (10 tier-1 + 10 tier-2)
   - Code-mix word-tables has entries for 5+ tier-2 languages
   - Code-mix produces different output for tier-2 languages"
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [clojure.string :as str]
            [promptbench.transform.mt :as mt]
            [promptbench.transform.codemix :as codemix]
            [promptbench.transform.core :as core]
            [promptbench.transform.registry :as registry]))

;; ============================================================
;; Fixture: Reset registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (registry/reset!)
    (f)))

;; ============================================================
;; Helper: Register code-mix transform
;; ============================================================

(defn- register-codemix-transform! []
  (registry/register-transform!
    :code-mix
    {:description   "Inter/intra-sentential code-mixing"
     :type          :linguistic
     :deterministic true
     :reversible    false
     :params-spec   {:mix-rate {:type :double :default 0.25}
                     :strategy {:type :keyword :default :inter-sentential}
                     :l2       {:type :keyword :required true}}
     :provenance    [:mix-rate :strategy :l2 :seed]
     :impl          codemix/apply-codemix}))

;; ============================================================
;; VAL-MULTI-004: Tier-2 MT language support complete
;; ============================================================

(def ^:private tier-1-langs
  #{:es :fr :de :ja :zh :ar :hi :pt :ru :ko})

(def ^:private tier-2-langs
  #{:tl :sw :ur :bn :th :vi :id :tr :fa :he})

(def ^:private all-langs
  (into tier-1-langs tier-2-langs))

(deftest lang-names-contains-all-20-languages-test
  (testing "lang-names map contains exactly 20 entries (10 tier-1 + 10 tier-2)"
    (is (= 20 (count mt/lang-names))
        (str "Expected 20 languages but found " (count mt/lang-names)))))

(deftest lang-names-contains-all-tier-1-test
  (testing "lang-names contains all 10 tier-1 languages"
    (doseq [lang tier-1-langs]
      (is (contains? mt/lang-names lang)
          (str "Missing tier-1 language: " lang)))))

(deftest lang-names-contains-all-tier-2-test
  (testing "lang-names contains all 10 tier-2 languages"
    (doseq [lang tier-2-langs]
      (is (contains? mt/lang-names lang)
          (str "Missing tier-2 language: " lang)))))

(deftest lang-names-keys-match-all-expected-test
  (testing "lang-names keys are exactly the expected 20 languages"
    (is (= all-langs (set (keys mt/lang-names)))
        "lang-names should contain exactly the 20 tier-1 + tier-2 languages")))

(deftest lang-names-values-are-non-blank-strings-test
  (testing "All lang-names values are non-blank strings"
    (doseq [[lang name-str] mt/lang-names]
      (is (string? name-str)
          (str "Value for " lang " should be a string"))
      (is (not (str/blank? name-str))
          (str "Value for " lang " should not be blank")))))

(deftest lang-names-tier-2-specific-values-test
  (testing "Tier-2 languages have correct human-readable names"
    (is (= "Tagalog" (get mt/lang-names :tl)))
    (is (= "Swahili" (get mt/lang-names :sw)))
    (is (= "Urdu" (get mt/lang-names :ur)))
    (is (= "Bengali" (get mt/lang-names :bn)))
    (is (= "Thai" (get mt/lang-names :th)))
    (is (= "Vietnamese" (get mt/lang-names :vi)))
    (is (= "Indonesian" (get mt/lang-names :id)))
    (is (= "Turkish" (get mt/lang-names :tr)))
    (is (= "Persian" (get mt/lang-names :fa)))
    (is (= "Hebrew" (get mt/lang-names :he)))))

;; ============================================================
;; VAL-MULTI-005: Code-mix tier-2 word tables
;; ============================================================

(def ^:private tier-2-codemix-langs
  "Tier-2 languages with Latin-script word tables: tr, vi, id, sw, tl"
  #{:tr :vi :id :sw :tl})

(deftest codemix-word-tables-has-5-plus-tier-2-test
  (testing "word-tables has entries for at least 5 tier-2 languages"
    (let [tier-2-in-tables (filter #(contains? codemix/word-tables %)
                                    tier-2-langs)]
      (is (>= (count tier-2-in-tables) 5)
          (str "Expected >= 5 tier-2 languages in word-tables, found "
               (count tier-2-in-tables) ": " (vec tier-2-in-tables))))))

(deftest codemix-word-tables-has-required-tier-2-test
  (testing "word-tables has entries for the 5 Latin-script tier-2 languages"
    (doseq [lang tier-2-codemix-langs]
      (is (contains? codemix/word-tables lang)
          (str "Missing tier-2 language in word-tables: " lang)))))

(deftest codemix-word-tables-tier-2-min-5-pairs-test
  (testing "Each tier-2 word table has >= 5 word pairs"
    (doseq [lang tier-2-codemix-langs]
      (let [table (get codemix/word-tables lang)]
        (is (>= (count table) 5)
            (str "Language " lang " has " (count table)
                 " word pairs, expected >= 5"))))))

(deftest codemix-produces-different-output-for-tier-2-turkish-test
  (testing "Code-mix produces different output for Turkish (tier-2)"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          result (core/execute-transform
                   :code-mix input
                   {:mix-rate 0.8 :strategy :intra-sentential :l2 :tr}
                   42)]
      (is (not= input (:text result))
          "Turkish code-mix output should differ from input")
      (is (not (str/blank? (:text result)))
          "Turkish code-mix output should not be blank"))))

(deftest codemix-produces-different-output-for-tier-2-vietnamese-test
  (testing "Code-mix produces different output for Vietnamese (tier-2)"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          result (core/execute-transform
                   :code-mix input
                   {:mix-rate 0.8 :strategy :intra-sentential :l2 :vi}
                   42)]
      (is (not= input (:text result))
          "Vietnamese code-mix output should differ from input")
      (is (not (str/blank? (:text result)))
          "Vietnamese code-mix output should not be blank"))))

(deftest codemix-produces-different-output-for-tier-2-indonesian-test
  (testing "Code-mix produces different output for Indonesian (tier-2)"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          result (core/execute-transform
                   :code-mix input
                   {:mix-rate 0.8 :strategy :intra-sentential :l2 :id}
                   42)]
      (is (not= input (:text result))
          "Indonesian code-mix output should differ from input")
      (is (not (str/blank? (:text result)))
          "Indonesian code-mix output should not be blank"))))

(deftest codemix-produces-different-output-for-tier-2-swahili-test
  (testing "Code-mix produces different output for Swahili (tier-2)"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          result (core/execute-transform
                   :code-mix input
                   {:mix-rate 0.8 :strategy :intra-sentential :l2 :sw}
                   42)]
      (is (not= input (:text result))
          "Swahili code-mix output should differ from input")
      (is (not (str/blank? (:text result)))
          "Swahili code-mix output should not be blank"))))

(deftest codemix-produces-different-output-for-tier-2-tagalog-test
  (testing "Code-mix produces different output for Tagalog (tier-2)"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          result (core/execute-transform
                   :code-mix input
                   {:mix-rate 0.8 :strategy :intra-sentential :l2 :tl}
                   42)]
      (is (not= input (:text result))
          "Tagalog code-mix output should differ from input")
      (is (not (str/blank? (:text result)))
          "Tagalog code-mix output should not be blank"))))

(deftest codemix-inter-sentential-works-for-tier-2-test
  (testing "Inter-sentential strategy also works for tier-2 languages"
    (register-codemix-transform!)
    (doseq [lang tier-2-codemix-langs]
      (let [input "Hello world. This is a test. Another sentence here."
            result (core/execute-transform
                     :code-mix input
                     {:mix-rate 0.5 :strategy :inter-sentential :l2 lang}
                     42)]
        (is (not (str/blank? (:text result)))
            (str "Inter-sentential code-mix for " lang " should produce non-blank output"))))))

(deftest codemix-tier-2-seed-determinism-test
  (testing "Code-mix for tier-2 languages is seed-deterministic"
    (register-codemix-transform!)
    (doseq [lang [:tr :vi]]
      (let [input "Hello world. This is a test sentence."
            r1 (core/execute-transform
                 :code-mix input
                 {:mix-rate 0.5 :strategy :intra-sentential :l2 lang}
                 1337)
            r2 (core/execute-transform
                 :code-mix input
                 {:mix-rate 0.5 :strategy :intra-sentential :l2 lang}
                 1337)]
        (is (= (:text r1) (:text r2))
            (str "Seed determinism failed for " lang))))))

(deftest codemix-tier-2-different-langs-produce-different-output-test
  (testing "Different tier-2 languages produce different code-mix output"
    (register-codemix-transform!)
    (let [input "Hello world. This is a good test sentence for mixing."
          tr-result (core/execute-transform
                      :code-mix input
                      {:mix-rate 0.8 :strategy :intra-sentential :l2 :tr}
                      42)
          vi-result (core/execute-transform
                      :code-mix input
                      {:mix-rate 0.8 :strategy :intra-sentential :l2 :vi}
                      42)]
      (is (not= (:text tr-result) (:text vi-result))
          "Turkish and Vietnamese code-mix should produce different output"))))
