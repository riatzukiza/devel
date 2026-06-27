(ns eta-mu.runtime.extern.json
  (:require [eta-mu.runtime.extern.js :as extern-js]))

(defn stringify
  [value]
  (js/JSON.stringify (extern-js/clj->value value)))

(defn parse
  [text]
  (try
    (extern-js/success :json (extern-js/value->clj (js/JSON.parse text)))
    (catch js/Error error
      (extern-js/error :json "Invalid JSON" (.-name error) (.-message error)))))
