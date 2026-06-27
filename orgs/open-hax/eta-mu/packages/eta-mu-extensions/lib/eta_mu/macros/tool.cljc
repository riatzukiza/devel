(ns eta-mu.macros.tool
  "Tool definition macros for eta-mu extensions.
   
   Provides:
   - deftool: define a tool with schema validation
   - def-tool-schema: generate parameter schema
   - with-result: format tool result"
  (:require-macros [eta-mu.macros.tool])
  (:require [clojure.string :as str]))

(defn- schema-type->cljs [type-spec]
  "Convert type specification to CLJS type string.
   {:type 'string' :description '...' :optional true} -> 'string'"
  (cond
    (map? type-spec)
    (let [t (get type-spec :type "string")
          desc (get type-spec :description)
          enum (get type-spec :enum)
          min (get type-spec :min)
          max (get type-spec :max)
          opt (get type-spec :optional)]
      (cond
        enum (str "enum:" (pr-str enum))
        :else (name t)))
    :else (name type-spec)))

(defn- build-param-schema [params]
  "Build parameter schema from param map.
   {:action {:type 'string' :enum [...]}
    :path {:type 'string' :optional true}}
   ->
   {:type 'object'
    :properties {:action {:type 'string' :enum [...]}
                :path {:type 'string'}}
    :required [:action]}"
  (when (empty? params)
    nil
    (let [properties (into {}
                            (map (fn [[k v]]
                                  [k (dissoc v :optional)]))
                            params)
          required (vec (keep (fn [[_k v]] (not (:optional v))) (keys params)))]
      (cond-> {:type "object"
               :properties properties
               :additionalProperties false}
        (seq required) (assoc :required required)))))

(defmacro deftool
  "Define a tool with automatic schema generation.
   
   Usage:
     (deftool analyze_image
       :description \"Analyze an image with a vision model\"
       :label \"Analyze Image\"
       :parameters {:source {:type 'string :description 'Image source'}
                   :prompt {:type 'string :description 'What to ask'}
                   :contract {:type 'string :description 'Contract name' :optional true}}
       :execute (fn [params ctx]
                 (call-vision-api (aget params \"source\")
                                  (aget params \"prompt\"))))
   
   Expands to em/tool with generated parameter schema."
  [tool-name & opts]
  (let [description (:description opts)
        label (:label opts)
        params (:parameters opts)
        execute (:execute opts)
        schema (build-param-schema params)]
    `(em/tool ~(str tool-name)
       :label ~label
       :description ~description
       :parameters ~schema
       :execute ~execute)))

(defmacro def-tool-schema
  "Generate a parameter schema map without defining the tool.
   Useful for shared schemas or complex validation."
  [schema-name params]
  (let [schema (build-param-schema params)]
    `(def ~schema-name ~schema)))

(defmacro with-result
  "Generate a standard tool result map.
   
   Usage:
     (with-result text
       :details {:file file-path :count count}
       :metadata {:tool \"analyze-image\"})"
  [text & opts]
  (let [details (:details opts)
        metadata (:metadata opts)]
    (cond
      (and details metadata)
      `#js {:content #js [#js {:type "text" :text ~text}]
           :details ~details
           :metadata ~metadata}
      
      details
      `#js {:content #js [#js {:type "text" :text ~text}]
           :details ~details}
      
      metadata
      `#js {:content #js [#js {:type "text" :text ~text}]
           :metadata ~metadata}
      
      :else
      `#js {:content #js [#js {:type "text" :text ~text}]})))

(defn make-text-result
  "Helper function for creating text-only results at runtime.
   (make-text-result \"Success\" {:file \"test.txt\"})"
  ([text details]
   (if details
     #js {:content #js [#js {:type "text" :text text}]
          :details details}
     #js {:content #js [#js {:type "text" :text text}]})))
