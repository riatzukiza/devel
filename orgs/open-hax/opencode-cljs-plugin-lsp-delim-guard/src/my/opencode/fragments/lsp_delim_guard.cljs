(ns my.opencode.fragments.lsp-delim-guard
  (:require [my.opencode.state :as state]))

(def clj-exts [".clj" ".cljs" ".cljc" ".edn"])

(defn ^:private js-or
  [& xs]
  (some identity xs))

(defn ^:private get-uri [payload]
  (js-or
   (.-uri payload)
   (.. payload -params -uri)
   (.. payload -event -uri)
   (.. payload -params -textDocument -uri)))

(defn ^:private get-diagnostics [payload]
  (js-or
   (.-diagnostics payload)
   (.. payload -params -diagnostics)
   (.. payload -event -diagnostics)
   (.. payload -params -diagnostic)))

(defn ^:private ends-with-any? [s suffixes]
  (and s (some #(.endsWith (str s) %) suffixes)))

(defn ^:private uri->path
  "Best-effort convert file:// URI to a path-like string for logs.
   If it isn't a file URI, return original."
  [uri]
  (let [u (str (or uri ""))]
    (if (.startsWith u "file://")
      (try
        (let [raw (.replace u "file://" "")]
          (js/decodeURIComponent raw))
        (catch :default _
          u))
      u)))

(defn ^:private start-pos-1based
  "Prefer structured LSP range. Return {:line <1-based> :col <1-based>} or nil."
  [^js diag]
  (let [r (.-range diag)
        s (when r (.-start r))
        line (when s (.-line s))
        col  (when s (.-character s))]
    (when (and (number? line) (number? col))
      {:line (inc line) :col (inc col)})))

(defn ^:private split-kondo-lines
  "Some tools combine multiple errors into one message. Extract lines that start with 'Error ['."
  [msg]
  (->> (.split (or msg "") "\n")
       (map #(.trim %))
       (filter #(and (pos? (.-length %))
                     (.startsWith % "Error [")))))

(defn ^:private parse-line-col
  "Parse 'Error [10:3] ...' into 1-based {:line 10 :col 3}."
  [msg]
  (let [m (or msg "")
        r (js/RegExp. "Error\\s*\\[(\\d+):(\\d+)\\]" "i")
        mm (.match m r)]
    (when mm
      {:line (js/parseInt (aget mm 1) 10)
       :col  (js/parseInt (aget mm 2) 10)})))

(defn ^:private parse-delims
  "Parse common clj-kondo / clojure-lsp delimiter diagnostics.

  Handles:
  - Error [10:3] Found an opening ( with no matching )
  - Error [46:1] Expected a ) to match ( from line 10

  Returns map like:
  {:kind \"unclosed-open\" :line 10 :col 3 :open \"(\" :expected \")\"}
  {:kind \"expected-close\" :line 46 :col 1 :expected \")\" :open \"(\" :openLine 10}
  {:kind \"unknown\"}"
  [msg]
  (let [m (or msg "")
        r-open-no-match (js/RegExp.
                         "Error\\s*\\[(\\d+):(\\d+)\\]\\s*Found an opening\\s*([\\(\\[\\{])\\s*with no matching\\s*([\\)\\]\\}])"
                         "i")
        r-expected-close (js/RegExp.
                          "Error\\s*\\[(\\d+):(\\d+)\\]\\s*Expected a\\s*([\\)\\]\\}])\\s*to match\\s*([\\(\\[\\{])\\s*from line\\s*(\\d+)"
                          "i")
        r-unmatched (js/RegExp. "Unmatched delimiter\\s*:?\\s*([\\)\\]\\}])" "i")
        r-exp-got   (js/RegExp. "expected\\s*('?)([\\)\\]\\}])\\1\\s*(?:but\\s*)?(?:got|found)\\s*('?)([\\)\\]\\}])\\3" "i")
        r-found-exp (js/RegExp. "Found\\s*('?)([\\)\\]\\}])\\1\\s*but\\s*expected\\s*('?)([\\)\\]\\}])\\3" "i")
        m1 (.match m r-open-no-match)
        m2 (.match m r-expected-close)
        m3 (.match m r-exp-got)
        m4 (.match m r-found-exp)
        m5 (.match m r-unmatched)]
    (cond
      m1 {:kind "unclosed-open"
          :line (js/parseInt (aget m1 1) 10)
          :col  (js/parseInt (aget m1 2) 10)
          :open (aget m1 3)
          :expected (aget m1 4)}
      m2 {:kind "expected-close"
          :line (js/parseInt (aget m2 1) 10)
          :col  (js/parseInt (aget m2 2) 10)
          :expected (aget m2 3)
          :open (aget m2 4)
          :openLine (js/parseInt (aget m2 5) 10)}
      m3 {:kind "mismatch" :expected (aget m3 2) :found (aget m3 4)}
      m4 {:kind "mismatch" :found (aget m4 2) :expected (aget m4 4)}
      m5 {:kind "unmatched" :found (aget m5 1)}
      :else {:kind "unknown"})))

(defn ^:private delim-like?
  [msg]
  (let [m (or msg "")
        parsed (parse-delims m)]
    (or (not= "unknown" (:kind parsed))
        (.includes m "delimiter")
        (.includes m "Found an opening")
        (.includes m "Expected a"))))

(defn ^:private log! [ctx msg extra]
  (if-let [client (.-client ctx)]
    (-> client .-app (.log #js {:service "lsp-delim-guard"
                               :level "warn"
                               :message msg
                               :extra extra}))
    (js/console.warn msg extra)))

(defn ^:private emit-hit! [ctx uri hit]
  (let [path (uri->path uri)
        line (:line hit)
        col  (:col hit)
        kind (:kind hit)
        found (:found hit)
        expected (:expected hit)
        open (:open hit)
        openLine (:openLine hit)
        jump (str path ":" line ":" col)
        summary (cond
                  (and expected open openLine)
                  (str "Delimiter " kind ": expected " expected " to match " open " from line " openLine)
                  (and open expected)
                  (str "Delimiter " kind ": opening " open " has no matching " expected)
                  (and expected found)
                  (str "Delimiter " kind ": found " found " expected " expected)
                  found
                  (str "Delimiter " kind ": " found)
                  :else
                  (str "Delimiter issue"))]
    (log! ctx summary
          #js {:uri (or uri "")
               :path path
               :jump jump
               :line line
               :col col
               :kind (or kind "")
               :found (or found "")
               :expected (or expected "")
               :open (or open "")
               :openLine (or openLine "")
               :message (:message hit)})))

(defn fragment
  "Options:
   {:max 8 :only-exts [\".clj\" \".cljs\" \".cljc\" \".edn\"]}

   Stores last hits in ctx state under \"lastDelimDiags\"."
  [{:keys [max only-exts]
    :or {max 8 only-exts clj-exts}}]
  {:hooks
   {"lsp.client.diagnostics"
    (fn [ctx payload]
      (let [uri (get-uri payload)
            diags (or (get-diagnostics payload) #js [])]
        (when (or (nil? uri) (ends-with-any? (str uri) only-exts))
          (let [hits
                (->> (array-seq diags)
                     (mapcat (fn [d]
                               (let [msg (or (.-message d) "")
                                     pos1 (start-pos-1based d)
                                     lines (let [ls (split-kondo-lines msg)]
                                             (if (seq ls) ls [msg]))]
                                 (->> lines
                                      (filter delim-like?)
                                      (map (fn [line-msg]
                                             (let [parsed (parse-delims line-msg)
                                                   pos-from-msg (parse-line-col line-msg)
                                                   pos (or pos1 pos-from-msg)]
                                               (when (and pos (not= "unknown" (:kind parsed)))
                                                 (merge
                                                  {:message line-msg
                                                   :line (:line pos)
                                                   :col (:col pos)}
                                                  parsed)))))))))
                     (filter some?)
                     (take max)
                     (vec))]
            (when (seq hits)
              (state/set! ctx "lastDelimDiags" (clj->js hits))
              (doseq [h hits]
                (emit-hit! ctx uri h)))))))}}})
