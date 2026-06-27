(ns test-buffers
  (:require [clojure.test :refer [deftest is testing]]
            [opencode-unified.buffers :as buffers]))

(deftest test-line-col-conversion
  (testing "pos-to-line-col"
    (let [content "line1\nline2\nline3"]
      (is (= [0 0] (buffers/pos-to-line-col content 0)))
      (is (= [0 5] (buffers/pos-to-line-col content 5)))
      (is (= [1 0] (buffers/pos-to-line-col content 6)))
      (is (= [1 5] (buffers/pos-to-line-col content 11)))
      (is (= [2 0] (buffers/pos-to-line-col content 12)))))

  (testing "line-col-to-pos"
    (let [content "line1\nline2\nline3"]
      (is (= 0 (buffers/line-col-to-pos content 0 0)))
      (is (= 5 (buffers/line-col-to-pos content 0 5)))
      (is (= 6 (buffers/line-col-to-pos content 1 0)))
      (is (= 11 (buffers/line-col-to-pos content 1 5)))
      (is (= 12 (buffers/line-col-to-pos content 2 0)))))

  (testing "get-line-content"
    (let [content "line1\nline2\nline3"]
      (is (= "line1" (buffers/get-line-content content 0)))
      (is (= "line2" (buffers/get-line-content content 1)))
      (is (= "line3" (buffers/get-line-content content 2)))
      (is (nil? (buffers/get-line-content content 3)))))

  (testing "get-line-count"
    (is (= 1 (buffers/get-line-count "line1")))
    (is (= 2 (buffers/get-line-count "line1\nline2")))
    (is (= 3 (buffers/get-line-count "line1\nline2\nline3"))))

  (testing "get-line-range"
    (let [content "line1\nline2"]
      (is (= [0 5] (buffers/get-line-range content 0)))
      (is (= [6 11] (buffers/get-line-range content 1)))
      (is (nil? (buffers/get-line-range content 2))))))

(deftest test-word-boundaries
  (testing "find-next-word-boundary"
    (let [content "hello world"]
      (is (= 6 (buffers/find-next-word-boundary content 0)))
      (is (= 11 (buffers/find-next-word-boundary content 6)))))

  (testing "find-prev-word-boundary"
    (let [content "hello world"]
      (is (= 6 (buffers/find-prev-word-boundary content 11)))
      (is (= 0 (buffers/find-prev-word-boundary content 5))))))
