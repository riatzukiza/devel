(ns eta-mu.extensions.graph-memory
  "Graph memory tools for OpenPlanner/Graph-Weaver integration.

  Provides:
  - graph-memory-search: Search the knowledge graph
  - graph-memory-recall: Get neighbors and context for a node
  - graph-memory-ingest: Add nodes/edges to the graph
  - context-hydrate: Passive context injection hook

  The graph-weaver service runs at port 8796 and provides a GraphQL API
  for querying the living knowledge graph built from repo scans, web weaves,
  and user mutations."
  (:require-macros [eta-mu.core :as em])
  (:require ["os" :as os]
            ["fs" :as fs]
            ["path" :as path]
            ["node:crypto" :as crypto]
            [clojure.string :as str]))

;; =============================================================================
;; State directory resolution (same pattern as other extensions)
;; =============================================================================

(def ^:const HOME (.homedir os))
(def ^:const ETA-MU-STATE-ROOT (path/join HOME ".ημ" "state"))
(def ^:const LEGACY-STATE-ROOT (str HOME "/.ημ/agent/state"))

(defn resolve-state-dir [name]
  (let [eta-mu-dir (path/join ETA-MU-STATE-ROOT name)
        legacy-dir (path/join LEGACY-STATE-ROOT name)]
    (if (.existsSync fs eta-mu-dir)
      eta-mu-dir
      (if (.existsSync fs legacy-dir)
        legacy-dir
        eta-mu-dir))))

(def ^:const STATE-DIR (resolve-state-dir "graph-memory"))
(def ^:const CONFIG-FILE (path/join STATE-DIR "config.json"))

;; =============================================================================
;; Configuration
;; =============================================================================

(def DEFAULT-GRAPH-WEAVER-URL "http://127.0.0.1:8796")
(def DEFAULT-OPENPLANNER-URL "http://127.0.0.1:7777")
(def DEFAULT-OPENPLANNER-PROJECT "devel")
(def DEFAULT-OPENPLANNER-SESSION-PROJECT "knoxx-session")
(def DEFAULT-OPENPLANNER-SOURCE "knoxx")
(def DEFAULT-ADMIN-TOKEN nil)  ; Set via GRAPH_WEAVER_ADMIN_TOKEN env

(defn graph-weaver-url []
  (or (aget js/process.env "GRAPH_WEAVER_URL")
      (aget js/process.env "OPENPLANNER_GRAPH_WEAVER_URL")
      DEFAULT-GRAPH-WEAVER-URL))

(defn openplanner-url []
  (or (aget js/process.env "OPENPLANNER_URL")
      (aget js/process.env "OPENPLANNER_BASE_URL")
      DEFAULT-OPENPLANNER-URL))

(defn openplanner-api-key []
  (or (aget js/process.env "OPENPLANNER_API_KEY")
      (aget js/process.env "KNOXX_OPENPLANNER_API_KEY")))

(defn openplanner-project []
  (or (aget js/process.env "OPENPLANNER_PROJECT")
      (aget js/process.env "KNOXX_OPENPLANNER_PROJECT")
      DEFAULT-OPENPLANNER-PROJECT))

(defn openplanner-session-project []
  (or (aget js/process.env "OPENPLANNER_SESSION_PROJECT")
      (aget js/process.env "KNOXX_OPENPLANNER_SESSION_PROJECT")
      DEFAULT-OPENPLANNER-SESSION-PROJECT))

(defn openplanner-source []
  (or (aget js/process.env "OPENPLANNER_SOURCE")
      (aget js/process.env "KNOXX_OPENPLANNER_SOURCE")
      DEFAULT-OPENPLANNER-SOURCE))

(defn admin-token []
  (aget js/process.env "GRAPH_WEAVER_ADMIN_TOKEN"))

(defn trim-trailing-slashes [value]
  (str/replace (str (or value "")) #"/+$" ""))

(defn openplanner-enabled? []
  (and (not (str/blank? (openplanner-url)))
       (not (str/blank? (str (or (openplanner-api-key) ""))))))

(defn openplanner-headers []
  #js {"Content-Type" "application/json"
       "Authorization" (str "Bearer " (openplanner-api-key))})

(defn openplanner-request
  "Execute an HTTP request against OpenPlanner's REST API.
   Returns a Promise resolving to keywordized CLJS data."
  ([method suffix signal]
   (openplanner-request method suffix nil signal))
  ([method suffix body signal]
   (if-not (openplanner-enabled?)
     (js/Promise.reject (js/Error. "OpenPlanner is not configured"))
     (let [opts #js {:method method
                     :headers (openplanner-headers)
                     :signal signal}
           url (str (trim-trailing-slashes (openplanner-url)) suffix)]
       (when body
         (aset opts "body" (js/JSON.stringify (clj->js body))))
       (-> (js/fetch url opts)
           (.then (fn [resp]
                    (-> (.text resp)
                        (.then (fn [raw]
                                 (let [text (str (or raw ""))
                                       parsed (if (str/blank? text)
                                                #js {}
                                                (try
                                                  (js/JSON.parse text)
                                                  (catch :default _
                                                    #js {"raw" text})))
                                       preview (if (> (count text) 1000)
                                                 (subs text 0 1000)
                                                 text)]
                                   (if (.-ok resp)
                                     (js->clj parsed :keywordize-keys true)
                                     (js/Promise.reject
                                      (js/Error. (str "OpenPlanner request failed ("
                                                      (.-status resp) "): "
                                                      preview)))))))))))))))

;; =============================================================================
;; GraphQL Client
;; =============================================================================

(defn graphql-request
  "Execute a GraphQL query against the graph-weaver endpoint.
   Returns a Promise that resolves to the data or rejects with an error."
  [query variables signal]
  (let [url (str (graph-weaver-url) "/graphql")
        token (admin-token)
        headers (cond-> #js {"Content-Type" "application/json"}
                  token (aset "Authorization" (str "Bearer " token)))
        ;; Convert CLJS map to JS object with string keys
        vars-js (clj->js variables)
        body #js {"query" query "variables" vars-js}
        body-str (js/JSON.stringify body)]
    (js/console.log "[graph-memory] GraphQL request:" body-str)
    (-> (js/fetch url
                  #js {:method "POST"
                       :headers headers
                       :body body-str
                       :signal signal})
        (.then (fn [resp]
                 (-> (.text resp)
                     (.then (fn [raw]
                              (let [json (js/JSON.parse raw)]
                                (if (.-ok resp)
                                  (if-let [errors (aget json "errors")]
                                    (js/Promise.reject
                                      (js/Error. (str "GraphQL errors: "
                                                      (js/JSON.stringify errors))))
                                    (aget json "data"))
                                  (js/Promise.reject
                                    (js/Error. (str "GraphQL request failed ("
                                                    (.-status resp) "): "
                                                    (subs raw 0 1000))))))))))))))

;; =============================================================================
;; Utility functions
;; =============================================================================

(defn ensure-dir [dir]
  (.mkdirSync fs dir #js {:recursive true}))

(defn now-iso []
  (.toISOString (js/Date.)))

(defn generate-id [prefix]
  (str prefix "_" (.substring (.createHash crypto "sha256") (.update (.randomBytes crypto 16)) "digest" "hex" 0 16)))

(defn parse-data-json [data-json]
  (when (and data-json (pos? (count data-json)))
    (try
      (js/JSON.parse data-json)
      (catch :default _ nil))))

(defn first-result-array [value]
  (let [items (or value [])
        first-item (first items)]
    (if (sequential? first-item)
      (vec first-item)
      [])))

(defn vector-result-hits [result]
  (let [ids (first-result-array (:ids result))
        docs (first-result-array (:documents result))
        metas (first-result-array (:metadatas result))
        distances (first-result-array (:distances result))]
    (mapv (fn [idx id]
            {:id id
             :document (nth docs idx "")
             :metadata (nth metas idx {})
             :distance (nth distances idx nil)})
          (range (count ids))
          ids)))

(defn preview-text [value max-chars]
  (let [s (-> (str (or value ""))
              (str/replace #"\s+" " ")
              str/trim)]
    (when (pos? (count s))
      (if (> (count s) max-chars)
        (str (subs s 0 max-chars) "…")
        s))))

(defn format-number [value digits]
  (when (some? value)
    (.toFixed (js/Number. value) digits)))

(defn promise-settle [key promise]
  (-> promise
      (.then (fn [value]
               {:key key :ok true :value value}))
      (.catch (fn [err]
                {:key key
                 :ok false
                 :error (or (.-message err) (str err))}))))

(defn format-node [node]
  (let [id (aget node "id")
        kind (aget node "kind")
        label (aget node "label")
        layer (aget node "layer")
        data-json (aget node "dataJson")
        data (parse-data-json data-json)]
    (cond-> {:id id :kind kind :label label}
      layer (assoc :layer layer)
      data (assoc :data data))))

(defn format-edge [edge]
  (let [source (aget edge "source")
        target (aget edge "target")
        kind (aget edge "kind")
        layer (aget edge "layer")
        data-json (aget edge "dataJson")
        data (parse-data-json data-json)]
    (cond-> {:source source :target target :kind kind}
      layer (assoc :layer layer)
      data (assoc :data data))))

(defn openplanner-semantic-search
  [query limit signal]
  (let [q (str/trim (str (or query "")))
        k (max 1 (min 20 (or limit 6)))]
    (if (str/blank? q)
      (js/Promise.resolve {:query "" :mode :none :hits []})
      (-> (openplanner-request "POST" "/v1/search/vector"
                               {:q q
                                :k k
                                :project (openplanner-project)}
                               signal)
          (.then (fn [body]
                   {:query q
                    :mode :vector
                    :hits (vector-result-hits (:result body))}))
          (.catch (fn [_]
                    (-> (openplanner-request "POST" "/v1/search/fts"
                                             {:q q
                                              :limit k
                                              :project (openplanner-project)}
                                             signal)
                        (.then (fn [body]
                                 {:query q
                                  :mode :fts
                                  :hits (vec (or (:rows body) []))})))))))))

(defn openplanner-memory-search
  [query limit signal]
  (let [q (str/trim (str (or query "")))
        k (max 1 (min 8 (or limit 4)))]
    (if (str/blank? q)
      (js/Promise.resolve {:query "" :mode :none :hits []})
      (-> (openplanner-request "POST" "/v1/search/vector"
                               {:q q
                                :k k
                                :source (openplanner-source)
                                :project (openplanner-session-project)}
                               signal)
          (.then (fn [body]
                   {:query q
                    :mode :vector
                    :hits (vector-result-hits (:result body))}))
          (.catch (fn [_]
                    (-> (openplanner-request "POST" "/v1/search/fts"
                                             {:q q
                                              :limit k
                                              :source (openplanner-source)
                                              :project (openplanner-session-project)}
                                             signal)
                        (.then (fn [body]
                                 {:query q
                                  :mode :fts
                                  :hits (vec (or (:rows body) []))})))))))))

(defn openplanner-graph-query
  [query limit signal]
  (let [q (str/trim (str (or query "")))
        k (max 1 (min 20 (or limit 8)))]
    (if (str/blank? q)
      (js/Promise.resolve {:query "" :nodes [] :edges [] :clusters []})
      (openplanner-request "POST" "/v1/graph/memory"
                           {:q q
                            :k k
                            :includeText true}
                           signal))))

(defn graph-workbench-search
  [query limit signal]
  (let [q (str/trim (str (or query "")))]
    (if (str/blank? q)
      (js/Promise.resolve #js [])
      (-> (graphql-request "
        query SearchNodes($query: String!, $limit: Int!) {
          searchNodes(query: $query, limit: $limit) {
            id
            kind
            label
            layer
            dataJson
          }
        }"
                           {:query q :limit limit}
                           signal)
          (.then (fn [data]
                   (or (aget data "searchNodes") #js [])))))))

;; =============================================================================
;; Context Hydration
;; =============================================================================

(defn format-context-for-injection
  "Format graph search results into a context string for injection.
   Used for passive context hydration."
  [results max-length]
  (when (and results (pos? (alength results)))
    (let [lines (->> (js/Array.from results)
                     (map (fn [node]
                            (let [id (aget node "id")
                                  kind (aget node "kind")
                                  label (aget node "label")
                                  layer (aget node "layer")]
                              (str "- [" id "] " label " (kind=" kind ", layer=" layer ")"))))
                     (str/join "\n"))
          full-text (str "Related context from knowledge graph:\n" lines)]
      (if (> (count full-text) max-length)
        (subs full-text 0 max-length)
        full-text))))

(defn format-semantic-context [result]
  (when-let [hits (seq (:hits result))]
    (str "Semantic corpus matches:\n"
         (str/join
          "\n\n"
          (map-indexed
           (fn [idx hit]
             (let [metadata (or (:metadata hit) {})
                   path (or (:path hit)
                            (:sourcePath hit)
                            (:source_path hit)
                            (:sourcePath metadata)
                            (:source_path metadata)
                            (:path metadata))
                   title (or (:title hit) (:title metadata) (:id hit) "semantic-hit")
                   distance (format-number (:distance hit) 3)
                   snippet (or (preview-text (:snippet hit) 260)
                               (preview-text (:document hit) 260)
                               (preview-text (:text hit) 260)
                               (preview-text (:text metadata) 260))]
               (str (inc idx) ". " title
                    (when distance
                      (str " (distance=" distance ")"))
                    (when path
                      (str "\n   path: " path))
                    (when snippet
                      (str "\n   snippet: " snippet)))))
           hits)))))

(defn format-memory-context [result]
  (when-let [hits (seq (:hits result))]
    (str "Session memory matches:\n"
         (str/join
          "\n\n"
          (map-indexed
           (fn [idx hit]
             (let [metadata (or (:metadata hit) {})
                   session (or (:session hit)
                               (:session metadata)
                               (:conversation_id metadata)
                               "unknown-session")
                   role (or (:role hit) (:role metadata) "memory")
                   snippet (or (preview-text (:snippet hit) 260)
                               (preview-text (:document hit) 260)
                               (preview-text (:text hit) 260)
                               (preview-text (:text metadata) 260))]
               (str (inc idx) ". session=" session ", role=" role
                    (when snippet
                      (str "\n   snippet: " snippet)))))
           hits)))))

(defn format-graph-query-context [result]
  (when-let [nodes (seq (:nodes result))]
    (str "Graph memory matches:\n"
         (str/join
          "\n\n"
          (map-indexed
           (fn [idx node]
             (let [data (or (:data node) {})
                   label (or (:label node) (:id node) "graph-node")
                   lake (or (:lake node) "graph")
                   node-type (or (:nodeType node) (:node_type node) (:kind node) "node")
                   score (or (:score node) (:similarity node))
                   score-text (format-number score 3)
                   path (or (:path node) (:path data))
                   url (:url data)
                   text (or (preview-text (:text node) 240)
                            (preview-text (:preview data) 240))]
               (str (inc idx) ". [" lake "/" node-type "] " label
                    (when score-text
                      (str " (score=" score-text ")"))
                    (str "\n   id: " (:id node))
                    (when path
                      (str "\n   path: " path))
                    (when url
                      (str "\n   url: " url))
                    (when text
                      (str "\n   text: " text)))))
           nodes)))))

(defn format-workbench-context [results]
  (when (and results (pos? (alength results)))
    (str "Graph workbench matches:\n"
         (str/join
          "\n"
          (map-indexed
           (fn [idx node]
             (let [id (aget node "id")
                   label (or (aget node "label") id)
                   kind (aget node "kind")
                   layer (aget node "layer")]
               (str (inc idx) ". [" kind "/" layer "] " label "\n   id: " id)))
           (js/Array.from results))))))

(defn format-hydrated-context [sources max-length]
  (let [sections (->> [(format-semantic-context (:semantic sources))
                       (format-memory-context (:memory sources))
                       (format-graph-query-context (:graph sources))
                       (format-workbench-context (:workbench sources))]
                      (remove str/blank?))]
    (when (seq sections)
      (let [full-text (str "Related context from OpenPlanner and graph memory:\n\n"
                           (str/join "\n\n" sections))]
        (if (> (count full-text) max-length)
          (str (subs full-text 0 (max 0 (dec max-length))) "…")
          full-text)))))

(defn hydrate-context
  "Hydrate context from the same families Knoxx uses: semantic corpus search,
   session memory search, OpenPlanner graph memory, and Graph-Weaver search."
  [query max-nodes signal]
  (let [semantic-promise (if (openplanner-enabled?)
                           (openplanner-semantic-search query max-nodes signal)
                           (js/Promise.resolve nil))
        memory-promise (if (openplanner-enabled?)
                         (openplanner-memory-search query (min max-nodes 4) signal)
                         (js/Promise.resolve nil))
        graph-promise (if (openplanner-enabled?)
                        (openplanner-graph-query query max-nodes signal)
                        (js/Promise.resolve nil))
        workbench-promise (graph-workbench-search query max-nodes signal)]
    (-> (js/Promise.all
         (clj->js [(promise-settle :semantic semantic-promise)
                   (promise-settle :memory memory-promise)
                   (promise-settle :graph graph-promise)
                   (promise-settle :workbench workbench-promise)]))
        (.then (fn [results]
                 (let [resolved (reduce (fn [acc item]
                                          (if (:ok item)
                                            (assoc acc (:key item) (:value item))
                                            acc))
                                        {}
                                        (array-seq results))]
                   (format-hydrated-context resolved 4000))))
        (.catch (fn [_err]
                  ;; Silently fail - context hydration is best-effort
                  nil)))))

;; =============================================================================
;; Tool Implementations
;; =============================================================================

(em/defextension graph-memory
  :name "graph-memory"
  :description "Graph memory tools for OpenPlanner/Graph-Weaver integration"

  ;; ---------------------------------------------------------------------------
  ;; graph-memory-search
  ;; ---------------------------------------------------------------------------
  (em/tool "graph-memory-search"
    :label "Graph Memory Search"
    :description "Search the knowledge graph for relevant nodes by label, content, or metadata."
    :parameters {:query {:type "string" :description "Search query"}
                 :limit {:type "integer" :minimum 1 :maximum 200 :description "Maximum results (default: 20)" :optional true}}
    :execute (fn [_tcid params signal onUpdate ctx]
               (let [query (aget params "query")
                     limit (or (aget params "limit") 20)
                     gql-query "
                       query SearchNodes($query: String!, $limit: Int!) {
                         searchNodes(query: $query, limit: $limit) {
                           id
                           kind
                           label
                           external
                           loadedByDefault
                           layer
                           dataJson
                         }
                       }"
                     fallback-search (fn [err-message]
                                       (if (openplanner-enabled?)
                                         (-> (openplanner-graph-query query limit signal)
                                             (.then (fn [result]
                                                      (if (seq (:nodes result))
                                                        #js {:content #js [#js {:type "text" :text (format-graph-query-context result)}]
                                                             :details #js {:count (count (:nodes result))
                                                                           :query query
                                                                           :source "openplanner-graph-memory"}}
                                                        (if err-message
                                                          (js/Promise.reject
                                                           (js/Error. (str "Graph search failed: " err-message)))
                                                          #js {:content #js [#js {:type "text" :text "No results found"}]
                                                               :details #js {:count 0 :query query}})))))
                                         (if err-message
                                           (js/Promise.reject
                                            (js/Error. (str "Graph search failed: " err-message)))
                                           #js {:content #js [#js {:type "text" :text "No results found"}]
                                                :details #js {:count 0 :query query}})))]
                 (when onUpdate
                   (onUpdate #js {:content #js [#js {:type "text" :text (str "Searching graph: " query "...")}]}))
                 (-> (graphql-request gql-query {:query query :limit limit} signal)
                     (.then (fn [data]
                              (let [nodes (or (aget data "searchNodes") #js [])]
                                (if (pos? (alength nodes))
                                  (let [formatted (->> (js/Array.from nodes)
                                                       (map format-node)
                                                       (js/JSON.stringify nil 2))]
                                    #js {:content #js [#js {:type "text" :text (str "Found " (alength nodes) " graph workbench nodes:\n\n" formatted)}]
                                         :details #js {:count (alength nodes)
                                                       :query query
                                                       :source "graph-weaver"}})
                                  (fallback-search nil)))))
                     (.catch (fn [err]
                               (fallback-search (.-message err))))))))

  ;; ---------------------------------------------------------------------------
  ;; graph-memory-recall
  ;; ---------------------------------------------------------------------------
  (em/tool "graph-memory-recall"
    :label "Graph Memory Recall"
    :description "Get neighbors and edges for a specific node to recall related context."
    :parameters {:id {:type "string" :description "Node ID to recall context for"}
                 :direction {:type "string" :enum ["in" "out" "both"] :description "Edge direction (default: both)" :optional true}
                 :kind {:type "string" :description "Filter by edge kind" :optional true}
                 :limit {:type "integer" :minimum 1 :maximum 200 :description "Maximum neighbors (default: 50)" :optional true}
                 :include-preview {:type "boolean" :description "Include node preview content (default: false)" :optional true}}
    :execute (fn [_tcid params signal onUpdate ctx]
               (let [node-id (aget params "id")
                     direction (or (aget params "direction") "both")
                     kind (aget params "kind")
                     limit (or (aget params "limit") 50)
                     include-preview (aget params "include-preview")
                     gql-query "
                       query RecallContext($id: ID!, $direction: String!, $kind: String, $limit: Int!, $includePreview: Boolean!) {
                         node(id: $id) {
                           id
                           kind
                           label
                           layer
                           dataJson
                         }
                         neighbors(id: $id, direction: $direction, kind: $kind, limit: $limit) {
                           id
                           kind
                           label
                           layer
                           dataJson
                         }
                         edges(source: $id, limit: $limit) @include(if: false) {
                           id
                           target
                           kind
                         }
                         nodePreview(id: $id, maxBytes: 50000) @include(if: $includePreview) {
                           format
                           contentType
                           language
                           body
                           truncated
                           bytes
                         }
                       }"]
                 (when onUpdate
                   (onUpdate #js {:content #js [#js {:type "text" :text (str "Recalling context for: " node-id "...")}]}))
                 (-> (graphql-request gql-query
                                      {:id node-id
                                       :direction direction
                                       :kind kind
                                       :limit limit
                                       :includePreview (boolean include-preview)}
                                      signal)
                     (.then (fn [data]
                              (let [node (aget data "node")
                                    neighbors (aget data "neighbors")
                                    preview (aget data "nodePreview")]
                                (if node
                                  (let [node-info (format-node node)
                                        neighbor-info (when neighbors
                                                        (->> (js/Array.from neighbors)
                                                             (map format-node)))
                                        preview-info (when preview
                                                       {:format (aget preview "format")
                                                        :language (aget preview "language")
                                                        :body (aget preview "body")
                                                        :truncated (aget preview "truncated")})
                                        result (cond-> {:node node-info}
                                                 neighbor-info (assoc :neighbors neighbor-info)
                                                 preview-info (assoc :preview preview-info))]
                                    #js {:content #js [#js {:type "text" :text (js/JSON.stringify (clj->js result) nil 2)}]
                                         :details #js {:nodeId node-id :neighborCount (alength neighbors)}})
                                  #js {:content #js [#js {:type "text" :text (str "Node not found: " node-id)}]}))))
                     (.catch (fn [err]
                               (js/Promise.reject
                                 (js/Error. (str "Graph recall failed: " (.-message err))))))))))

  ;; ---------------------------------------------------------------------------
  ;; graph-memory-ingest
  ;; ---------------------------------------------------------------------------
  (em/tool "graph-memory-ingest"
    :label "Graph Memory Ingest"
    :description "Add nodes and edges to the knowledge graph. Use this to persist learned relationships, decisions, or context."
    :parameters {:nodes {:type "array"
                         :items {:type "object"
                                 :properties {:id {:type "string"}
                                              :kind {:type "string"}
                                              :label {:type "string"}
                                              :external {:type "boolean"}
                                              :data {:type "object"}}
                                 :required ["id"]}
                         :description "Nodes to upsert"}
                 :edges {:type "array"
                         :items {:type "object"
                                 :properties {:id {:type "string"}
                                              :source {:type "string"}
                                              :target {:type "string"}
                                              :kind {:type "string"}
                                              :data {:type "object"}}
                                 :required ["id" "source" "target"]}
                         :description "Edges to upsert"}}
    :execute (fn [_tcid params signal onUpdate ctx]
               (when onUpdate
                 (onUpdate #js {:content #js [#js {:type "text" :text "Ingesting into graph memory..."}]}))

               ;; Upsert nodes
               (let [nodes (aget params "nodes")
                     edges (aget params "edges")
                     node-promises (when (and nodes (pos? (alength nodes)))
                                     (->> (js/Array.from nodes)
                                          (map (fn [node]
                                                 (let [node-id (aget node "id")
                                                       gql-mutation "
                                                         mutation UpsertNode($input: NodeInput!) {
                                                           graphUpsertNode(input: $input) {
                                                             id
                                                             kind
                                                             label
                                                             layer
                                                           }
                                                         }"]
                                                   (graphql-request gql-mutation
                                                                    {:input {:id node-id
                                                                            :kind (aget node "kind")
                                                                            :label (aget node "label")
                                                                            :external (aget node "external")
                                                                            :dataJson (when-let [d (aget node "data")]
                                                                                        (js/JSON.stringify d))}}
                                                                    signal))))))
                     edge-promises (when (and edges (pos? (alength edges)))
                                     (->> (js/Array.from edges)
                                          (map (fn [edge]
                                                 (let [edge-id (aget edge "id")
                                                       gql-mutation "
                                                         mutation UpsertEdge($input: EdgeInput!) {
                                                           graphUpsertEdge(input: $input) {
                                                             id
                                                             source
                                                             target
                                                             kind
                                                           }
                                                         }"]
                                                   (graphql-request gql-mutation
                                                                    {:input {:id edge-id
                                                                            :source (aget edge "source")
                                                                            :target (aget edge "target")
                                                                            :kind (aget edge "kind")
                                                                            :dataJson (when-let [d (aget edge "data")]
                                                                                        (js/JSON.stringify d))}}
                                                                    signal))))))]
                 (-> (js/Promise.all (clj->js (concat node-promises edge-promises)))
                     (.then (fn [_results]
                              #js {:content #js [#js {:type "text" :text (str "Ingested "
                                                                              (count node-promises) " nodes, "
                                                                              (count edge-promises) " edges into graph memory")}]
                                   :details #js {:nodeCount (count node-promises)
                                                 :edgeCount (count edge-promises)}}))
                     (.catch (fn [err]
                               (js/Promise.reject
                                 (js/Error. (str "Graph ingest failed: " (.-message err))))))))))

  ;; ---------------------------------------------------------------------------
  ;; context-hydrate (passive context injection hook)
  ;; ---------------------------------------------------------------------------
  (em/tool "context-hydrate"
    :label "Context Hydrate"
    :description "Passive context hydration: search the graph for relevant context and return it for injection into the conversation. Use this before complex operations to surface related knowledge."
    :parameters {:query {:type "string" :description "Query to find relevant context"}
                 :maxNodes {:type "integer" :minimum 1 :maximum 50 :description "Maximum context nodes (default: 10)" :optional true}}
    :execute (fn [_tcid params signal onUpdate ctx]
               (let [query (aget params "query")
                     max-nodes (or (aget params "maxNodes") 10)]
                 (when onUpdate
                   (onUpdate #js {:content #js [#js {:type "text" :text (str "Hydrating context for: " query "...")}]}))
                 (-> (hydrate-context query max-nodes signal)
                     (.then (fn [context]
                              (if context
                                #js {:content #js [#js {:type "text" :text context}]
                                     :details #js {:hydrated true :query query}}
                                #js {:content #js [#js {:type "text" :text "No relevant context found in graph memory"}]
                                     :details #js {:hydrated false :query query}})))
                     (.catch (fn [err]
                               ;; Best-effort: return empty context on failure
                               #js {:content #js [#js {:type "text" :text (str "Context hydration failed: " (.-message err))}]
                                    :details #js {:hydrated false :error (.-message err)}}))))))

  ;; ---------------------------------------------------------------------------
  ;; graph-memory-status
  ;; ---------------------------------------------------------------------------
  (em/tool "graph-memory-status"
    :label "Graph Memory Status"
    :description "Get status of the graph memory service (node count, edge count, weaver status)."
    :parameters {}
    :execute (fn [_tcid params signal onUpdate ctx]
               (let [gql-query "
                 query Status {
                   status {
                     nodes
                     edges
                     seeds
                     weaver {
                       frontier
                       inFlight
                     }
                   }
                 }"]
                 (-> (graphql-request gql-query {} signal)
                     (.then (fn [data]
                              (if-let [status (aget data "status")]
                                (let [nodes (aget status "nodes")
                                      edges (aget status "edges")
                                      seeds (aget status "seeds")
                                      weaver (aget status "weaver")
                                      frontier (when weaver (aget weaver "frontier"))
                                      in-flight (when weaver (aget weaver "inFlight"))]
                                  #js {:content #js [#js {:type "text" :text (str "Graph Memory Status:\n"
                                                                                   "  Nodes: " nodes "\n"
                                                                                   "  Edges: " edges "\n"
                                                                                   "  Seeds: " seeds "\n"
                                                                                   "  Weaver frontier: " frontier "\n"
                                                                                   "  Weaver in-flight: " in-flight)}]
                                       :details #js {:nodes nodes :edges edges :seeds seeds
                                                     :weaver #js {:frontier frontier :inFlight in-flight}}})
                                #js {:content #js [#js {:type "text" :text "Unable to get graph status"}]})))
                     (.catch (fn [err]
                               (js/Promise.reject
                                 (js/Error. (str "Graph status failed: " (.-message err)
                                                 " (is graph-weaver running at " (graph-weaver-url) "?)")))))))))
  )
