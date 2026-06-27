(ns eta-mu.extensions.contract-runtime-v2-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.extensions.contract-runtime-v2.core :as core]))

(deftest path-param-extraction-test
  (testing "extracts first matching path param"
    (is (= "/tmp/x"
           (core/path-param-from-tool-call {"foo" 1 "path" "/tmp/x"})))
    (is (= "/tmp/y"
           (core/path-param-from-tool-call {"dest" "/tmp/y"})))
    (is (nil? (core/path-param-from-tool-call {"name" "nope"})))))

(deftest comment-stripping-test
  (is (= "{:a 1}\n{:b 2}"
         (core/strip-comment-lines ";; hi\n{:a 1}\n;; bye\n{:b 2}"))))

(deftest normalize-contract-forms-test
  (testing "single map"
    (is (= [{:contract/kind :policy :contract/id "x"}]
           (core/normalize-contract-forms "{:contract/kind :policy :contract/id \"x\"}"))))
  (testing "vector of maps"
    (is (= [{:contract/kind :role :role/id :r1}
            {:contract/kind :capability :capability/id :c1}]
           (core/normalize-contract-forms "[{:contract/kind :role :role/id :r1} {:contract/kind :capability :capability/id :c1}]"))))
  (testing "unknown form falls through"
    (let [res (core/normalize-contract-forms "(skill-contract (name \"old\"))")]
      (is (= :unknown (:contract/kind (first res)))))))

(deftest contract-kind-test
  (is (= :actor (core/contract-kind {:actor/id :mindfuck})))
  (is (= :runtime-feature (core/contract-kind {:runtime-feature/id "eta-mu.opmf-contract-gate"})))
  (is (= :policy (core/contract-kind {:contract/kind :policy})))
  (is (nil? (core/contract-kind {:x 1}))))

(deftest dispatch-test
  (testing "known structured kinds dispatch to their collections"
    (let [raw "{:contract/kind :policy :contract/id \"p1\"}"
          acc (-> {:actors [] :policies [] :fulfills [] :runtime-features [] :caps {} :roles {} :prompt-blocks []}
                  (core/apply-map-dispatch {:actor/id :mindfuck :system "hello"} raw)
                  (core/apply-map-dispatch {:contract/kind :policy :contract/id "p1"} raw)
                  (core/apply-map-dispatch {:contract/kind :fulfillment :contract/id "f1"} raw)
                  (core/apply-map-dispatch {:contract/kind :runtime-feature :contract/id "eta-mu.opmf-contract-gate"} raw)
                  (core/apply-map-dispatch {:contract/kind :capability :capability/id :cap/x} raw)
                  (core/apply-map-dispatch {:contract/kind :role :role/id :role/x} raw)
                  (core/apply-map-dispatch {:contract/kind :unknown :raw "raw-block"} raw))]
      (is (= 1 (count (:actors acc))))
      (is (= 1 (count (:policies acc))))
      (is (= 1 (count (:fulfills acc))))
      (is (= 1 (count (:runtime-features acc))))
      (is (= {:contract/kind :capability :capability/id :cap/x}
             (get-in acc [:caps ":cap/x"])))
      (is (= {:contract/kind :role :role/id :role/x}
             (get-in acc [:roles ":role/x"]))))))

(deftest prompt-blocks-fallthrough-test
  (testing "actor emits :system as prompt block"
    (let [acc (core/apply-map-dispatch {} {:actor/id :x :system "sys-text"} "raw")]
      (is (some #{"sys-text"} (:prompt-blocks acc)))))
  (testing "unknown block emits :raw as prompt block"
    (let [acc (core/apply-map-dispatch {} {:contract/kind :unknown :raw "raw-block"} "fallback")]
      (is (some #{"raw-block"} (:prompt-blocks acc)))))
  (testing "structured kind with no :raw falls through to raw-text arg"
    (let [raw-text "{:contract/kind :policy :contract/id \"p1\"}"
          acc      (core/apply-map-dispatch {} {:contract/kind :policy :contract/id "p1"} raw-text)]
      (is (some #{raw-text} (:prompt-blocks acc)))))
  (testing "structured kind with blank raw-text emits no prompt block"
    (let [acc (core/apply-map-dispatch {} {:contract/kind :policy :contract/id "p1"} "")]
      (is (empty? (:prompt-blocks acc))))))

(deftest prompt-build-test
  (let [out (core/build-prompt-append "{:mission \"x\"}" ["actor text" "unknown text"])]
    (is (string? out))
    (is (.includes out "PRINCIPLE.edn"))
    (is (.includes out "actor text"))
    (is (.includes out "unknown text"))))

(deftest cache-freshness-test
  (is (true?  (core/cache-entry-fresh? 1000 {"loaded-at" 900} 200)))
  (is (false? (core/cache-entry-fresh? 1000 {"loaded-at" 500} 200)))
  (is (nil?   (core/cache-entry-fresh? 1000 nil 200))))

(deftest walk-up-paths-test
  (let [existing   #{"/repo/CONTRACT.edn" "/repo/a/b/CONTRACT.edn"}
        join-path  (fn [a b] (str a "/" b))
        dirname    (fn [p]
                     (let [idx (.lastIndexOf p "/")]
                       (if (pos? idx) (subs p 0 idx) p)))
        out (core/walk-up-paths join-path dirname "/repo/a/b" "/repo" #(contains? existing %))]
    (is (= ["/repo/CONTRACT.edn" "/repo/a/b/CONTRACT.edn"] out))))

(def p-block
  {:contract/kind :policy
   :contract/id   "block-write"
   :policy/on     :before-tool-call
   :policy/match  {:tool/name "write_file"}
   :policy/action :block
   :policy/reason "write_file is restricted"})

(def p-warn
  {:contract/kind :policy
   :contract/id   "warn-read"
   :policy/on     :before-tool-call
   :policy/match  {:tool/name "read_file"}
   :policy/action :warn
   :policy/reason "read_file should be reviewed"})

(def p-note
  {:contract/kind :policy
   :contract/id   "note-search"
   :policy/on     :before-tool-call
   :policy/match  {:tool/name "web_search"}
   :policy/action :note
   :policy/reason "web_search noted"})

(def p-param
  {:contract/kind :policy
   :contract/id   "block-etc"
   :policy/on     :before-tool-call
   :policy/match  {:tool/name "write_file"
                   :tool/params {:path "/etc/passwd"}}
   :policy/action :block
   :policy/reason "writing /etc/passwd is forbidden"})

(def p-ttl
  {:contract/kind  :policy
   :contract/id    "ttl-warn"
   :policy/on      :before-tool-call
   :policy/match   {:tool/name "write_file"}
   :policy/action  :warn
   :policy/reason  "transient warning"
   :policy/ttl-ms  1000})

(deftest policy-no-match-test
  (let [res (core/evaluate-policies [p-block] {:tool/name "read_file"})]
    (is (= :allow (:action res)))
    (is (nil? (:policy res)))
    (is (empty? (:matches res)))))

(deftest policy-block-test
  (let [res (core/evaluate-policies [p-block] {:tool/name "write_file"})]
    (is (= :block (:action res)))
    (is (= "write_file is restricted" (:reason res)))
    (is (= p-block (:policy res)))))

(deftest policy-warn-test
  (let [res (core/evaluate-policies [p-warn] {:tool/name "read_file"})]
    (is (= :warn (:action res)))
    (is (= "read_file should be reviewed" (:reason res)))))

(deftest policy-note-test
  (let [res (core/evaluate-policies [p-note] {:tool/name "web_search"})]
    (is (= :note (:action res)))))

(deftest policy-strongest-action-test
  (testing "block beats warn when both match"
    (let [p-warn2 (assoc p-warn :policy/match {:tool/name "write_file"}
                               :policy/reason "also warns")
          res     (core/evaluate-policies [p-warn2 p-block] {:tool/name "write_file"})]
      (is (= :block (:action res)))
      (is (= 2 (count (:matches res)))))))

(deftest policy-param-match-test
  (testing "matches on exact param value"
    (let [res (core/evaluate-policies
                [p-param]
                {:tool/name "write_file" :tool/params {:path "/etc/passwd"}})]
      (is (= :block (:action res)))))
  (testing "does not match on different param value"
    (let [res (core/evaluate-policies
                [p-param]
                {:tool/name "write_file" :tool/params {:path "/tmp/safe"}})]
      (is (= :allow (:action res))))))

(deftest policy-ttl-test
  (testing "policy active within TTL"
    (let [res (core/evaluate-policies [p-ttl] {:tool/name "write_file"} 500 0)]
      (is (= :warn (:action res)))))
  (testing "policy expired outside TTL"
    (let [res (core/evaluate-policies [p-ttl] {:tool/name "write_file"} 2000 0)]
      (is (= :allow (:action res)))))
  (testing "policy with no TTL always active"
    (let [res (core/evaluate-policies [p-block] {:tool/name "write_file"} 99999 0)]
      (is (= :block (:action res))))))

(deftest policy-empty-test
  (is (= :allow (:action (core/evaluate-policies [] {:tool/name "anything"})))))

(def f-notify
  {:contract/kind       :fulfillment
   :contract/id         "notify-writes"
   :fulfillment/on      :after-tool-call
   :fulfillment/match   {:tool/name "write_file"}
   :fulfillment/mode    :notify
   :fulfillment/message "wrote {path}"
   :fulfillment/level   :info})

(def f-audit
  {:contract/kind       :fulfillment
   :contract/id         "audit-deletes"
   :fulfillment/on      :after-tool-call
   :fulfillment/match   {:tool/name "delete_file"}
   :fulfillment/mode    :audit
   :fulfillment/level   :warn})

(def f-error
  {:contract/kind       :fulfillment
   :contract/id         "alert-errors"
   :fulfillment/on      :after-tool-call
   :fulfillment/match   {:tool/name "write_file"
                         :tool/error? true}
   :fulfillment/mode    :notify
   :fulfillment/message "write failed"
   :fulfillment/level   :error})

(deftest fulfillment-no-match-test
  (let [res (core/evaluate-fulfillments [f-notify] {:tool/name "read_file"})]
    (is (empty? res))))

(deftest fulfillment-notify-test
  (let [res (core/evaluate-fulfillments
              [f-notify]
              {:tool/name "write_file" :tool/params {:path "/tmp/x"}})]
    (is (= 1 (count res)))
    (is (= :notify (:mode (first res))))
    (is (= :info   (:level (first res))))
    (is (= "wrote /tmp/x" (:message (first res))))))

(deftest fulfillment-default-message-test
  (testing "default message when :fulfillment/message omitted"
    (let [f   (dissoc f-notify :fulfillment/message)
          res (core/evaluate-fulfillments [f] {:tool/name "write_file"})]
      (is (= "write_file completed" (:message (first res)))))))

(deftest fulfillment-audit-test
  (let [res (core/evaluate-fulfillments [f-audit] {:tool/name "delete_file"})]
    (is (= :audit (:mode (first res))))
    (is (= :warn  (:level (first res))))))

(deftest fulfillment-all-match-test
  (testing "all matching fulfillments fire"
    (let [f2  (assoc f-notify :contract/id "also-notify")
          res (core/evaluate-fulfillments
                [f-notify f2]
                {:tool/name "write_file" :tool/params {:path "/tmp/y"}})]
      (is (= 2 (count res))))))

(deftest fulfillment-error-match-test
  (testing "error? true matches when tool errored"
    (let [res (core/evaluate-fulfillments
                [f-error]
                {:tool/name "write_file" :tool/error "ENOENT"})]
      (is (= 1 (count res)))
      (is (= :error (:level (first res))))))
  (testing "error? true does not match when tool succeeded"
    (let [res (core/evaluate-fulfillments
                [f-error]
                {:tool/name "write_file"})]
      (is (empty? res))))
  (testing "error? true does not match explicit false"
    (let [res (core/evaluate-fulfillments
                [f-error]
                {:tool/name "write_file" :tool/error false})]
      (is (empty? res)))))

(deftest fulfillment-interpolation-test
  (testing "interpolates keyword params"
    (let [res (core/evaluate-fulfillments
                [f-notify]
                {:tool/name "write_file" :tool/params {:path "/etc/hosts"}})]
      (is (= "wrote /etc/hosts" (:message (first res))))))
  (testing "supports non-word token names like dash and slash"
    (let [f   (assoc f-notify :fulfillment/message "flags {dry-run} via {tool/name}")
          res (core/evaluate-fulfillments
                [f]
                {:tool/name "write_file"
                 :tool/params {:dry-run false}})]
      (is (= "flags false via write_file" (:message (first res))))))
  (testing "preserves explicit falsey top-level values"
    (let [f   (assoc f-notify :fulfillment/message "error? {tool/error}")
          res (core/evaluate-fulfillments [f] {:tool/name "write_file" :tool/error false})]
      (is (= "error? false" (:message (first res))))))
  (testing "preserves explicit falsey string-key param values"
    (let [f   (assoc f-notify :fulfillment/message "dry-run={dry-run}")
          res (core/evaluate-fulfillments [f] {:tool/name "write_file" :tool/params {"dry-run" false}})]
      (is (= "dry-run=false" (:message (first res))))))
  (testing "unresolved tokens remain as-is"
    (let [f   (assoc f-notify :fulfillment/message "touched {nonexistent}")
          res (core/evaluate-fulfillments [f] {:tool/name "write_file"})]
      (is (= "touched {nonexistent}" (:message (first res)))))))

(deftest fulfillment-empty-test
  (is (empty? (core/evaluate-fulfillments [] {:tool/name "anything"}))))
