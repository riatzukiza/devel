(ns eta-mu.extensions.contract-runtime-v2
  "Contract Runtime v2.

  Implements:
  - .ημ/ directory creation + CONTRACT.sha cache
  - PRINCIPLE.edn bootstrap from agents/mindfuck/CONTRACT.edn
  - Upward-walk CONTRACT.edn discovery on path-bearing tool calls
  - EDN map dispatch: actor | policy | fulfillment | capability | role | unknown->system-prompt
  - before_agent_start system prompt injection from PRINCIPLE.edn + actors + unknown blocks
  - Policy gate: evaluate-policies on every before_tool_call; :block halts, :warn/:note logs
  - Fulfillment notify/audit: evaluate-fulfillments on every after_tool_call
  - /crv2 reload: force state reset + re-walk for current cwd
  - /crv2 log: recent policy evaluations
  - /crv2 fulfills-log: recent fulfillment firings

  State is a CLJS atom per cwd, stored in a map-of-atoms under a single globalThis key.

  See: spec/contract-runtime-v2-spec.md
  Schema: spec/contracts-v1.edn"
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]
            [goog.object :as gobj]
            [eta-mu.extensions.contract-runtime-v2.core :as core]
            [eta-mu.extensions.prompt-section :as prompt-section]
            ["node:fs" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]
            ["node:crypto" :as crypto]))

(def HOME (.homedir os))
(def GLOBAL-KEY "__eta_mu_contract_runtime_v2__")
(def STATUS-KEY "contract-runtime-v2")
(def PROMPT-SECTION-START "<!-- eta-mu:contract-runtime-v2:start -->")
(def PROMPT-SECTION-END "<!-- eta-mu:contract-runtime-v2:end -->")
(def DEFAULT-TTL-MS 300000)
(def OPMF-OUTPUT-GATE-ID "fulfillment.mindfuck.output-gate")

;; ── State ────────────────────────────────────────────────

(defn fresh-state []
  {:loaded           {}
   :actors           []
   :policies         []
   :fulfills         []
   :runtime-features []
   :caps             {}
   :roles            {}
   :ttl-ms           DEFAULT-TTL-MS
   :policy-log       []
   :fulfillment-log  []
   :prompt-blocks    []
   :principle-ready  false
   :last-error       nil})

(defn registry []
  (let [g js/globalThis]
    (or (gobj/get g GLOBAL-KEY)
        (let [r #js {}]
          (gobj/set g GLOBAL-KEY r)
          r))))

(defn get-state-atom [cwd]
  (let [reg (registry) k (str cwd)]
    (or (gobj/get reg k)
        (let [a (atom (fresh-state))]
          (gobj/set reg k a)
          a))))

(defn reset-state! [cwd]
  (reset! (get-state-atom cwd) (fresh-state)))

;; ── FS helpers ─────────────────────────────────────────────

(defn file-exists? [p] (.existsSync fs p))
(defn ensure-dir! [dir] (.mkdirSync fs dir #js {:recursive true}))
(defn safe-read-text [p] (try (.readFileSync fs p "utf8") (catch :default _ nil)))
(defn write-text! [p text] (ensure-dir! (path/dirname p)) (.writeFileSync fs p text "utf8"))
(defn now-ms [] (.now js/Date))
(defn hm-dir [cwd] (path/join cwd ".ημ"))
(defn sha-cache-path [cwd] (path/join (hm-dir cwd) "CONTRACT.sha"))
(defn principle-path [cwd] (path/join (hm-dir cwd) "PRINCIPLE.edn"))
(defn ensure-hm-dir! [cwd] (ensure-dir! (hm-dir cwd)))

(defn sha256 [s]
  (let [h (.createHash crypto "sha256")]
    (.update h s) (.digest h "hex")))
(defn contract-sha [text] (sha256 (core/strip-whitespace text)))

(defn- opmf-dir-files [dir]
  (when (file-exists? dir)
    (->> (try (js/Array.from (.readdirSync fs dir #js {:withFileTypes true}))
              (catch :default _ []))
         (filter #(and (.isFile %) (.endsWith (.-name %) ".edn")))
         (map #(path/join dir (.-name %)))
         (sort (fn [a b]
                 (.localeCompare (path/basename a) (path/basename b)
                                 "en" #js {:numeric true :sensitivity "base"}))))))

(defn- read-opmf-dir-text [dir]
  (let [files (opmf-dir-files dir)]
    (when (seq files)
      (str/join "\n\n"
                (map (fn [f]
                       (str ";; --- " (path/basename f) " ---\n"
                            (str/replace (or (safe-read-text f) "") #"\s+$" "")))
                     files)))))

(defn read-sha-cache [cwd]
  (let [p (sha-cache-path cwd)]
    (if (file-exists? p)
      (try (js->clj (js/JSON.parse (safe-read-text p)) :keywordize-keys false)
           (catch :default _ {}))
      {})))

(defn write-sha-cache! [cwd cache]
  (write-text! (sha-cache-path cwd) (js/JSON.stringify (clj->js cache) nil 2)))

;; ── PRINCIPLE.edn bootstrap ────────────────────────────────

(defn locate-mindfuck-contract [cwd]
  (let [candidates [(path/join cwd "operation-mindfuck")
                    (path/join cwd ".." "operation-mindfuck")
                    (path/join cwd ".." "eta-mu" "operation-mindfuck")
                    (path/join cwd ".." ".." "eta-mu" "operation-mindfuck")
                    (path/join cwd ".." ".." ".." "eta-mu" "operation-mindfuck")
                    (path/join HOME "devel" "orgs" "open-hax" "eta-mu" "operation-mindfuck")
                    (path/join cwd "agents" "mindfuck" "CONTRACT.edn")
                    (path/join cwd ".." "agents" "mindfuck" "CONTRACT.edn")
                    (path/join cwd ".." ".." "agents" "mindfuck" "CONTRACT.edn")
                    (path/join cwd ".." ".." ".." "agents" "mindfuck" "CONTRACT.edn")
                    (path/join HOME ".ημ" "agent" "skills" "mindfuck" "CONTRACT.edn")]]
    (first (filter file-exists? (map path/resolve candidates)))))

(defn read-mindfuck-source-text [source]
  (when source
    (let [stat (try (.statSync fs source) (catch :default _ nil))]
      (if (and stat (.isDirectory stat))
        (read-opmf-dir-text source)
        (safe-read-text source)))))

(defn bootstrap-principle! [cwd]
  (let [source (locate-mindfuck-contract cwd)
        dest   (principle-path cwd)
        src-text (read-mindfuck-source-text source)]
    (cond
      (nil? source)
      {:ok false :reason "operation-mindfuck/ or agents/mindfuck/CONTRACT.edn not found"}

      (str/blank? src-text)
      {:ok false :reason (str "mindfuck contract source is empty: " source)}

      (not (file-exists? dest))
      (do (write-text! dest src-text)
          {:ok true :action :created :source source})

      :else
      (let [dest-text (safe-read-text dest)]
        (if (= (contract-sha src-text) (contract-sha dest-text))
          {:ok true :action :unchanged}
          (if (str/includes? dest-text ":disabled true")
            {:ok false :action :skipped
             :reason "PRINCIPLE.edn has :disabled sections — manual merge required"}
            (do (write-text! dest src-text)
                {:ok true :action :updated :source source})))))))

;; ── Dispatch ──────────────────────────────────────────────

(defn remove-entries-for-path [state contract-path]
  (let [evict     (fn [coll] (vec (remove #(= contract-path (:source %)) coll)))
        evict-map (fn [m] (into {} (remove (fn [[_ v]] (= contract-path (:source v))) m)))]
    (-> state
        (update :actors        evict)
        (update :policies      evict)
        (update :fulfills      evict)
        (update :runtime-features evict)
        (update :caps          evict-map)
        (update :roles         evict-map)
        (update :prompt-blocks evict))))

(defn apply-dispatch [state m]
  (let [kind         (core/contract-kind m)
        tagged       (assoc m :source (:source m))
        prompt       (core/prompt-block-for-map m nil)
        opmf-active? (gobj/get js/globalThis "__eta_mu_opmf_gate_active__")
        state*       (cond
                       (= kind :actor)       (update state :actors conj tagged)
                       (= kind :policy)      (update state :policies conj tagged)
                       (= kind :runtime-feature) (update state :runtime-features conj tagged)
                       (= kind :fulfillment) (if (and (= (:contract/id m) OPMF-OUTPUT-GATE-ID) opmf-active?)
                                               state
                                               (update state :fulfills conj tagged))
                       (= kind :capability)  (assoc-in state [:caps (str (:capability/id m))] tagged)
                       (= kind :role)        (assoc-in state [:roles (str (:role/id m))] tagged)
                       :else state)]
    (if (and (string? prompt) (not (str/blank? prompt)))
      (update state* :prompt-blocks conj prompt)
      state*)))

(defn dispatch-contract-file! [state-atom cwd contract-path]
  (let [text   (safe-read-text contract-path)
        sha    (contract-sha text)
        ttl-ms (:ttl-ms @state-atom)
        cache  (read-sha-cache cwd)
        entry  (get cache contract-path)
        in-mem (get-in @state-atom [:loaded contract-path])]
    (if (and (= sha (get entry "sha"))
             (core/cache-entry-fresh? (now-ms) entry ttl-ms)
             (some? in-mem))
      :cached
      (let [maps   (core/normalize-contract-forms text)
            tagged (map #(assoc % :source contract-path) maps)
            now    (now-ms)]
        (swap! state-atom
               (fn [s]
                 (let [evicted (remove-entries-for-path s contract-path)]
                   (reduce apply-dispatch
                           (assoc-in evicted [:loaded contract-path]
                                     {:sha sha :loaded-at now})
                           tagged))))
        (write-sha-cache! cwd
          (assoc cache contract-path {"sha" sha "loaded-at" now}))
        :loaded))))

;; ── Contract reload ────────────────────────────────────────

(defn reload-contracts! [cwd]
  (let [sa (get-state-atom cwd)]
    (reset! sa (fresh-state))
    (ensure-hm-dir! cwd)
    (bootstrap-principle! cwd)
    (let [files (core/walk-up-paths
                  #(path/join %1 %2) #(path/dirname %)
                  cwd cwd file-exists?)]
      (doseq [f files] (dispatch-contract-file! sa cwd f))
      (count files))))

;; ── UI helpers ───────────────────────────────────────────

(defn has-ui? [ctx] (boolean (gobj/get ctx "hasUI")))
(defn ctx-ui  [ctx] (gobj/get ctx "ui"))

(defn set-status! [ctx cwd]
  (when (has-ui? ctx)
    (let [s @(get-state-atom cwd)]
      (.setStatus (ctx-ui ctx) STATUS-KEY
                  (str "crv2 loaded:" (count (:loaded s))
                       " pol:"        (count (:policies s))
                       " ful:"        (count (:fulfills s))
                       " run:"        (count (:runtime-features s)))))))

;; ── Policy gate ──────────────────────────────────────────

(defn run-policy-gate! [sa tool-call ctx]
  (let [s         @sa
        loaded-at (get-in s [:loaded (first (keys (:loaded s))) :loaded-at])
        result    (core/evaluate-policies (:policies s) tool-call (now-ms) loaded-at)]
    (swap! sa update :policy-log
           #(vec (take-last 200 (conj % {:tool tool-call :result result :at (now-ms)}))))
    (case (:action result)
      :block (do (when (has-ui? ctx)
                   (.notify (ctx-ui ctx)
                            (str "⛔ blocked: " (:tool/name tool-call) " — " (:reason result))
                            "error"))
                 (js/console.warn (str "[crv2:block] " (:tool/name tool-call) " | " (:reason result)))
                 #js {:block true :reason (:reason result)})
      :warn  (do (when (has-ui? ctx)
                   (.notify (ctx-ui ctx)
                            (str "⚠️ policy warning: " (:tool/name tool-call) " — " (:reason result))
                            "warn"))
                 (js/console.warn (str "[crv2:warn] " (:tool/name tool-call) " | " (:reason result)))
                 nil)
      :note  (do (js/console.info (str "[crv2:note] " (:tool/name tool-call) " | " (:reason result)))
                 nil)
      nil)))

;; ── Fulfillment runner ────────────────────────────────────────

(def level->notify-type {:info "info" :warn "warn" :error "error"})

(defn truncate-message [s limit]
  (let [s (str (or s ""))]
    (if (> (count s) limit)
      (str (subs s 0 limit) "…")
      s)))

(defn slim-fulfillment-log-entry [tool-result action at]
  {:tool/name      (:tool/name tool-result)
   :tool/status    (or (:tool/status tool-result)
                       (:status tool-result)
                       (:tool/code tool-result)
                       (:code tool-result))
   :tool/error?    (boolean (:tool/error tool-result))
   :tool/message   (truncate-message (or (:tool/message tool-result)
                                         (:message tool-result)
                                         (:tool/output tool-result)
                                         (:tool/error tool-result))
                                     240)
   :action/id      (or (:action/id action)
                       (:contract/id (:fulfill action)))
   :action/type    (or (:action/type action)
                       (:mode action))
   :action/level   (:level action)
   :action/message (truncate-message (:message action) 240)
   :at             at})

(defn run-fulfillments! [sa tool-result ctx]
  (let [actions (core/evaluate-fulfillments (:fulfills @sa) tool-result)]
    (when (seq actions)
      (swap! sa update :fulfillment-log
             #(vec (take-last 200
                              (into % (map (fn [a]
                                            (slim-fulfillment-log-entry tool-result a (now-ms)))
                                          actions)))))
      (doseq [{:keys [mode message level]} actions]
        (case mode
          :notify
          (do
            (when (has-ui? ctx)
              (.notify (ctx-ui ctx) message (get level->notify-type level "info")))
            (js/console.info (str "[crv2:fulfill:notify] " message)))
          :audit
          (js/console.info (str "[crv2:fulfill:audit] " message))
          nil)))))

;; ── Path-bearing tool call hook ───────────────────────────

(defn on-path-bearing-tool-call! [params-js ctx]
  (when-let [raw-path (core/path-param-from-tool-call
                        (js->clj params-js :keywordize-keys false))]
    (let [cwd    (or (gobj/get ctx "cwd") HOME)
          sa     (get-state-atom cwd)
          abs    (path/resolve raw-path)
          stat   (try (.statSync fs abs) (catch :default _ nil))
          target (if stat
                   (if (.isDirectory stat) abs (path/dirname abs))
                   (path/dirname abs))
          files  (core/walk-up-paths
                   #(path/join %1 %2) #(path/dirname %)
                   target cwd file-exists?)]
      (ensure-hm-dir! cwd)
      (doseq [f files] (dispatch-contract-file! sa cwd f)))))

;; ── Prompt assembly ───────────────────────────────────────

(defn build-prompt-append [cwd state-atom]
  (core/build-prompt-append
    (safe-read-text (principle-path cwd))
    (:prompt-blocks @state-atom)))

(defn inject-runtime-prompt [system-prompt append]
  (prompt-section/upsert-section system-prompt
                                 PROMPT-SECTION-START
                                 PROMPT-SECTION-END
                                 append))

;; ── Extension ────────────────────────────────────────────

(em/defextension contract-runtime-v2
  :name "contract-runtime-v2"
  :description "Contract Runtime v2: cwd-walk, EDN dispatch, policy gate, fulfillment notify/audit."

  (em/on "session_start"
    :handler (fn [_event ctx]
               (let [cwd (or (gobj/get ctx "cwd") HOME)
                     sa  (get-state-atom cwd)]
                 (reset! sa (fresh-state))
                 (ensure-hm-dir! cwd)
                 (let [result (bootstrap-principle! cwd)]
                   (when-not (:ok result)
                     (js/console.warn (str "[crv2] PRINCIPLE.edn: " (:reason result))))
                   (swap! sa assoc :principle-ready (:ok result)))
                 (set-status! ctx cwd)
                 nil)))

  (em/on "session_switch"
    :handler (fn [_event ctx]
               (let [cwd (or (gobj/get ctx "cwd") HOME)
                     sa  (get-state-atom cwd)]
                 (reset! sa (fresh-state))
                 (ensure-hm-dir! cwd)
                 (swap! sa assoc :principle-ready
                        (:ok (bootstrap-principle! cwd)))
                 (set-status! ctx cwd)
                 nil)))

  (em/on "before_tool_call"
    :handler (fn [event ctx]
               (let [cwd       (or (gobj/get ctx "cwd") HOME)
                     sa        (get-state-atom cwd)
                     params-js (gobj/get event "params")
                     tool-call {:tool/name   (gobj/get event "toolName")
                                :tool/params (js->clj params-js :keywordize-keys true)}]
                 (on-path-bearing-tool-call! params-js ctx)
                 (run-policy-gate! sa tool-call ctx))))

  (em/on "after_tool_call"
    :handler (fn [event ctx]
               (let [cwd         (or (gobj/get ctx "cwd") HOME)
                     sa          (get-state-atom cwd)
                     tool-result {:tool/name    (gobj/get event "toolName")
                                  :tool/params  (js->clj (gobj/get event "params") :keywordize-keys true)
                                  :tool/output  (gobj/get event "output")
                                  :tool/error   (gobj/get event "error")
                                  :tool/status  (gobj/get event "status")
                                  :tool/code    (gobj/get event "code")
                                  :tool/message (gobj/get event "message")}]
                 (run-fulfillments! sa tool-result ctx)
                 nil)))

  (em/on "before_agent_start"
    :handler (fn [event ctx]
               (let [cwd    (or (gobj/get ctx "cwd") HOME)
                     sa     (get-state-atom cwd)
                     _      (when-not (:principle-ready @sa)
                              (ensure-hm-dir! cwd)
                              (let [result (bootstrap-principle! cwd)]
                                (when-not (:ok result)
                                  (js/console.warn (str "[crv2] PRINCIPLE.edn: " (:reason result))))
                                (swap! sa assoc :principle-ready (:ok result))))
                     append (build-prompt-append cwd sa)]
                 (when (and (string? append) (not (str/blank? append)))
                   #js {:systemPrompt (inject-runtime-prompt (gobj/get event "systemPrompt") append)}))))

  (em/on "session_shutdown"
    :handler (fn [_event ctx]
               (when (has-ui? ctx)
                 (.setStatus (ctx-ui ctx) STATUS-KEY js/undefined))))

  (em/command "crv2"
    :description "Inspect/control crv2: /crv2 status|loaded|actors|policies|fulfills|runtime-features|prompt|log|fulfills-log|reload"
    :handler (fn [args ctx]
               (let [cwd    (or (gobj/get ctx "cwd") HOME)
                     tokens (if (str/blank? args) [] (str/split (str/trim args) #"\s+"))
                     cmd    (or (first tokens) "status")]
                 (when (has-ui? ctx)
                   (let [ui (ctx-ui ctx)
                         s  @(get-state-atom cwd)]
                     (cond
                       (= cmd "status")
                       (.setWidget ui STATUS-KEY
                                   (clj->js
                                     [(str "principle-ready: " (:principle-ready s))
                                      (str "loaded: "          (count (:loaded s)))
                                      (str "actors: "          (count (:actors s)))
                                      (str "policies: "        (count (:policies s)))
                                      (str "fulfills: "        (count (:fulfills s)))
                                      (str "runtime-features: " (count (:runtime-features s)))
                                      (str "policy-log: "      (count (:policy-log s)))
                                      (str "fulfillment-log: " (count (:fulfillment-log s)))
                                      (str "ttl-ms: "          (:ttl-ms s))]))

                       (= cmd "loaded")
                       (.setWidget ui STATUS-KEY (clj->js (keys (:loaded s))))

                       (= cmd "actors")
                       (.setWidget ui STATUS-KEY
                                   (clj->js (map #(str (:actor/id %) " " (:actor/role %)) (:actors s))))

                       (= cmd "policies")
                       (.setWidget ui STATUS-KEY
                                   (clj->js (map :contract/id (:policies s))))

                       (= cmd "fulfills")
                       (.setWidget ui STATUS-KEY
                                   (clj->js (map #(str (:contract/id %) " mode:" (:fulfillment/mode %)) (:fulfills s))))

                       (= cmd "runtime-features")
                       (.setWidget ui STATUS-KEY
                                   (clj->js (map #(str (:contract/id %) " enabled:" (or (:runtime/enabled %) (:enabled %) (:runtime/default-enabled %)))
                                                 (:runtime-features s))))

                       (= cmd "prompt")
                       (.setWidget ui STATUS-KEY
                                   (clj->js [(or (build-prompt-append cwd (get-state-atom cwd))
                                                 "(no prompt append loaded)")]))

                       (= cmd "log")
                       (.setWidget ui STATUS-KEY
                                   (clj->js
                                     (map (fn [{:keys [tool result at]}]
                                            (str (:tool/name tool) " -> " (:action result)
                                                 (when (:reason result) (str " | " (:reason result)))
                                                 " @" at))
                                          (take-last 20 (:policy-log s)))))

                       (= cmd "fulfills-log")
                       (.setWidget ui STATUS-KEY
                                   (clj->js
                                     (map (fn [entry]
                                            (str (:tool/name entry)
                                                 " [" (:action/type entry) "/" (name (:action/level entry)) "]"
                                                 " " (:action/message entry)
                                                 (when-let [status (:tool/status entry)]
                                                   (str " status:" status))
                                                 (when (:tool/error? entry) " error:true")
                                                 (when-let [msg (:tool/message entry)]
                                                   (str " | " msg))
                                                 " @" (:at entry)))
                                          (take-last 20 (:fulfillment-log s)))))

                       (= cmd "reload")
                       (let [n (reload-contracts! cwd)]
                         (set-status! ctx cwd)
                         (.notify ui (str "[crv2] reloaded " n " contract(s) from " cwd) "info"))

                       :else
                       (.notify ui "Usage: /crv2 status|loaded|actors|policies|fulfills|runtime-features|prompt|log|fulfills-log|reload" "warn"))))))))
