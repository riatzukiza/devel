(ns eta-mu.extensions.contract-runtime-v2.core
  (:require [clojure.string :as str]
            [cljs.reader :as reader]))

(def path-param-keys #{"path" "file" "dir" "root" "cwd" "target" "source" "dest"})

;; ── String / EDN utils ──────────────────────────────────────────

(defn strip-whitespace [s]
  (str/replace (or s "") #"\s+" ""))

(defn strip-comment-lines [text]
  (->> (str/split (or text "") #"\r?\n")
       (remove #(str/starts-with? (str/trim %) ";;"))
       (str/join "\n")))

(defn path-param-from-tool-call [params]
  (some (fn [k] (get params k)) path-param-keys))

(defn normalize-contract-forms [text]
  (let [cleaned (strip-comment-lines text)]
    (try
      (let [form (reader/read-string cleaned)]
        (cond
          (map? form)    [form]
          (vector? form) form
          :else          [{:contract/kind :unknown :raw cleaned}]))
      (catch :default _
        [{:contract/kind :unknown :raw (or text "")}]))))

(defn contract-kind [m]
  (or (:contract/kind m)
      (when (:actor/id m) :actor)
      (when (:runtime-feature/id m) :runtime-feature)
      nil))

(defn prompt-block-for-map [m raw-text]
  (let [kind (contract-kind m)]
    (cond
      (= kind :actor)
      (let [sys (:system m)]
        (cond
          (string? sys) sys
          (map? sys)    (str "[fn-ref: " (:fn-ref sys) "]")
          :else         nil))
      :else
      (or (:raw m) raw-text))))

(defn apply-map-dispatch [acc m raw-text]
  (let [kind   (contract-kind m)
        prompt (prompt-block-for-map m raw-text)]
    (cond-> acc
      (= kind :actor)       (update :actors      (fnil conj []) m)
      (= kind :policy)      (update :policies    (fnil conj []) m)
      (= kind :fulfillment) (update :fulfills    (fnil conj []) m)
      (= kind :runtime-feature) (update :runtime-features (fnil conj []) m)
      (= kind :capability)  (assoc-in [:caps  (str (:capability/id m))] m)
      (= kind :role)        (assoc-in [:roles (str (:role/id m))]        m)
      (and (string? prompt) (not (str/blank? prompt)))
      (update :prompt-blocks (fnil conj []) prompt))))

(defn build-prompt-append [principle-text prompt-blocks]
  (let [blocks (filter #(and (string? %) (not (str/blank? %)))
                       (concat [(when (and principle-text (not (str/blank? principle-text)))
                                  (str "## PRINCIPLE.edn\n\n" principle-text))]
                               prompt-blocks))]
    (when (seq blocks)
      (str "## Eta Mu Contract Runtime v2\n\n"
           "The following blocks were loaded from PRINCIPLE.edn and cwd-relative CONTRACT.edn files.\n"
           "Use them as active contract material. Unknown blocks are preserved as prompt text.\n\n"
           (str/join "\n\n" blocks)))))

(defn cache-entry-fresh? [now-ms entry ttl-ms]
  (when entry
    (< (- now-ms (get entry "loaded-at" 0)) ttl-ms)))

(defn walk-up-paths
  [join-path dirname start-dir stop-dir existing?]
  (loop [cur start-dir acc []]
    (let [candidate (join-path cur "CONTRACT.edn")
          acc*      (if (existing? candidate) (conj acc candidate) acc)
          parent    (dirname cur)]
      (if (or (= cur stop-dir) (= cur parent))
        (vec (reverse acc*))
        (recur parent acc*)))))

;; ── Policy evaluation ─────────────────────────────────────────

(def action-severity {:block 3 :warn 2 :note 1 :allow 0})

(defn strongest-action [actions]
  (let [n (apply max 0 (map #(get action-severity % 0) actions))]
    (some (fn [[k v]] (when (= v n) k)) action-severity)))

(defn policy-matches? [policy tool-call]
  (let [match (get policy :policy/match {})]
    (every? (fn [[k v]]
              (cond
                (= k :tool/name)
                (= v (:tool/name tool-call))

                (= k :tool/params)
                (every? (fn [[pk pv]]
                          (let [actual (get-in tool-call [:tool/params pk])]
                            (if (fn? pv) (pv actual) (= pv actual))))
                        v)

                :else false))
            match)))

(defn evaluate-policies
  ([policies tool-call]
   (evaluate-policies policies tool-call nil nil))
  ([policies tool-call now-ms loaded-at]
   (let [active  (filter (fn [p]
                           (let [ttl (get p :policy/ttl-ms)]
                             (if (and ttl now-ms loaded-at)
                               (< (- now-ms loaded-at) ttl)
                               true)))
                         policies)
         matches (filter #(policy-matches? % tool-call) active)]
     (if (empty? matches)
       {:action :allow :reason nil :policy nil :matches []}
       (let [action (strongest-action (map :policy/action matches))
             winner (first (filter #(= action (:policy/action %)) matches))]
         {:action  action
          :reason  (:policy/reason winner)
          :policy  winner
          :matches (vec matches)})))))

;; ── Fulfillment evaluation ─────────────────────────────────────

(defn fulfillment-matches? [fulfill tool-result]
  (let [match (get fulfill :fulfillment/match {})]
    (every? (fn [[k v]]
              (cond
                (= k :tool/name)
                (= v (:tool/name tool-result))

                (= k :tool/params)
                (every? (fn [[pk pv]]
                          (let [actual (get-in tool-result [:tool/params pk])]
                            (if (fn? pv) (pv actual) (= pv actual))))
                        v)

                (= k :tool/output)
                (if (fn? v) (v (:tool/output tool-result)) (= v (:tool/output tool-result)))

                (= k :tool/error?)
                (= v (boolean (:tool/error tool-result)))

                :else false))
            match)))

(defn interpolate-message
  "Replace {key} tokens in template with values from tool-result.
  Looks in :tool/params first, then top-level tool-result keys, preserving explicit falsey values."
  [template tool-result]
  (if (str/blank? template)
    template
    (str/replace template #"\{([^{}]+)\}"
                 (fn [[_ k]]
                   (cond
                     (contains? (:tool/params tool-result) (keyword k))
                     (str (get-in tool-result [:tool/params (keyword k)]))

                     (contains? (:tool/params tool-result) k)
                     (str (get-in tool-result [:tool/params k]))

                     (contains? tool-result (keyword k))
                     (str (get tool-result (keyword k)))

                     (contains? tool-result k)
                     (str (get tool-result k))

                     :else
                     (str "{" k "}")))))
  )

(defn evaluate-fulfillments
  "Pure reducer. Given a seq of fulfillment maps and a tool-result map,
  returns a seq of fulfillment action maps for all matching fulfillments.
  All matches fire — there is no strongest-wins reduction."
  [fulfills tool-result]
  (->> fulfills
       (filter #(fulfillment-matches? % tool-result))
       (map (fn [f]
              (let [template (or (:fulfillment/message f)
                                 (str (:tool/name tool-result) " completed"))
                    message  (interpolate-message template tool-result)]
                {:mode    (or (:fulfillment/mode f) :notify)
                 :message message
                 :level   (or (:fulfillment/level f) :info)
                 :fulfill f})))
       vec))
