(ns promethean.contracts.markdown-frontmatter
  (:require [clojure.string :as str]))

(defn- has-frontmatter? [s]
  (boolean (re-find #"(?s)^---\s*\n.*?\n---\s*\n" (or s ""))))

(defn- yaml-has-key? [yaml k]
  (boolean (re-find (re-pattern (str "(?m)^" (java.util.regex.Pattern/quote k) "\s*:")) yaml)))

(defn valid-frontmatter? [md]
  (when (has-frontmatter? md)
    (let [m (re-find #"(?s)^---\s*\n(.*?)\n---\s*\n" md)
          yaml (second m)]
      (and yaml
           (yaml-has-key? yaml "title")
           (yaml-has-key? yaml "slug")
           (yaml-has-key? yaml "description")
           (yaml-has-key? yaml "tags")))))
