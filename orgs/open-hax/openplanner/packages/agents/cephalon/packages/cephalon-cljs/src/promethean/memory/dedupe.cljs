(ns promethean.memory.dedupe
  (:require [clojure.string :as str]))

(defn- norm-text [s]
  (-> (or s "")
      str/trim
      (str/replace #"\s+" " ")
      str/lower-case))

(defn discord-dedupe-key [evt]
  (let [mid (get-in evt [:event/payload :message-id])
        cid (get-in evt [:event/source :channel-id])]
    (when (and mid cid)
      (str "discord:" cid ":" mid))))

(defn content-hash-key [evt]
  (let [cid (get-in evt [:event/source :channel-id])
        txt (norm-text (get-in evt [:event/payload :content]))]
    (when (and cid (not (str/blank? txt)))
      (str "content:" cid ":" (hash txt)))))

(defn dedupe-key [evt]
  (or (discord-dedupe-key evt)
      (content-hash-key evt)))
