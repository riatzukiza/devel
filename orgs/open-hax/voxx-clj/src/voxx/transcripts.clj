(ns voxx.transcripts
  "Transcript storage using JSON files."
  (:require [clojure.java.io :as io]
            [clojure.string :as str]
            [cheshire.core :as json])
  (:import [java.time Instant]
           [java.util UUID]))

(defn- generate-id
  "Generate a transcript ID."
  []
  (str "tr_" (str/replace (str (UUID/randomUUID)) "-" "")))

(defn create-transcript
  "Create a new transcript record and persist it to disk."
  [transcript-dir & {:keys [source-name mime-type task model-id result]}]
  (let [id (generate-id)
        now (str (Instant/now))
        record {:transcription_id id
                :created_at       now
                :source_name      (str source-name)
                :mime_type         (str mime-type)
                :task              (str task)
                :model_id          (str model-id)
                :result            (cond-> {:ok       (:ok result)
                                            :engine   (:engine result)
                                            :text     (:text result)
                                            :error    (:error result)
                                            :language (:language result)
                                            :task     (:task result)
                                            :duration (:duration result)}
                                     (:segments result)
                                     (assoc :segments
                                            (mapv (fn [seg]
                                                    {:id    (:id seg)
                                                     :start (:start seg)
                                                     :end   (:end seg)
                                                     :text  (:text seg)})
                                                  (:segments result))))}
        file (io/file transcript-dir (str id ".json"))]
    (io/make-parents file)
    (spit file (json/generate-string record {:pretty true}))
    record))

(defn get-transcript
  "Retrieve a transcript record by ID."
  [transcript-dir transcription-id]
  (let [file (io/file transcript-dir (str transcription-id ".json"))]
    (when (.exists file)
      (json/parse-string (slurp file) true))))
