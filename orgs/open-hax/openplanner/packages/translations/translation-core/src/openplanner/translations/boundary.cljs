(ns openplanner.translations.boundary
  "JavaScript boundary for translation domain logic."
  (:require [openplanner.translations.core :as core]))

(defn- js-object?
  [value]
  (and (some? value) (= "object" (goog/typeOf value)) (not (array? value))))

(defn- jget
  [obj k]
  (when (js-object? obj) (aget obj k)))

(defn- segment-from-js
  [input]
  {:source-text (or (jget input "source_text") (jget input "sourceText"))
   :translated-text (or (jget input "translated_text") (jget input "translatedText"))
   :source-lang (or (jget input "source_lang") (jget input "sourceLang"))
   :target-lang (or (jget input "target_lang") (jget input "targetLang"))
   :document-id (or (jget input "document_id") (jget input "documentId"))
   :segment-index (or (jget input "segment_index") (jget input "segmentIndex"))
   :status (jget input "status")
   :mt-model (or (jget input "mt_model") (jget input "mtModel"))
   :confidence (jget input "confidence")
   :domain (jget input "domain")
   :content-type (or (jget input "content_type") (jget input "contentType"))
   :url-context (or (jget input "url_context") (jget input "urlContext"))
   :garden-id (or (jget input "garden_id") (jget input "gardenId"))
   :org-id (or (jget input "org_id") (jget input "orgId"))
   :project (jget input "project")})

(defn- normalized-segment->js
  [segment]
  #js {:source_text (:source-text segment)
       :translated_text (:translated-text segment)
       :source_lang (:source-lang segment)
       :target_lang (:target-lang segment)
       :document_id (:document-id segment)
       :segment_index (:segment-index segment)
       :status (core/status-wire (:status segment))
       :mt_model (:mt-model segment)
       :confidence (:confidence segment)
       :domain (:domain segment)
       :content_type (:content-type segment)
       :url_context (:url-context segment)
       :garden_id (:garden-id segment)
       :org_id (:org-id segment)
       :project (:project segment)
       :errors (clj->js (core/segment-errors segment))})

(defn next-segment-status-js
  [input]
  (core/status-wire
    (core/next-segment-status {:current-status (jget input "currentStatus")
                               :overall (jget input "overall")
                               :corrected-text (or (jget input "corrected_text")
                                                   (jget input "correctedText"))})))

(defn document-overall-status-js
  [input]
  (core/status-wire
    (core/document-overall-status {:total (or (jget input "total") 0)
                                   :approved (or (jget input "approved") 0)
                                   :rejected (or (jget input "rejected") 0)
                                   :pending (or (jget input "pending") 0)})))

(defn summarize-segments-js
  [segments]
  (let [rows (if (array? segments) (array-seq segments) [])
        normalized (mapv (fn [row] {:status (jget row "status")}) rows)
        summary (core/summarize-segments normalized)]
    #js {:total_segments (:total-segments summary)
         :approved (:approved summary)
         :pending (:pending summary)
         :rejected (:rejected summary)
         :in_review (:in-review summary)
         :overall_status (core/status-wire (:overall-status summary))}))

(defn normalize-translation-segment-js
  [input]
  (normalized-segment->js (core/normalize-segment (segment-from-js input))))

(defn translation-graph-memory-plan-js
  [input]
  (let [plan (core/graph-memory-plan {:segment-id (str (or (jget input "segment_id") (jget input "segmentId") (jget input "_id") ""))
                                      :source-text (jget input "source_text")
                                      :translated-text (jget input "translated_text")
                                      :corrected-text (or (jget input "corrected_text") (jget input "correctedText"))
                                      :source-lang (jget input "source_lang")
                                      :target-lang (jget input "target_lang")
                                      :document-id (jget input "document_id")
                                      :domain (jget input "domain")
                                      :content-type (jget input "content_type")})]
    (clj->js plan)))

(defn sft-row-js
  [input]
  (clj->js (core/sft-row {:source-lang (or (jget input "source_lang") (jget input "sourceLang") "English")
                           :target-lang (or (jget input "target_lang") (jget input "targetLang"))
                           :source-text (or (jget input "source_text") (jget input "sourceText"))
                           :translated-text (or (jget input "translated_text") (jget input "translatedText"))
                           :corrected-text (or (jget input "corrected_text") (jget input "correctedText"))})))

(defn- language-row-from-js
  [row]
  {:target-lang (or (jget row "target_lang") (jget row "targetLang") (jget row "_id"))
   :total (jget row "total")
   :approved (jget row "approved")
   :rejected (jget row "rejected")
   :pending (jget row "pending")
   :in-review (or (jget row "in_review") (jget row "inReview"))})

(defn- corrections-from-js
  [value]
  (if (js-object? value)
    (into {}
          (map (fn [entry] [(aget entry 0) (aget entry 1)]))
          (array-seq (js/Object.entries value)))
    {}))

(defn- labeler-from-js
  [row]
  {:email (or (jget row "email") (jget row "_id"))
   :segments-labeled (or (jget row "segments_labeled") (jget row "segmentsLabeled"))})

(defn- js-array->strings
  [value]
  (if (array? value) (mapv str (array-seq value)) []))

(defn translation-job-plan-js
  [input]
  (clj->js (core/translation-job-plan {:document-id (or (jget input "document_id") (jget input "documentId"))
                                       :document-text (or (jget input "document_text") (jget input "documentText"))
                                       :target-languages (js-array->strings (or (jget input "target_languages")
                                                                                (jget input "targetLanguages")))
                                       :garden-id (or (jget input "garden_id") (jget input "gardenId"))
                                       :project (jget input "project")
                                       :source-lang (or (jget input "source_lang") (jget input "sourceLang"))})))

(defn job-status-update-plan-js
  [input]
  (clj->js (core/job-status-update-plan {:status (jget input "status")
                                         :error (jget input "error")})))

(defn- string-id
  [value]
  (when (some? value) (.toString value)))

(defn- maybe-iso
  [value]
  (cond
    (nil? value) nil
    (fn? (.-toISOString value)) (.toISOString value)
    :else (str value)))

(defn- doc-row-from-js
  [row titles]
  (let [id-obj (jget row "_id")
        document-id (jget id-obj "document_id")
        meta (jget titles document-id)]
    {:document-id document-id
     :target-lang (jget id-obj "target_lang")
     :source-lang (jget row "source_lang")
     :garden-id (jget row "garden_id")
     :project (jget row "project")
     :total (jget row "total_segments")
     :approved (jget row "approved")
     :pending (jget row "pending")
     :rejected (jget row "rejected")
     :in-review (jget row "in_review")
     :title (jget meta "title")
     :visibility (jget meta "visibility")}))

(defn document-list-shape-js
  [input]
  (let [docs (if (array? (jget input "documents")) (array-seq (jget input "documents")) [])
        titles (or (jget input "titles") #js {})
        shaped (mapv #(core/document-list-row (doc-row-from-js % titles)) docs)]
    #js {:documents (clj->js shaped)
         :total (count shaped)}))

(defn- label-from-js
  [row]
  {:id (string-id (jget row "_id"))
   :segment-id (jget row "segment_id")
   :labeler-id (jget row "labeler_id")
   :labeler-email (jget row "labeler_email")
   :adequacy (jget row "adequacy")
   :fluency (jget row "fluency")
   :terminology (jget row "terminology")
   :risk (jget row "risk")
   :overall (jget row "overall")
   :corrected-text (jget row "corrected_text")
   :editor-notes (jget row "editor_notes")
   :ts (maybe-iso (jget row "created_at"))})

(defn- segment-from-row-js
  [row labels]
  (let [id (string-id (jget row "_id"))]
    {:id id
     :source-text (jget row "source_text")
     :translated-text (jget row "translated_text")
     :source-lang (jget row "source_lang")
     :target-lang (jget row "target_lang")
     :document-id (jget row "document_id")
     :segment-index (jget row "segment_index")
     :status (jget row "status")
     :confidence (jget row "confidence")
     :mt-model (jget row "mt_model")
     :garden-id (jget row "garden_id")
     :project (jget row "project")
     :labels (mapv label-from-js (or (get labels id) []))
     :ts (maybe-iso (jget row "created_at"))}))

(defn document-translation-shape-js
  [input]
  (let [segments (if (array? (jget input "segments")) (array-seq (jget input "segments")) [])
        labels (if (array? (jget input "labels")) (array-seq (jget input "labels")) [])
        labels-by-segment (group-by #(jget % "segment_id") labels)
        shaped-segments (mapv #(segment-from-row-js % labels-by-segment) segments)]
    (clj->js (core/document-translation-shape {:document (js->clj (jget input "document") :keywordize-keys false)
                                               :segments shaped-segments}))))

(defn document-review-label-plan-js
  [input]
  (clj->js (core/document-review-label-plan {:segment-id (jget input "segment_id")
                                             :labeler-id (jget input "labeler_id")
                                             :labeler-email (jget input "labeler_email")
                                             :overall (jget input "overall")
                                             :corrected-text (jget input "corrected_text")
                                             :editor-notes (jget input "editor_notes")})))

(defn manifest-shape-js
  [input]
  (let [languages (if (array? (jget input "languages"))
                    (mapv language-row-from-js (array-seq (jget input "languages")))
                    [])
        labelers (if (array? (jget input "labelers"))
                   (mapv labeler-from-js (array-seq (jget input "labelers")))
                   [])]
    (clj->js (core/manifest-shape {:project (jget input "project")
                                   :languages languages
                                   :corrections-by-language (corrections-from-js (jget input "correctionsByLanguage"))
                                   :labelers labelers}))))
