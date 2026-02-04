(ns promethean.contracts.markdown-frontmatter
  (:require [clojure.string :as str]))

(defn- has-frontmatter?
  [s]
  (boolean (re-find #"^---\s*\n[\s\S]*?\n---\s*\n" (or s ""))))


(defn- strip-quotes
  [s]
  (when s
    (str/trim (str/replace (str s) #"^['\"]|['\"]$" ""))))

;; Tiny YAML-like parser: supports simple key: value and key: followed by list
(defn- parse-yaml
  [yaml]
  (let [lines (-> (or yaml "") str/trim str/split-lines)
        len (count lines)
        finalize (fn [acc key items]
                   (if (and key (seq items))
                     (assoc acc key items)
                     acc))]
    (loop [idx 0, acc {}, cur-key nil, cur-list []]
      (if (>= idx len)
        (finalize acc cur-key cur-list)
        (let [line (nth lines idx)
              t (str/trim line)]
          (cond
            (empty? t)
            (recur (inc idx) acc cur-key cur-list)

            (re-matches #"^-\\s*(.*)$" t)
            (let [item (strip-quotes (second (re-matches #"^-\\s*(.*)$" t)))]
              (recur (inc idx) acc cur-key (conj cur-list item)))

            (re-matches #"^([^:]+):\\s*$" t)
            (let [k (keyword (second (re-matches #"^([^:]+):\\s*$" t)))]
              (recur (inc idx) (finalize acc cur-key cur-list) k []))

            (re-matches #"^([^:]+):\\s*(.*)$" t)
            (let [m (re-matches #"^([^:]+):\\s*(.*)$" t)
                  k (keyword (nth m 1))
                  v (strip-quotes (nth m 2 ""))]
              (recur (inc idx) (assoc (finalize acc cur-key cur-list) k v) k []))

            :else
            (recur (inc idx) acc cur-key cur-list)))))))

(defn- parse-frontmatter-yaml
  [yaml]
  (parse-yaml yaml))

(defn parse-frontmatter
  [md]
  (when (has-frontmatter? md)
    (let [m (re-find #"^---\s*\n([\s\S]*?)\n---\s*\n" (or md ""))]
      (when m
        (let [yaml (second m)]
          (when (and yaml (not (str/blank? yaml)))
            (let [parsed (parse-frontmatter-yaml yaml)]
              (when (seq parsed)
                parsed))))))))

(defn valid-frontmatter?
  [md]
  (let [parsed (parse-frontmatter md)]
    (and parsed
         (contains? parsed :title)
         (contains? parsed :slug)
         (contains? parsed :description)
         (contains? parsed :tags))))
