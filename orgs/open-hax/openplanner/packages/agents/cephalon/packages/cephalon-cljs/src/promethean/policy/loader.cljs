(ns promethean.policy.loader
  "EDN policy loader for Cephalon configuration"
  (:require [promethean.policy.types :as policy]
            [clojure.string :as str]))

;; ============================================================================
;; Default Policy (used when EDN file not found)
;; ============================================================================

(defn load-default-policy
  "Return the default policy from spec"
  []
  policy/default-policy)

;; ============================================================================
;; EDN Parsing (basic implementation)
;; ============================================================================

(defn- parse-keyword
  [s]
  (if (str/starts-with? s ":")
    (keyword (subs s 1))
    s))

(defn- parse-number
  [s]
  (cond
    (str/includes? s ".") (js/parseFloat s)
    :else (js/parseInt s 10)))

(defn- parse-boolean
  [s]
    (if (= s "true") true false))

(defn- parse-set
  [s]
  (let [content (subs s 1 (dec (count s)))]
    (if (str/blank? content)
      #{}
      (set (map parse-keyword (str/split content #"\s+"))))))

(defn- parse-vector
  [s]
  (let [content (subs s 1 (dec (count s)))]
    (if (str/blank? content)
      []
      (vec (str/split content #"\s+")))))

(defn- parse-string-value
  [s]
  (subs s 1 (dec (count s))))

(defn- parse-value
  [s]
  (cond
    (str/starts-with? s ":") (parse-keyword s)
    (str/starts-with? s "\"") (parse-string-value s)
    (str/starts-with? s "#{") (parse-set s)
    (str/starts-with? s "[") (parse-vector s)
    (= s "true") true
    (= s "false") false
    (re-matches #"-?\d+\.\d+" s) (parse-number s)
    (re-matches #"-?\d+" s) (parse-number s)
    :else s))

(defn- parse-kv-pair
  [line]
  (let [[k v] (str/split line #"\s+" 2)]
    [(parse-keyword k) (parse-value v)]))

(defn- parse-top-level
  [content]
  (loop [lines (str/split-lines content)
         result {}]
    (if (empty? lines)
      result
      (let [line (str/trim (first lines))]
        (cond
          (str/blank? line) (recur (rest lines) result)
          (str/starts-with? line ";") (recur (rest lines) result)
          (str/starts-with? line "(") (recur (rest lines) result) ; skip complex forms for now
          :else
          (let [[k v] (parse-kv-pair line)]
            (recur (rest lines) (assoc result k v))))))))

;; ============================================================================
;; Policy Loading
;; ============================================================================

(defn load-policy
  "Load policy from EDN string, falling back to defaults"
  [edn-string]
  (if (str/blank? edn-string)
    (load-default-policy)
    (try
      (let [parsed (parse-top-level edn-string)]
        ;; Build full policy from parsed values
        (merge (load-default-policy) parsed))
      (catch js/Error e
        (println "Error parsing policy, using defaults:" (str e))
        (load-default-policy)))))

(defn load-policy-from-file
  "Load policy from a file path"
  [path]
  (try
    (let [fs (js/require "fs")
          content (.readFileSync fs path "utf8")]
      (load-policy content))
    (catch js/Error _
      (load-default-policy))))
