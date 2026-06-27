(ns promptbench.context-seed-test
  (:require [clojure.test :refer [deftest is]]
            [clojure.java.io :as io]
            [promptbench.corpus.context-seed :as context-seed]))

(deftest build-context-prompts-test
  (let [tmp-dir (str (System/getProperty "java.io.tmpdir")
                     "/shibboleth-context-seeds-" (System/currentTimeMillis))]
    (try
      (let [result (context-seed/build-context-prompts! {:output-dir tmp-dir
                                                         :seed 1337
                                                         :version "0.1.0"})
            rows (:context-prompts result)]
        (is (pos? (count rows)))
        (is (.exists (io/file tmp-dir "context_prompts.edn")))
        (is (.exists (io/file tmp-dir "context_prompts.parquet")))
        (is (.exists (io/file tmp-dir "manifest.edn")))
        (is (contains? (set (map :intent_label rows)) "adversarial"))
        (is (contains? (set (map :intent_label rows)) "benign"))
        (is (contains? (set (map :role_channel rows)) "system"))
        (is (contains? (set (map :role_channel rows)) "developer")))
      (finally
        (doseq [f (reverse (file-seq (io/file tmp-dir)))]
          (.delete f))))))
