(ns promethean.runtime.eidolon
  (:require [promethean.eidolon.prompt :as prompt]
            [promethean.eidolon.index :as idx]
            [promethean.llm.openai-compat :as llm]
            [promethean.memory.dedup :as dedup]
            [promethean.memory.store :as store]))

(defn make-eidolon [] {:eidolon/index (idx/make-index)})

(defn embed-text! [eidolon llm-cfg text {:keys [stable-key meta]}]
  (let [emb (llm/embeddings llm-cfg {:model (get-in llm-cfg [:embedding-model] "qwen3-embedding")
                                    :input text})
        vec (llm/first-embedding emb)]
    (idx/put-vec! (:eidolon/index eidolon) {:key stable-key :vec vec :meta meta})))

(defn remember!
  [{:keys [eidolon mem-store llm-cfg embedding-prompt agent-name]} mem]
  (let [mem' (store/put! mem-store mem)
        stable-key (dedup/stable-memory-key mem')
        text (prompt/render {:system-defined embedding-prompt
                             :persistent []
                             :recent []
                             :agent-name agent-name
                             :latest (:content mem')
                             :tags (or (:tags mem') [])})]
    (embed-text! eidolon llm-cfg text {:stable-key stable-key
                                      :meta {:memory/id (:memory/id mem')}})
    mem'))

(defn related [{:keys [eidolon llm-cfg top-k]} query-text]
  (let [emb (llm/embeddings llm-cfg {:model (get-in llm-cfg [:embedding-model] "qwen3-embedding")
                                    :input query-text})
        qvec (llm/first-embedding emb)]
    (idx/search (:eidolon/index eidolon) qvec {:top-k top-k})))
