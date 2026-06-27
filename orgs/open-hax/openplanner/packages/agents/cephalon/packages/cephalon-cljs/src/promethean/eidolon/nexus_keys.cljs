(ns promethean.eidolon.nexus-keys)

(defn keys-for-memory [mem]
  (let [meta (:memory/meta mem)
        tags (:memory/tags mem)
        kind (:memory/kind mem)
        base (cond-> []
               true (into (map #(str "tag:" %) tags))
               true (conj (str "kind:" (name kind))))]
    (-> base
        (cond-> (:discord/channel-id meta) (conj (str "chan:" (:discord/channel-id meta))))
        (cond-> (:discord/author-id meta) (conj (str "author:" (:discord/author-id meta))))
        (cond-> (:discord/message-id meta) (conj (str "msg:" (:discord/message-id meta))))
        (cond-> (:fs/path meta) (conj (str "path:" (:fs/path meta))))
        vec)))
