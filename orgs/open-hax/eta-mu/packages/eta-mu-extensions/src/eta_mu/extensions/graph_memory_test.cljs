(ns eta-mu.extensions.graph-memory-test
  (:require [cljs.test :refer [deftest is testing]]
            [eta-mu.extensions.graph-memory :as gm]))

(deftest vector-result-hits-test
  (let [result {:ids [["doc-1" "doc-2"]]
                :documents [["first document" "second document"]]
                :metadatas [[{:path "docs/one.md"}
                             {:path "docs/two.md"}]]
                :distances [[0.12 0.34]]}
        hits (gm/vector-result-hits result)]
    (is (= 2 (count hits)))
    (is (= "doc-1" (:id (first hits))))
    (is (= "first document" (:document (first hits))))
    (is (= {:path "docs/two.md"} (:metadata (second hits))))
    (is (= 0.34 (:distance (second hits))))))

(deftest preview-text-normalizes-whitespace
  (is (= "hello world"
         (gm/preview-text "  hello\n\nworld  " 40)))
  (is (= "abcdef…"
         (gm/preview-text "abcdefghi" 6))))

(deftest format-hydrated-context-combines-sources
  (let [text (gm/format-hydrated-context
              {:semantic {:hits [{:id "sem-1"
                                  :metadata {:path "docs/spec.md"}
                                  :document "semantic snippet here"}]}
               :memory {:hits [{:session "sess-1"
                                :role "assistant"
                                :document "remembered action trace"}]}
               :graph {:nodes [{:id "devel:file:docs/spec.md"
                                :lake "devel"
                                :nodeType "file"
                                :label "docs/spec.md"
                                :text "graph snippet"}]}
               :workbench #js [#js {"id" "devel:file:docs/spec.md"
                                    "kind" "file"
                                    "label" "docs/spec.md"
                                    "layer" "local"}]}
              4000)]
    (is (.includes text "Semantic corpus matches:"))
    (is (.includes text "Session memory matches:"))
    (is (.includes text "Graph memory matches:"))
    (is (.includes text "Graph workbench matches:"))))

(deftest format-hydrated-context-truncates
  (let [text (gm/format-hydrated-context
              {:semantic {:hits [{:id "sem-1"
                                  :document (apply str (repeat 200 "x"))}]}}
              80)]
    (is (= 80 (count text)))
    (is (.endsWith text "…"))))
