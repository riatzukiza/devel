(ns eta-mu.extensions.receipt-river-test
  "Red phase tests for receipt-river EDN refactor.

  All tests in this ns are expected to FAIL until the following
  pure-function modules are extracted from receipt_river.cljs:

    eta-mu.extensions.receipt-river.edn
      - edn-event       :: map -> edn string
      - parse-edn-event :: string -> map (nil on parse failure)

    eta-mu.extensions.receipt-river.repo
      - find-git-root         :: (join-fn, dirname-fn, exists-fn) -> path -> string|nil
      - touched-repos         :: (find-git-root-fn) -> tool-calls -> {repo-root -> call-count}
      - should-activate?      :: repo-state -> boolean
      - contract-violations   :: touched-repos -> receipts-by-repo -> [repo-root]

  None of these namespaces exist yet. The shadow-cljs node-test
  build will fail to compile until they are created (red phase).
  Create stub namespaces returning nil/empty to enter green phase,
  then implement to pass."
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.extensions.receipt-river.edn  :as rr-edn]
            [eta-mu.extensions.receipt-river.repo :as rr-repo]))

;; ============================================================
;; EDN event format
;; ============================================================

(def sample-event
  {:ts      "2026-04-19T05:00:00.000Z"
   :kind    :observation
   :repo    "/home/user/projects/eta-mu"
   :origin  "pi"
   :owner   "receipt-river"
   :dod     "receipt-river"
   :pi      "0.63.1"
   :host    "local"
   :manifest "none"
   :refs    "none"})

(deftest edn-event-produces-valid-edn
  (testing "round-trips through parse-edn-event"
    (let [line (rr-edn/edn-event sample-event)
          back (rr-edn/parse-edn-event line)]
      (is (string? line))
      (is (map? back))
      (is (= (:kind sample-event) (:kind back)))
      (is (= (:repo sample-event) (:repo back)))
      (is (= (:ts sample-event)   (:ts back))))))

(deftest edn-event-is-single-line
  (testing "no embedded newlines — safe to append"
    (let [line (rr-edn/edn-event sample-event)]
      (is (not (.includes line "\n"))))))

(deftest edn-event-contains-required-keys
  (testing "serialized form contains all required keys"
    (let [line (rr-edn/edn-event sample-event)]
      (doseq [k [:ts :kind :repo :origin :owner :dod :pi :host :manifest :refs]]
        (is (.includes line (name k)))))))

(deftest edn-event-kind-is-keyword
  (testing "kind round-trips as keyword"
    (let [back (rr-edn/parse-edn-event (rr-edn/edn-event sample-event))]
      (is (keyword? (:kind back))))))

(deftest parse-edn-event-returns-nil-on-garbage
  (is (nil? (rr-edn/parse-edn-event "not edn at all {{{"  )))
  (is (nil? (rr-edn/parse-edn-event "")))
  (is (nil? (rr-edn/parse-edn-event nil))))

(deftest parse-edn-event-returns-nil-on-non-map
  (testing "vectors and scalars are rejected"
    (is (nil? (rr-edn/parse-edn-event "[1 2 3]")))
    (is (nil? (rr-edn/parse-edn-event "42")))))

(deftest edn-event-optional-keys-omitted-when-nil
  (testing "note/tests/decisions/drift absent when not supplied"
    (let [line (rr-edn/edn-event sample-event)]
      (is (not (.includes line ":note")))
      (is (not (.includes line ":tests")))
      (is (not (.includes line ":decisions")))
      (is (not (.includes line ":drift"))))))

(deftest edn-event-optional-keys-present-when-supplied
  (let [e    (assoc sample-event :note "fixed the thing" :tests "42 pass 0 fail")
        back (rr-edn/parse-edn-event (rr-edn/edn-event e))]
    (is (= "fixed the thing" (:note back)))
    (is (= "42 pass 0 fail" (:tests back)))))

;; ============================================================
;; Git repo root detection
;; ============================================================

(defn make-fs
  "Builds a fake filesystem predicate from a set of existing paths."
  [existing]
  (fn [p] (contains? existing p)))

(defn make-join []
  (fn [a b] (str a "/" b)))

(defn make-dirname []
  (fn [p]
    (let [idx (.lastIndexOf p "/")]
      (if (pos? idx) (subs p 0 idx) nil))))

(deftest find-git-root-direct
  (testing "finds .git at the given dir"
    (let [exists? (make-fs #{"/repo/.git"})
          join    (make-join)
          dirname (make-dirname)
          result  (rr-repo/find-git-root join dirname exists? "/repo/src/core")]
      (is (= "/repo" result)))))

(deftest find-git-root-walks-up
  (testing "walks up to find .git"
    (let [exists? (make-fs #{"/mono/.git"})
          join    (make-join)
          dirname (make-dirname)
          result  (rr-repo/find-git-root join dirname exists? "/mono/packages/eta-mu/src")]
      (is (= "/mono" result)))))

(deftest find-git-root-submodule
  (testing "stops at the nearest .git (submodule wins over monorepo root)"
    (let [exists? (make-fs #{"/mono/.git" "/mono/packages/eta-mu/.git"})
          join    (make-join)
          dirname (make-dirname)
          result  (rr-repo/find-git-root join dirname exists? "/mono/packages/eta-mu/src")]
      (is (= "/mono/packages/eta-mu" result)))))

(deftest find-git-root-returns-nil-when-not-found
  (let [exists? (make-fs #{})
        join    (make-join)
        dirname (make-dirname)
        result  (rr-repo/find-git-root join dirname exists? "/tmp/no-git")]
    (is (nil? result))))

(deftest find-git-root-nil-path
  (let [exists? (make-fs #{})
        join    (make-join)
        dirname (make-dirname)]
    (is (nil? (rr-repo/find-git-root join dirname exists? nil)))))

;; ============================================================
;; Touched-repos reduction
;; ============================================================

(def fake-find-git-root
  "Resolves /mono/packages/X/** -> /mono/packages/X,
   /mono/shared/** -> /mono, everything else nil."
  (fn [path]
    (cond
      (and path (.startsWith path "/mono/packages/alpha")) "/mono/packages/alpha"
      (and path (.startsWith path "/mono/packages/beta"))  "/mono/packages/beta"
      (and path (.startsWith path "/mono/shared"))         "/mono"
      :else nil)))

(def tool-calls-mixed
  [{:tool/name "read_file"   :tool/params {:path "/mono/packages/alpha/src/core.cljs"}}
   {:tool/name "write_file"  :tool/params {:path "/mono/packages/alpha/src/core.cljs"}}
   {:tool/name "read_file"   :tool/params {:path "/mono/packages/beta/README.md"}}
   {:tool/name "read_file"   :tool/params {:path "/mono/packages/beta/src/main.cljs"}}
   {:tool/name "bash"        :tool/params {:command "echo hi"}}])

(deftest touched-repos-counts-calls-per-repo
  (let [result (rr-repo/touched-repos fake-find-git-root tool-calls-mixed)]
    (is (= 2 (get result "/mono/packages/alpha")))
    (is (= 2 (get result "/mono/packages/beta")))))

(deftest touched-repos-ignores-pathless-tools
  (testing "bash with no path param is not counted"
    (let [result (rr-repo/touched-repos fake-find-git-root tool-calls-mixed)]
      (is (not (contains? result nil))))))

(deftest touched-repos-empty
  (is (= {} (rr-repo/touched-repos fake-find-git-root []))))

(deftest touched-repos-all-outside-git
  (let [calls  [{:tool/name "read_file" :tool/params {:path "/tmp/scratch.txt"}}]
        result (rr-repo/touched-repos fake-find-git-root calls)]
    (is (= {} result))))

;; ============================================================
;; Ledger activation threshold
;; ============================================================

(deftest should-activate-below-threshold
  (testing "fewer than threshold calls -> inactive"
    (is (false? (rr-repo/should-activate? {:call-count 2 :threshold 3 :active? false})))))

(deftest should-activate-at-threshold
  (testing "at threshold -> activate"
    (is (true? (rr-repo/should-activate? {:call-count 3 :threshold 3 :active? false})))))

(deftest should-activate-already-active
  (testing "already active -> stays active regardless of count"
    (is (true? (rr-repo/should-activate? {:call-count 0 :threshold 3 :active? true})))))

(deftest should-activate-default-threshold
  (testing "threshold defaults to 3 when absent"
    (is (false? (rr-repo/should-activate? {:call-count 2 :active? false})))
    (is (true?  (rr-repo/should-activate? {:call-count 3 :active? false})))))

;; ============================================================
;; Contract violation detection
;; ============================================================

(deftest contract-violations-all-covered
  (testing "no violations when every touched repo has a receipt this turn"
    (let [touched  {"/mono/packages/alpha" 3 "/mono/packages/beta" 1}
          receipts #{"/mono/packages/alpha" "/mono/packages/beta"}
          result   (rr-repo/contract-violations touched receipts)]
      (is (empty? result)))))

(deftest contract-violations-missing-receipt
  (testing "reports repos touched but without a receipt"
    (let [touched  {"/mono/packages/alpha" 3 "/mono/packages/beta" 2}
          receipts #{"/mono/packages/alpha"}
          result   (rr-repo/contract-violations touched receipts)]
      (is (= 1 (count result)))
      (is (= "/mono/packages/beta" (first result))))))

(deftest contract-violations-nothing-touched
  (is (empty? (rr-repo/contract-violations {} #{}))))

(deftest contract-violations-read-only-repo-exempt
  (testing "repos with only 1 call (read-only recon) are exempt"
    (let [touched  {"/mono/packages/alpha" 1 "/mono/packages/beta" 4}
          receipts #{}
          result   (rr-repo/contract-violations touched receipts)]
      (is (= 1 (count result)))
      (is (= "/mono/packages/beta" (first result))))))

(deftest contract-violations-returns-sorted
  (testing "violation list is deterministically ordered"
    (let [touched  {"/b" 5 "/a" 5 "/c" 5}
          receipts #{}
          result   (rr-repo/contract-violations touched receipts)]
      (is (= (sort result) result)))))
