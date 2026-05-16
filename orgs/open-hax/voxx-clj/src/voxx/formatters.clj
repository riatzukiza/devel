(ns voxx.formatters
  "Transcription response formatters (SRT, VTT, OpenAI-compatible)."
  (:require [clojure.string :as str]
            [cheshire.core :as json]))

;; ---------------------------------------------------------------------------
;; Timestamp formatting
;; ---------------------------------------------------------------------------

(defn- format-timestamp
  "Format seconds into SRT or VTT timestamp."
  [seconds & {:keys [srt] :or {srt true}}]
  (let [whole-ms (max 0 (Math/round (* (double seconds) 1000.0)))
        ms       (mod whole-ms 1000)
        total-s  (quot whole-ms 1000)
        sec      (mod total-s 60)
        total-m  (quot total-s 60)
        minute   (mod total-m 60)
        hour     (quot total-m 60)
        sep      (if srt "," ".")]
    (format "%02d:%02d:%02d%s%03d" hour minute sec sep ms)))

;; ---------------------------------------------------------------------------
;; Segment helpers
;; ---------------------------------------------------------------------------

(defn- fallback-segments
  "Return segments from result, or create a single segment if empty."
  [result]
  (if (seq (:segments result))
    (:segments result)
    (if (str/blank? (:text result))
      []
      [{:id 0 :start 0.0 :end (max (or (:duration result) 0.0) 0.0) :text (str/trim (:text result))}])))

;; ---------------------------------------------------------------------------
;; SRT
;; ---------------------------------------------------------------------------

(defn to-srt
  "Format a transcript result as SRT."
  [result]
  (let [segs (fallback-segments result)
        lines (mapcat (fn [idx seg]
                        [(str (inc idx))
                         (str (format-timestamp (:start seg) :srt true)
                              " --> "
                              (format-timestamp (:end seg) :srt true))
                         (:text seg)
                         ""])
                      (range)
                      segs)]
    (str (str/join "\n" lines) (when (seq lines) "\n"))))

;; ---------------------------------------------------------------------------
;; VTT
;; ---------------------------------------------------------------------------

(defn to-vtt
  "Format a transcript result as WebVTT."
  [result]
  (let [segs (fallback-segments result)
        header "WEBVTT\n"
        body (mapcat (fn [seg]
                       [(str (format-timestamp (:start seg) :srt false)
                            " --> "
                            (format-timestamp (:end seg) :srt false))
                        (:text seg)
                        ""])
                     segs)]
    (str header (str/join "\n" body) (when (seq body) "\n"))))

;; ---------------------------------------------------------------------------
;; JSON response builders
;; ---------------------------------------------------------------------------

(defn openai-transcription-payload
  "Build an OpenAI-compatible transcription response."
  [result & {:keys [response-format model]}]
  (let [normalized (str/lower-case (str/trim (or response-format "json")))]
    (case normalized
      "text"
      {:status 200 :body (:text result) :content-type "text/plain"}

      "srt"
      {:status 200 :body (to-srt result) :content-type "text/plain"}

      "vtt"
      {:status 200 :body (to-vtt result) :content-type "text/vtt"}

      "verbose_json"
      {:status 200
       :body (json/generate-string
              {:task     (:task result)
               :language (or (:language result) "")
               :duration (or (:duration result) 0.0)
               :text     (:text result)
               :segments (mapv (fn [seg]
                                 {:id    (:id seg)
                                  :start (:start seg)
                                  :end   (:end seg)
                                  :text  (:text seg)})
                               (fallback-segments result))
               :words    []
               :model    model})
       :content-type "application/json"}

      ;; default: json
      {:status 200
       :body (json/generate-string {:text (:text result)})
       :content-type "application/json"})))

(defn voice-transcription-payload
  "Build a Voxx-style transcription response."
  [result & {:keys [transcription-id model-id]}]
  {:transcription_id transcription-id
   :text             (:text result)
   :language_code    (or (:language result) "")
   :model_id         model-id
   :duration_seconds (or (:duration result) 0.0)
   :segments         (mapv (fn [seg]
                             {:id    (:id seg)
                              :start (:start seg)
                              :end   (:end seg)
                              :text  (:text seg)})
                           (fallback-segments result))
   :words             []})
