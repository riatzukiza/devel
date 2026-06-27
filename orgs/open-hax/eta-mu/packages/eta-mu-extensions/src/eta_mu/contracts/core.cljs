(ns eta-mu.contracts.core
  "Core contract compilation and validation logic.
   Uses a real Markdown parser for section extraction and semantic counting."
  (:require [clojure.edn :as edn]
            [clojure.string :as str]
            ["markdown-it" :as MarkdownIt]))

;; ============================================================
;; Contract Compilation (EDN → Normalized Contract)
;; ============================================================

(defn contract-compile-error
  [message]
  (ex-info message {:type :contract-compile-error}))

(defn keyword->id
  "Convert keyword-like identifiers to stable string ids while preserving namespace.
   Examples: `:rule/frames-cardinality -> rule/frames-cardinality`, `:foo -> foo`."
  [kw]
  (cond
    (keyword? kw) (if-let [ns (namespace kw)]
                    (str ns "/" (name kw))
                    (name kw))
    (and (string? kw) (str/starts-with? kw ":")) (subs kw 1)
    :else (str kw)))

(defn- find-child
  [form head]
  (some (fn [entry]
          (when (and (sequential? entry) (= (first entry) head))
            entry))
        (rest form)))

(defn- require-child
  [form head]
  (or (find-child form head)
      (throw (contract-compile-error (str "Missing required form (" head " ...)")))))

(defn- child-value
  [form head]
  (some-> (find-child form head) second))

(defn- required-child-value
  [form head]
  (-> (require-child form head) second))

(defn- list-children
  [form]
  (filter sequential? (rest form)))

(defn- compile-children
  [form head compile-fn]
  (->> (list-children form)
       (filter (comp #{head} first))
       (mapv compile-fn)))

(defn- parse-string-vector
  [value]
  (mapv keyword->id (or value [])))

(defn- parse-bool
  ([value]
   (parse-bool value false))
  ([value default]
   (if (nil? value) default (boolean value))))

(defn- index-by
  [k coll]
  (zipmap (map k coll) coll))

(defn compile-section
  [form]
  (let [cardinality (some-> (child-value form 'cardinality) keyword->id)]
    {:id (-> form (required-child-value 'id) keyword->id)
     :heading (-> form (required-child-value 'heading) str)
     :required (parse-bool (child-value form 'required))
     :order (or (child-value form 'order) 0)
     :cardinality (if (= cardinality "many") :many :one)
     :allowed-node-types (-> form (child-value 'allowed-node-types) parse-string-vector)
     :local-rule-ids (-> form (child-value 'local-rules) parse-string-vector)}))

(defn- compile-target
  [form]
  {:target-format (-> form (required-child-value 'format) keyword->id)
   :target-ast (-> form (required-child-value 'ast) keyword->id)
   :target-root (-> form (required-child-value 'root) keyword->id)})

(defn compile-rule
  [form]
  (cond-> {:id (-> form (required-child-value 'id) keyword->id)
           :kind (some-> (child-value form 'kind) keyword->id)
           :check (some-> (child-value form 'check) keyword->id)}
    (child-value form 'section) (assoc :section-id (-> form (child-value 'section) keyword->id))
    (some? (child-value form 'min)) (assoc :min (child-value form 'min))
    (some? (child-value form 'max)) (assoc :max (child-value form 'max))
    (some? (child-value form 'exactly)) (assoc :exactly (child-value form 'exactly))))

(defn compile-repair-template
  [form]
  {:id (-> form (required-child-value 'id) keyword->id)
   :when-rule-id (-> form (required-child-value 'when) keyword->id)
   :text (-> form (required-child-value 'text) str)})

(defn compile-review-criterion
  [form]
  {:id (-> form (required-child-value 'id) keyword->id)
   :weight (required-child-value form 'weight)})

(defn- read-contract-form
  [source]
  (try
    (edn/read-string source)
    (catch :default e
      (throw (contract-compile-error (str "EDN parse error: " (.-message e)))))))

(defn- require-root!
  [form head]
  (when-not (= head (first form))
    (throw (contract-compile-error (str "Root form must be (" head " ...)"))))
  form)

(defn- compile-review
  [form]
  (let [criteria (some-> form
                         (find-child 'criteria)
                         (compile-children 'criterion compile-review-criterion))]
    {:enabled (parse-bool (child-value form 'enabled) true)
     :reviewer-family (some-> (child-value form 'reviewer-family) keyword->id)
     :threshold (or (child-value form 'threshold) 0.8)
     :criteria (or criteria [])}))

(defn- compile-contract-body
  [form target]
  (let [structure-form (require-child form 'structure)
        rules-form (require-child form 'rules)
        repair-form (require-child form 'repair)
        review-form (require-child form 'review)
        sections (->> (compile-children structure-form 'section compile-section)
                      (sort-by :order)
                      vec)
        rules (compile-children rules-form 'rule compile-rule)
        repair-templates (compile-children repair-form 'template compile-repair-template)]
    (merge target
           {:repair-max-retries (or (child-value repair-form 'max-retries) 0)
            :sections sections
            :sections-by-id (index-by :id sections)
            :sections-by-heading (index-by :heading sections)
            :rules rules
            :rules-by-id (index-by :id rules)
            :repair-templates repair-templates
            :repair-templates-by-rule-id (group-by :when-rule-id repair-templates)
            :review (compile-review review-form)})))

(defn- mode-id [form]
  (-> form (required-child-value 'id) keyword->id))

(defn- compile-mode
  [program-meta target form]
  (merge program-meta
         {:mode-id (mode-id form)}
         (compile-contract-body form target)))

(defn compile-contract-program
  [source]
  (let [form (read-contract-form source)
        root (first form)
        name (-> form (required-child-value 'name) str)
        version (-> form (required-child-value 'v) str)
        target (-> form (require-child 'target) compile-target)
        program-meta {:name name :version version}]
    (cond
      (= root 'agent-output-contract)
      (let [contract (merge program-meta
                            {:mode-id "default"}
                            (compile-contract-body form target))]
        {:name name
         :version version
         :default-mode-id "default"
         :mode-order ["default"]
         :modes {"default" contract}})

      (= root 'agent-output-contracts)
      (let [modes-form (require-child form 'modes)
            modes (->> (compile-children modes-form 'mode (partial compile-mode program-meta target))
                       vec)
            default-mode-id (or (some-> (child-value form 'default-mode) keyword->id)
                                (:mode-id (first modes)))]
        (when-not (seq modes)
          (throw (contract-compile-error "agent-output-contracts requires at least one (mode ...)")))
        (when-not (some #(= default-mode-id (:mode-id %)) modes)
          (throw (contract-compile-error (str "default mode not found: " default-mode-id))))
        {:name name
         :version version
         :default-mode-id default-mode-id
         :mode-order (mapv :mode-id modes)
         :modes (index-by :mode-id modes)})

      :else
      (throw (contract-compile-error "Root form must be (agent-output-contract ...) or (agent-output-contracts ...)")))))

(defn select-contract-mode
  ([program]
   (select-contract-mode program nil))
  ([program mode-id]
   (let [selected-id (or mode-id (:default-mode-id program))
         contract (get-in program [:modes selected-id])]
     (or contract
         (throw (contract-compile-error (str "Unknown contract mode: " selected-id)))))))

(defn compile-contract
  ([source]
   (compile-contract source nil))
  ([source mode-id]
   (select-contract-mode (compile-contract-program source) mode-id)))

;; ============================================================
;; Markdown Extraction / Counting via AST tokens
;; ============================================================

(defonce ^:private markdown-parser
  (js/Reflect.construct (or (aget MarkdownIt "default") MarkdownIt)
                        #js ["commonmark" #js {:html false}]))

(defn- parse-markdown [markdown]
  (js/Array.from (.parse markdown-parser (or markdown "") #js {})))

(def token-type #(aget % "type"))
(def token-tag #(aget % "tag"))
(def token-level #(aget % "level"))

(defn- token-map [token]
  (when-let [m (some-> token (aget "map"))]
    [(aget m 0) (aget m 1)]))

(defn- h2-heading-open? [token]
  (and (= "heading_open" (token-type token))
       (= "h2" (token-tag token))))

(defn- heading-inline-content [tokens idx]
  (some-> (aget tokens (inc idx))
          token-type
          (#(when (= "inline" %) (aget (aget tokens (inc idx)) "content")))
          str/trim
          not-empty))

(defn- heading-token-record [tokens idx]
  (let [token (aget tokens idx)
        [start end] (token-map token)
        heading (heading-inline-content tokens idx)]
    (when (and (h2-heading-open? token) heading end)
      {:idx idx :start start :end end :heading heading})))

(defn- section-content [lines line-count heading next-heading]
  (let [next-start (or (:start next-heading) line-count)]
    (if (<= (:end heading) next-start)
      (str/join "\n" (subvec lines (:end heading) next-start))
      "")))

(defn extract-markdown-sections
  "Extract sections from markdown using parsed Markdown AST tokens.
   Returns {:sections [{:heading, :content}]} and ignores faux headings inside code fences."
  [markdown]
  (let [tokens (parse-markdown markdown)
        lines (vec (str/split-lines (or markdown "")))
        headings (->> (range (count tokens))
                      (keep (partial heading-token-record tokens))
                      vec)
        line-count (count lines)]
    {:sections (->> headings
                    (map-indexed (fn [idx heading]
                                   {:heading (:heading heading)
                                    :content (section-content lines line-count heading (nth headings (inc idx) nil))}))
                    vec)}))

(defn- semantic-token-step [{:keys [list-item-depth] :as state} token]
  (case (token-type token)
    "list_item_open"
    (cond-> (update state :list-item-depth inc)
      (= 1 (token-level token)) (update :list-items inc))

    "list_item_close"
    (update state :list-item-depth #(max 0 (dec %)))

    "paragraph_open"
    (cond-> state
      (zero? list-item-depth) (update :paragraph-blocks inc))

    state))

(defn count-semantic-items
  "Count semantic items in section content using Markdown AST tokens.
   Top-level list items count as items; otherwise paragraph blocks outside list
   items count as items. Fences/code do not inflate the count."
  [{:keys [content]}]
  (if (str/blank? content)
    0
    (let [{:keys [list-items paragraph-blocks]}
          (reduce semantic-token-step
                  {:list-items 0 :paragraph-blocks 0 :list-item-depth 0}
                  (parse-markdown content))]
      (max 1 (max list-items paragraph-blocks)))))

;; ============================================================
;; Validation (functional, no atoms)
;; ============================================================

(defn build-failure
  [contract {:keys [rule-id section-id heading expected actual message]}]
  (merge {:rule-id (or rule-id "unknown")
          :message (or message (str "Violation of " rule-id))}
         (when section-id {:section-id section-id})
         (when heading {:heading heading})
         (when expected {:expected expected})
         (when actual {:actual actual})))

(defn- check-required-sections
  "Returns failures for missing required sections."
  [contract headings]
  (into []
        (comp
          (filter :required)
          (filter (fn [section-def]
                    (not (some #(= (:heading section-def) %) headings))))
          (map (fn [section-def]
                 (build-failure contract
                   {:rule-id "rule/required-section"
                    :section-id (:id section-def)
                    :heading (:heading section-def)
                    :message (str "Missing required section `" (:heading section-def) "`")}))))
        (:sections contract)))

(defn- check-section-order
  "Returns failure if section order is wrong."
  [contract headings]
  (let [expected-headings (map :heading (:sections contract))]
    (if (= headings (take (count headings) expected-headings))
      []
      [(build-failure contract
         {:rule-id "rule/section-order"
          :expected {:headings expected-headings}
          :actual {:headings headings}
          :message "Section order mismatch"})])))

(defn- check-count-rules
  "Returns failures for count rule violations."
  [contract sections]
  (mapcat (fn [rule]
            (if-let [section-id (:section-id rule)]
              (if-let [section-def (get (:sections-by-id contract) section-id)]
                (if-let [section (first (filter #(= (:heading section-def) (:heading %)) sections))]
                  (let [count (count-semantic-items section)]
                    (cond
                      (and (:exactly rule) (not= count (:exactly rule)))
                      [(build-failure contract
                         {:rule-id (:id rule)
                          :section-id section-id
                          :heading (:heading section-def)
                          :expected {:exactly (:exactly rule)}
                          :actual {:count count}
                          :message (str "Section `" (:heading section-def) "` must have exactly " (:exactly rule) " semantic item(s); checker counted " count)})]

                      (and (:min rule) (< count (:min rule)))
                      [(build-failure contract
                         {:rule-id (:id rule)
                          :section-id section-id
                          :heading (:heading section-def)
                          :expected {:min (:min rule) :max (:max rule)}
                          :actual {:count count}
                          :message (str "Section `" (:heading section-def) "` must have at least " (:min rule) " semantic item(s); checker counted " count)})]

                      (and (:max rule) (> count (:max rule)))
                      [(build-failure contract
                         {:rule-id (:id rule)
                          :section-id section-id
                          :heading (:heading section-def)
                          :expected {:min (:min rule) :max (:max rule)}
                          :actual {:count count}
                          :message (str "Section `" (:heading section-def) "` must have at most " (:max rule) " semantic item(s); checker counted " count)})]

                      :else []))
                  [])
                [])
              []))
          (:rules contract)))

(defn validate-markdown-response
  [contract markdown]
  (let [{:keys [sections]} (extract-markdown-sections markdown)
        headings (map :heading sections)
        required-failures (check-required-sections contract headings)
        order-failures (check-section-order contract headings)
        count-failures (check-count-rules contract sections)
        all-failures (concat required-failures order-failures count-failures)]
    {:ok (empty? all-failures)
     :sections sections
     :failures (vec all-failures)}))

(defn to-failure-report
  [contract result]
  {:contract (:name contract)
   :version (:version contract)
   :stage "structure"
   :ok (:ok result)
   :failures (:failures result)})

(defn- deterministic-repair-guidance [failure]
  (case (:rule-id failure)
    "rule/frames-cardinality"
    "Deterministic format: under `## Frames`, use 2–3 markdown bullet items (`- ...`) or numbered items, one frame per item. Do not use prose-only inline sentences if you need the checker to count multiple frames."

    "rule/next-exactly-one-action"
    "Deterministic format: under `## Next`, use exactly one paragraph or exactly one bullet item containing one concrete next action."

    "rule/section-order"
    "Deterministic format: use exactly these level-2 headings in order: `## Signal`, `## Evidence`, `## Frames`, `## Countermoves`, `## Next`."

    "rule/required-section"
    "Deterministic format: every required section must be present as a level-2 markdown heading, e.g. `## Signal`."

    nil))

(defn compile-repair-prompt
  [contract result]
  (when-not (:ok result)
    (str/join "\n\n"
      (for [failure (:failures result)]
        (str (or (:message failure) (str "Violation: " (:rule-id failure)))
             (when-let [guidance (deterministic-repair-guidance failure)]
               (str "\n" guidance)))))))
