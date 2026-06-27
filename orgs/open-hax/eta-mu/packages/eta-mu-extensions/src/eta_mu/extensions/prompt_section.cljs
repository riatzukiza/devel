(ns eta-mu.extensions.prompt-section
  "Helpers for idempotent prompt-section injection.

  Several eta-mu extensions augment the system prompt during before_agent_start.
  If the host reuses the previously augmented prompt on later turns, naive string
  concatenation causes unbounded prompt growth. These helpers make section
  injection replace-in-place instead of append-forever."
  (:require [clojure.string :as str]))

(defn strip-section [text start-marker end-marker]
  (let [text (or text "")
        start-idx (.indexOf text start-marker)]
    (if (neg? start-idx)
      text
      (let [end-search-start (+ start-idx (.-length start-marker))
            end-idx (.indexOf text end-marker end-search-start)
            after-end (if (neg? end-idx)
                        ""
                        (.slice text (+ end-idx (.-length end-marker))))
            before (.slice text 0 start-idx)]
        (str before (str/replace after-end #"^\s*" ""))))))

(defn upsert-section [text start-marker end-marker body]
  (let [base (str/trimr (strip-section text start-marker end-marker))]
    (if (str/blank? body)
      base
      (str base
           (when-not (str/blank? base) "\n\n")
           start-marker "\n"
           body "\n"
           end-marker))))