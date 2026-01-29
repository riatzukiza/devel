(ns pm2-clj.eval
  (:require [clojure.string :as str]
            [cljs.reader :as reader]
            [pm2-clj.util :as u]))

(def ^:dynamic *cwd* nil)

(defn- resolve-path [path]
  (if *cwd*
    (if (or (str/starts-with? path "/")
            (str/starts-with? path "."))
      path
      (u/join *cwd* path))
    path))

(defn- include-code [path]
  (let [full-path (resolve-path path)]
    (when-not (u/exists? full-path)
      (throw (ex-info "File not found" {:path full-path})))
    (u/read-file full-path)))

(defn eval-file [path]
  (let [code (include-code path)
        result (reader/read-string code)]
    result))
