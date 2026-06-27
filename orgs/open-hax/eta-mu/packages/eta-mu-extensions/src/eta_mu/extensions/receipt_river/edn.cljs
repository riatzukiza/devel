(ns eta-mu.extensions.receipt-river.edn
  "Pure EDN serialization for receipt-river events.
  No I/O. No side effects. Inject everywhere."
  (:require [clojure.string :as str]
            [cljs.reader :as reader]))

(def ^:private required-keys
  [:ts :kind :repo :origin :owner :dod :pi :host :manifest :refs])

(def ^:private optional-keys
  [:note :tests :decisions :drift])

(defn edn-event
  "Serializes a receipt event map to a single-line EDN string.
  Optional keys are omitted when nil/blank."
  [m]
  (let [base (reduce (fn [acc k]
                       (assoc acc k (get m k)))
                     {} required-keys)
        with-opts (reduce (fn [acc k]
                            (let [v (get m k)]
                              (if (and v (not (str/blank? (str v))))
                                (assoc acc k v)
                                acc)))
                          base optional-keys)]
    ;; pr-str produces valid EDN; replace internal newlines to keep single-line
    (-> (pr-str with-opts)
        (.replace (js/RegExp. "\\n" "g") " "))))

(defn parse-edn-event
  "Parses a single EDN line back to a map.
  Returns nil on any parse failure, non-map result, or blank/nil input."
  [line]
  (when (and line (not (str/blank? (str line))))
    (try
      (let [result (reader/read-string (str line))]
        (when (map? result) result))
      (catch :default _ nil))))
