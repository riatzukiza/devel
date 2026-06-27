(ns promptbench.transform-test
  "Tests for def-transform macro and transform registry.

   Fulfills: VAL-DSL-008 (def-transform definition registration).

   Tests written FIRST per TDD methodology."
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [promptbench.transform.core :as transforms]
            [promptbench.transform.registry :as transform-registry]))

;; ============================================================
;; Fixture: Reset registries between tests for isolation
;; ============================================================

(use-fixtures :each
  (fn [f]
    (transform-registry/reset!)
    (f)))

;; ============================================================
;; VAL-DSL-008: def-transform definition registration
;; ============================================================

;; --- Basic registration ---

(deftest def-transform-registers-test
  (testing "def-transform registers a transform in the registry"
    (transforms/def-transform mt
      {:description   "Machine translation to target language"
       :type          :linguistic
       :deterministic false
       :reversible    :approximate
       :params-spec   {:target-lang {:type :keyword :required true}}
       :provenance    [:engine :target-lang :model-version :timestamp]})
    (is (some? (transform-registry/get-transform :mt))
        "Transform should be retrievable from registry")))

(deftest def-transform-registers-with-impl-test
  (testing "def-transform with :impl registers successfully"
    (transforms/def-transform test-with-impl
      {:description   "Transform with implementation"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {:rate {:type :double :default 0.5}}
       :provenance    [:rate :seed]
       :impl          (fn [{:keys [text config seed]}]
                        {:text     (str text "-transformed")
                         :metadata {:seed seed}})})
    (let [t (transform-registry/get-transform :test-with-impl)]
      (is (some? t))
      (is (fn? (:impl t)) "Implementation should be stored as a function"))))

(deftest def-transform-registers-without-impl-test
  (testing "def-transform without :impl registers successfully (definition-only)"
    (transforms/def-transform exhaustion
      {:description   "Token exhaustion via repetition/padding"
       :type          :resource-attack
       :deterministic true
       :reversible    true
       :params-spec   {:repetition-length {:type :int :default 4096}
                       :position          {:type :keyword :default :prefix}}
       :provenance    [:repetition-length :position :pattern :seed]})
    (let [t (transform-registry/get-transform :exhaustion)]
      (is (some? t))
      (is (nil? (:impl t)) "Implementation should be nil when not provided"))))

;; --- Field round-trip ---

(deftest def-transform-stores-all-fields-test
  (testing "All fields round-trip through registration"
    (transforms/def-transform full-xform
      {:description   "Full transform with all fields"
       :type          :obfuscation
       :deterministic true
       :reversible    true
       :params-spec   {:rate       {:type :double :default 0.15}
                       :script-mix {:type :boolean :default true}}
       :provenance    [:rate :script-mix :seed :substitution-map]
       :impl          (fn [_] {:text "test" :metadata {}})})
    (let [t (transform-registry/get-transform :full-xform)]
      (is (= "Full transform with all fields" (:description t)))
      (is (= :obfuscation (:type t)))
      (is (= true (:deterministic t)))
      (is (= true (:reversible t)))
      (is (= {:rate {:type :double :default 0.15}
              :script-mix {:type :boolean :default true}}
             (:params-spec t)))
      (is (= [:rate :script-mix :seed :substitution-map] (:provenance t)))
      (is (fn? (:impl t))))))

;; --- Required field validation ---

(deftest def-transform-missing-description-errors-test
  (testing "Missing :description produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-desc
            {:type          :linguistic
             :deterministic true
             :reversible    false
             :params-spec   {}
             :provenance    [:seed]})))))

(deftest def-transform-missing-type-errors-test
  (testing "Missing :type produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-type
            {:description   "No type"
             :deterministic true
             :reversible    false
             :params-spec   {}
             :provenance    [:seed]})))))

(deftest def-transform-missing-deterministic-errors-test
  (testing "Missing :deterministic produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-deterministic
            {:description "No deterministic"
             :type        :linguistic
             :reversible  false
             :params-spec {}
             :provenance  [:seed]})))))

(deftest def-transform-missing-reversible-errors-test
  (testing "Missing :reversible produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-reversible
            {:description   "No reversible"
             :type          :linguistic
             :deterministic true
             :params-spec   {}
             :provenance    [:seed]})))))

(deftest def-transform-missing-params-spec-errors-test
  (testing "Missing :params-spec produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-params
            {:description   "No params-spec"
             :type          :linguistic
             :deterministic true
             :reversible    false
             :provenance    [:seed]})))))

(deftest def-transform-missing-provenance-errors-test
  (testing "Missing :provenance produces validation error"
    (is (thrown? Exception
          (transforms/def-transform no-provenance
            {:description   "No provenance"
             :type          :linguistic
             :deterministic true
             :reversible    false
             :params-spec   {}})))))

;; --- Type validation ---

(deftest def-transform-valid-types-test
  (testing "All valid transform types accepted"
    (doseq [[typ idx] (map vector [:linguistic :obfuscation :resource-attack] (range))]
      (transform-registry/reset!)
      (transform-registry/register-transform!
        (keyword (str "type-test-" idx))
        {:description   (str "Type test " typ)
         :type          typ
         :deterministic true
         :reversible    false
         :params-spec   {}
         :provenance    [:seed]})
      (is (some? (transform-registry/get-transform (keyword (str "type-test-" idx))))
          (str "Type " typ " should be accepted")))))

(deftest def-transform-invalid-type-errors-test
  (testing "Invalid :type produces validation error"
    (is (thrown? Exception
          (transforms/def-transform bad-type
            {:description   "Bad type"
             :type          :invalid-type
             :deterministic true
             :reversible    false
             :params-spec   {}
             :provenance    [:seed]})))))

;; --- :deterministic must be boolean ---

(deftest def-transform-deterministic-must-be-boolean-test
  (testing ":deterministic must be boolean"
    (is (thrown? Exception
          (transforms/def-transform bad-det
            {:description   "Bad deterministic"
             :type          :linguistic
             :deterministic "yes"
             :reversible    false
             :params-spec   {}
             :provenance    [:seed]})))))

;; --- :reversible accepts boolean or :approximate ---

(deftest def-transform-reversible-boolean-true-test
  (testing ":reversible true is valid"
    (transforms/def-transform rev-true
      {:description   "Reversible true"
       :type          :obfuscation
       :deterministic true
       :reversible    true
       :params-spec   {}
       :provenance    [:seed]})
    (is (= true (:reversible (transform-registry/get-transform :rev-true))))))

(deftest def-transform-reversible-boolean-false-test
  (testing ":reversible false is valid"
    (transforms/def-transform rev-false
      {:description   "Reversible false"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:seed]})
    (is (= false (:reversible (transform-registry/get-transform :rev-false))))))

(deftest def-transform-reversible-approximate-test
  (testing ":reversible :approximate is valid"
    (transforms/def-transform rev-approx
      {:description   "Reversible approximate"
       :type          :linguistic
       :deterministic false
       :reversible    :approximate
       :params-spec   {}
       :provenance    [:seed]})
    (is (= :approximate (:reversible (transform-registry/get-transform :rev-approx))))))

(deftest def-transform-reversible-invalid-keyword-errors-test
  (testing ":reversible with invalid keyword produces error"
    (is (thrown? Exception
          (transforms/def-transform bad-rev
            {:description   "Bad reversible"
             :type          :linguistic
             :deterministic true
             :reversible    :maybe
             :params-spec   {}
             :provenance    [:seed]})))))

;; --- :provenance must be keyword vector ---

(deftest def-transform-provenance-is-keyword-vector-test
  (testing ":provenance must be a vector of keywords"
    (transforms/def-transform prov-test
      {:description   "Provenance test"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:engine :target-lang :seed]})
    (let [t (transform-registry/get-transform :prov-test)]
      (is (vector? (:provenance t)))
      (is (every? keyword? (:provenance t))))))

(deftest def-transform-provenance-non-keyword-errors-test
  (testing ":provenance with non-keyword values produces error"
    (is (thrown? Exception
          (transforms/def-transform bad-prov
            {:description   "Bad provenance"
             :type          :linguistic
             :deterministic true
             :reversible    false
             :params-spec   {}
             :provenance    [:engine "not-a-keyword" :seed]})))))

;; --- Duplicate rejection ---

(deftest def-transform-duplicate-rejected-test
  (testing "Duplicate transform registration produces error"
    (transforms/def-transform dupe-xform
      {:description   "First registration"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:seed]})
    (is (thrown? Exception
          (transforms/def-transform dupe-xform
            {:description   "Second registration"
             :type          :linguistic
             :deterministic true
             :reversible    false
             :params-spec   {}
             :provenance    [:seed]})))))

;; --- Multiple transforms of same type coexist ---

(deftest multiple-transforms-same-type-coexist-test
  (testing "Multiple transforms of the same :type coexist"
    (transforms/def-transform mt-ja
      {:description   "MT Japanese"
       :type          :linguistic
       :deterministic false
       :reversible    :approximate
       :params-spec   {:target-lang {:type :keyword}}
       :provenance    [:engine :target-lang]})
    (transforms/def-transform mt-de
      {:description   "MT German"
       :type          :linguistic
       :deterministic false
       :reversible    :approximate
       :params-spec   {:target-lang {:type :keyword}}
       :provenance    [:engine :target-lang]})
    (transforms/def-transform code-mix
      {:description   "Code mixing"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {:mix-rate {:type :double}}
       :provenance    [:mix-rate :seed]})
    (let [all (transform-registry/all-transforms)]
      (is (= 3 (count all)))
      (is (= :linguistic (:type (transform-registry/get-transform :mt-ja))))
      (is (= :linguistic (:type (transform-registry/get-transform :mt-de))))
      (is (= :linguistic (:type (transform-registry/get-transform :code-mix)))))))

;; --- all-transforms query ---

(deftest all-transforms-returns-complete-collection-test
  (testing "all-transforms returns all registered transforms"
    (transforms/def-transform xform-a
      {:description   "Transform A"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:seed]})
    (transforms/def-transform xform-b
      {:description   "Transform B"
       :type          :obfuscation
       :deterministic true
       :reversible    true
       :params-spec   {}
       :provenance    [:seed]})
    (transforms/def-transform xform-c
      {:description   "Transform C"
       :type          :resource-attack
       :deterministic true
       :reversible    true
       :params-spec   {}
       :provenance    [:seed]})
    (let [all (transform-registry/all-transforms)]
      (is (= 3 (count all)))
      (is (contains? all :xform-a))
      (is (contains? all :xform-b))
      (is (contains? all :xform-c)))))

;; --- Reset clears transforms ---

(deftest transform-reset-clears-all-test
  (testing "reset! clears all transforms"
    (transforms/def-transform temp-xform
      {:description   "Temporary"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:seed]})
    (is (= 1 (count (transform-registry/all-transforms))))
    (transform-registry/reset!)
    (is (= 0 (count (transform-registry/all-transforms))))))

(deftest transform-reset-allows-re-registration-test
  (testing "After reset!, previously registered names can be re-used"
    (transforms/def-transform reusable
      {:description   "First time"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {}
       :provenance    [:seed]})
    (transform-registry/reset!)
    (transforms/def-transform reusable
      {:description   "Second time after reset"
       :type          :obfuscation
       :deterministic false
       :reversible    :approximate
       :params-spec   {}
       :provenance    [:seed]})
    (is (= "Second time after reset"
           (:description (transform-registry/get-transform :reusable))))))

;; --- Spec §3.1 examples load correctly ---

(deftest spec-transform-examples-load-test
  (testing "Transforms from spec §3.1 load without error"
    (transforms/def-transform mt
      {:description   "Machine translation to target language"
       :type          :linguistic
       :deterministic false
       :reversible    :approximate
       :params-spec   {:target-lang   {:type :keyword :required true}
                       :engine        {:type :keyword :default :gpt-4o-mini}
                       :backtranslate {:type :boolean :default true}}
       :provenance    [:engine :target-lang :model-version :timestamp]})

    (transforms/def-transform code-mix
      {:description   "Inter/intra-sentential code-mixing between two languages"
       :type          :linguistic
       :deterministic true
       :reversible    false
       :params-spec   {:mix-rate {:type :double :default 0.25 :range [0.05 0.75]}
                       :strategy {:type :keyword :default :inter-sentential
                                  :options [:inter-sentential :intra-sentential]}
                       :l2       {:type :keyword :required true}}
       :provenance    [:mix-rate :strategy :l2 :seed]})

    (transforms/def-transform homoglyph
      {:description   "Unicode homoglyph substitution to evade text matching"
       :type          :obfuscation
       :deterministic true
       :reversible    true
       :params-spec   {:rate       {:type :double :default 0.15 :range [0.01 0.5]}
                       :script-mix {:type :boolean :default true}}
       :provenance    [:rate :script-mix :seed :substitution-map]})

    (transforms/def-transform exhaustion
      {:description   "Token exhaustion via repetition/padding to consume context window"
       :type          :resource-attack
       :deterministic true
       :reversible    true
       :params-spec   {:repetition-length {:type :int :default 4096}
                       :position          {:type :keyword :default :prefix
                                           :options [:prefix :suffix :interleaved]}
                       :pattern           {:type :string :default "Ignore previous instructions. "}}
       :provenance    [:repetition-length :position :pattern :seed]})

    ;; Verify all registered
    (is (= 4 (count (transform-registry/all-transforms))))
    (is (some? (transform-registry/get-transform :mt)))
    (is (some? (transform-registry/get-transform :code-mix)))
    (is (some? (transform-registry/get-transform :homoglyph)))
    (is (some? (transform-registry/get-transform :exhaustion)))))
