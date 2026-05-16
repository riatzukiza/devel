(ns voxx.types
  "Core data types for the Voxx voice gateway.")

;; ---------------------------------------------------------------------------
;; Transcript types
;; ---------------------------------------------------------------------------

(defrecord TranscriptSegment [id start end text])

(defn ->transcript-segment
  "Create a transcript segment map."
  [{:keys [id start end text]}]
  {:id    (or id 0)
   :start (double (or start 0.0))
   :end   (double (or end 0.0))
   :text  (str (or text ""))})

(defrecord TranscriptResult [ok engine text error language task duration segments])

(defn ->transcript-result
  "Create a transcript result map."
  [{:keys [ok engine text error language task duration segments]}]
  {:ok        (boolean ok)
   :engine    (str (or engine "none"))
   :text      (str (or text ""))
   :error     (when error (str error))
   :language  (when language (str language))
   :task      (str (or task "transcribe"))
   :duration  (when duration (double duration))
   :segments  (vec (or segments []))})

(defn transcript-result-ok?
  "Check if a transcript result indicates success."
  [result]
  (boolean (:ok result)))

(defn transcript-result->dict
  "Convert a transcript result to a plain map for JSON serialization."
  [result]
  {:ok       (:ok result)
   :engine   (:engine result)
   :text     (:text result)
   :error    (:error result)
   :language (:language result)
   :task     (:task result)
   :duration (:duration result)
   :segments (mapv (fn [seg]
                     {:id    (:id seg)
                      :start (:start seg)
                      :end   (:end seg)
                      :text  (:text seg)})
                   (:segments result))})

;; ---------------------------------------------------------------------------
;; TTS queue types
;; ---------------------------------------------------------------------------

(defrecord TtsQueueFull [message active waiting max-concurrent max-pending])

(defn ->tts-queue-full
  "Create a TTS queue full error."
  [{:keys [message active waiting max-concurrent max-pending]}]
  (ex-info (or message "TTS queue is full")
           {:type           :tts-queue-full
            :active         active
            :waiting        waiting
            :max-concurrent max-concurrent
            :max-pending    max-pending}))
