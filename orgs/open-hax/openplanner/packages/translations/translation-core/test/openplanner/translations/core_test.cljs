(ns openplanner.translations.core-test
  (:require [cljs.test :refer [deftest is run-tests]]
            [openplanner.translations.boundary :as boundary]))

(deftest label-overall-drives-segment-status
  (is (= "approved" (boundary/next-segment-status-js #js {:overall "approve" :currentStatus "pending"})))
  (is (= "approved" (boundary/next-segment-status-js #js {:overall "needs_edit" :corrected_text "fix"})))
  (is (= "in_review" (boundary/next-segment-status-js #js {:overall "needs_edit"})))
  (is (= "rejected" (boundary/next-segment-status-js #js {:overall "reject"}))))

(deftest document-status-is-derived-from-counts
  (is (= "fully_approved" (boundary/document-overall-status-js #js {:total 3 :approved 3})))
  (is (= "fully_rejected" (boundary/document-overall-status-js #js {:total 2 :rejected 2})))
  (is (= "pending_review" (boundary/document-overall-status-js #js {:total 2 :pending 2})))
  (is (= "partial_review" (boundary/document-overall-status-js #js {:total 2 :approved 1 :pending 1}))))

(deftest segment-normalization-reports-required-field-errors
  (let [segment (boundary/normalize-translation-segment-js #js {:source_text "hello" :target_lang "es"})]
    (is (= "hello" (aget segment "source_text")))
    (is (= "pending" (aget segment "status")))
    (is (= 2 (.-length (aget segment "errors"))))))

(deftest sft-row-and-manifest-shaping-are-domain-data
  (let [row (boundary/sft-row-js #js {:source_lang "English"
                                      :target_lang "es"
                                      :source_text "hello"
                                      :translated_text "hola"
                                      :corrected_text "hola!"})
        manifest (boundary/manifest-shape-js #js {:project "devel"
                                                  :languages #js [#js {:_id "es"
                                                                       :total 3
                                                                       :approved 2
                                                                       :rejected 0
                                                                       :pending 1
                                                                       :in_review 0}]
                                                  :correctionsByLanguage #js {:es 1}
                                                  :labelers #js [#js {:_id "dev@example.test"
                                                                      :segments_labeled 2}]})]
    (is (= "hola!" (aget row "target")))
    (is (re-find #"Translate the following text" (aget row "prompt")))
    (is (= 1 (aget (aget (aget manifest "languages") "es") "with_corrections")))
    (is (= 1000 (aget (aget (aget manifest "export_sizes") "sft_es") "bytes_estimate")))))

(deftest translation-job-plans-are-data-only
  (let [plan (boundary/translation-job-plan-js #js {:document_id "doc:1"
                                                    :document_text "hello"
                                                    :target_languages #js ["es" "de"]
                                                    :garden_id "garden:1"
                                                    :project "devel"})
        empty-plan (boundary/translation-job-plan-js #js {:document_id "doc:2" :document_text ""})
        status-plan (boundary/job-status-update-plan-js #js {:status "failed" :error "boom"})]
    (is (true? (aget plan "ok?")))
    (is (= 2 (.-length (aget plan "jobs"))))
    (is (false? (aget empty-plan "ok?")))
    (is (= "failed" (aget status-plan "status")))
    (is (true? (aget status-plan "completed?")))))

(deftest document-review-shaping-is-data-only
  (let [list-result (boundary/document-list-shape-js
                      #js {:documents #js [#js {:_id #js {:document_id "doc:1" :target_lang "es"}
                                                 :source_lang "en"
                                                 :total_segments 2
                                                 :approved 1
                                                 :pending 1
                                                 :rejected 0
                                                 :in_review 0}]
                           :titles #js {"doc:1" #js {:title "Doc" :visibility "public"}}})
        detail (boundary/document-translation-shape-js
                #js {:document #js {:id "doc:1" :title "Doc"}
                     :segments #js [#js {:_id "seg:1"
                                          :source_text "hello"
                                          :translated_text "hola"
                                          :source_lang "en"
                                          :target_lang "es"
                                          :document_id "doc:1"
                                          :segment_index 0
                                          :status "approved"}]
                     :labels #js [#js {:_id "label:1"
                                        :segment_id "seg:1"
                                        :labeler_email "dev@example.test"
                                        :overall "approve"}]})
        label-plan (boundary/document-review-label-plan-js #js {:segment_id "seg:1"
                                                               :overall "needs_edit"
                                                               :corrected_text "hola!"})]
    (is (= "partial_review" (aget (aget (aget list-result "documents") 0) "overall_status")))
    (is (= 1 (.-length (aget (aget (aget detail "segments") 0) "labels"))))
    (is (= "approved" (aget label-plan "next_status")))))

(deftest graph-memory-plan-is-data-only
  (let [plan (boundary/translation-graph-memory-plan-js #js {:segment_id "seg:1"
                                                            :source_text "hello world"
                                                            :translated_text "hola mundo"
                                                            :source_lang "en"
                                                            :target_lang "es"
                                                            :document_id "doc:1"
                                                            :domain "docs"})]
    (is (true? (aget plan "ok?")))
    (is (= "translation:en:es:seg:1" (aget (aget plan "node") "id")))
    (is (= "has_translation" (aget (aget plan "edge") "kind")))))

(defn -main []
  (let [result (run-tests 'openplanner.translations.core-test)]
    (when (pos? (+ (:fail result) (:error result)))
      (js/process.exit 1))))
