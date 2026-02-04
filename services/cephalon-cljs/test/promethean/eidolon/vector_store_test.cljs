(ns promethean.eidolon.vector-store-test
  (:require [cljs.test :refer [deftest is testing]]
            [promethean.eidolon.vector-store :as vs]))

(deftest vector-store-basic-upsert-and-search
  (let [store (vs/make-store)
        lane :default
        a-id "a" a-vec [1 0 0] a-meta {:ts 1000 :deleted false}
        b-id "b" b-vec [0 1 0] b-meta {:ts 2000 :deleted false}
        c-id "c" c-vec [1 1 0] c-meta {:ts 3000 :deleted false}]
    ;; Upsert three vectors
    (vs/upsert! store lane a-id a-vec a-meta)
    (vs/upsert! store lane b-id b-vec b-meta)
    (vs/upsert! store lane c-id c-vec c-meta)
    ;; Search with query vector close to a
    (let [results (vs/search store lane [1 0 0] {:k 3 :now-ms 10000})
          ids (map first results)]
      ;; Expect top results to be a, then c, then b
      (is (= ["a" "c" "b"] ids))
      )))

(deftest vector-store-deleted-removal
  (let [store (vs/make-store)
        lane :default
        a-id "a" a-vec [1 0 0] a-meta {:ts 1000 :deleted false}
        b-id "b" b-vec [0 1 0] b-meta {:ts 2000 :deleted false}
        c-id "c" c-vec [1 1 0] c-meta {:ts 3000 :deleted false}]
    (vs/upsert! store lane a-id a-vec a-meta)
    (vs/upsert! store lane b-id b-vec b-meta)
    (vs/upsert! store lane c-id c-vec c-meta)
    ;; delete b
    (vs/upsert! store lane b-id b-vec {:ts 4000 :deleted true})
    (let [results (vs/search store lane [1 0 0] {:k 3 :now-ms 10000})
          ids (map first results)]
      (is (= ["a" "c"] ids)))))
