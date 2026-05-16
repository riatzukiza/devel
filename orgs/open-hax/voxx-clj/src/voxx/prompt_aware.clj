(ns voxx.prompt-aware
  "Prompt-aware performance tag parsing and rendering plan generation.
   Parses bracketed tags like [excited], [whisper], <break time=\"500ms\" />
   and converts them into segments with timing/style/effect metadata."
  (:require [clojure.string :as str]
            [clojure.set :as set]))

;; ---------------------------------------------------------------------------
;; Tag classification
;; ---------------------------------------------------------------------------

(def ^:private pause-tags #{"pause" "break" "silence"})

(def ^:private direction-tags
  #{"angry" "calm" "cheerful" "dramatic" "excited" "laugh" "laughing"
    "sad" "serious" "shout" "shouting" "sing" "singing" "soft"
    "stretch" "stretched" "suture" "sutured" "autotune" "glitch"
    "whisper" "whispering"})

(def ^:private all-known-tags (set/union pause-tags direction-tags #{"laugh" "laughing"}))

;; ---------------------------------------------------------------------------
;; Regex patterns
;; ---------------------------------------------------------------------------

(def ^:private break-tag-pattern
  #"<break\b([^>]*)/?>")

(def ^:private bracket-tag-pattern
  #"\[([a-z][a-z0-9_-]*)(?:\s+[^\]]*)?\]")

(def ^:private full-tag-pattern
  #"(?:<break\b([^>]*)/?>)|\[([a-z][a-z0-9_-]*)(?:\s+[^\]]*)?\]")

(def ^:private time-pattern
  #"time\s*=\s*['\"]?([0-9.]+)\s*(ms|s)?")

;; ---------------------------------------------------------------------------
;; Parsing helpers
;; ---------------------------------------------------------------------------

(defn- normalize-tag
  "Normalize a tag string to lowercase with hyphens."
  [tag]
  (-> (str/trim (or tag ""))
      str/lower-case
      (str/replace #"[_]" "-")))

(defn- parse-break-pause-ms
  "Extract pause duration from break tag attributes."
  [attrs]
  (if-let [match (re-find time-pattern (or attrs ""))]
    (let [value (try (Double/parseDouble (nth match 1)) (catch Exception _ 450.0))
          unit  (str/lower-case (or (nth match 2) "ms"))
          ms    (if (= unit "s") (* value 1000.0) value)]
      (int (max 80 (min 2500 (Math/round ms)))))
    450))

(defn- clean-text
  "Clean prompt-aware text by normalizing whitespace."
  [text]
  (-> (str/trim (or text ""))
      (str/replace #"[ \t]+" " ")
      (str/replace #"\s+([,;:!?])" "$1")
      (str/replace #"\s+(\.(?!\.))" "$1")
      str/trim))

;; ---------------------------------------------------------------------------
;; Segment type
;; ---------------------------------------------------------------------------

(defrecord PromptAwareSegment [kind text style pause-ms])

(defn- make-text-segment
  [text style]
  (let [cleaned (clean-text text)]
    (when (and (not (str/blank? cleaned))
               (not (and (#{"." "," ";" ":" "!" "?"} cleaned)
                         false))) ;; simplified: always include if not blank
      (->PromptAwareSegment "text" cleaned style 0))))

(defn- make-pause-segment
  [pause-ms]
  (->PromptAwareSegment "pause" "" "" pause-ms))

(defn- make-effect-segment
  [style duration-ms]
  (->PromptAwareSegment "effect" "" style duration-ms))

;; ---------------------------------------------------------------------------
;; Tag pattern matching
;; ---------------------------------------------------------------------------

(defn- find-all-tags
  "Find all performance tags in text, returning a sequence of match maps."
  [text]
  (let [matcher (re-matcher full-tag-pattern text)]
    (loop [matches []]
      (if (.find matcher)
        (let [match-str (.group matcher 0)
              group1 (.group matcher 1)  ; break attrs
              group2 (.group matcher 2)] ; bracket tag
          (recur (conj matches
                       {:start    (.start matcher)
                        :end      (.end matcher)
                        :text     match-str
                        :break-attrs (when group1 (str/trim group1))
                        :bracket-tag (when group2 (str/trim group2))})))
        matches))))

(defn- consume-text-chunk
  "Add a text chunk to segments if non-empty."
  [segments text current-style]
  (if-let [seg (make-text-segment text current-style)]
    (conj segments seg)
    segments))

;; ---------------------------------------------------------------------------
;; Parse prompt-aware segments
;; ---------------------------------------------------------------------------

(defn parse-prompt-aware-segments
  "Consume performance tags into Voxx-owned render plan segments.
   Returns [segments consumed-any?]"
  [text]
  (let [tags (find-all-tags (or text ""))]
    (if (empty? tags)
      [[] false]
      (loop [remaining tags
             segments []
             cursor 0
             current-style ""
             consumed false]
        (if (empty? remaining)
          ;; Add trailing text
          (let [trailing (subs text cursor)
                segments (consume-text-chunk segments trailing current-style)]
            [segments consumed])
          (let [tag (first remaining)
                pre-text (subs text cursor (:start tag))
                segments (consume-text-chunk segments pre-text current-style)]
            (cond
              ;; Break tag
              (:break-attrs tag)
              (recur (rest remaining)
                     (conj segments (make-pause-segment (parse-break-pause-ms (:break-attrs tag))))
                     (:end tag)
                     current-style
                     true)

              ;; Bracket tag
              (:bracket-tag tag)
              (let [normalized (normalize-tag (:bracket-tag tag))]
                (cond
                  (pause-tags normalized)
                  (recur (rest remaining)
                         (conj segments (make-pause-segment 350))
                         (:end tag)
                         current-style
                         true)

                  (#{"laugh" "laughing"} normalized)
                  (recur (rest remaining)
                         (conj segments (make-effect-segment "laugh" 180))
                         (:end tag)
                         current-style
                         true)

                  (direction-tags normalized)
                  (recur (rest remaining)
                         segments
                         (:end tag)
                         normalized
                         true)

                  :else ;; Unknown tag: preserve literally
                  (recur (rest remaining)
                         (consume-text-chunk segments (:text tag) current-style)
                         (:end tag)
                         current-style
                         consumed)))

              :else
              (recur (rest remaining) segments (:end tag) current-style consumed))))))))

;; ---------------------------------------------------------------------------
;; Flatten segments
;; ---------------------------------------------------------------------------

(defn- flatten-segments
  "Flatten segments into a single spoken text string."
  [segments]
  (let [parts (for [seg segments
                    :when (and (= (:kind seg) "text") (not (str/blank? (:text seg))))]
                (:text seg))]
    (clean-text (str/join " " parts))))

;; ---------------------------------------------------------------------------
;; Prompt-aware render plan
;; ---------------------------------------------------------------------------

(defn prompt-aware-render-plan
  "Return the clean read-aloud prompt plus Voxx-owned inflection points.
   This is the contract boundary for prompt-aware markup."
  [text]
  (let [[segments consumed] (parse-prompt-aware-segments text)
        ;; Build read-aloud text and plan
        result (loop [segs segments
                      read-parts []
                      plan-segments []
                      inflection-points []
                      cursor 0
                      seg-index 0]
                 (if (empty? segs)
                   {:read-parts read-parts
                    :plan-segments plan-segments
                    :inflection-points inflection-points
                    :cursor cursor}
                   (let [seg (first segs)]
                     (case (:kind seg)
                       "text"
                       (if (str/blank? (:text seg))
                         (recur (rest segs) read-parts plan-segments inflection-points cursor (inc seg-index))
                         (let [prefix   (if (seq read-parts) " " "")
                               new-read (str (apply str read-parts) prefix (:text seg))
                               read-start cursor
                               read-end   (+ cursor (count prefix) (count (:text seg)))]
                           (recur (rest segs)
                                  (conj read-parts (str prefix (:text seg)))
                                  (conj plan-segments {:kind "text"
                                                       :text (:text seg)
                                                       :style (:style seg)
                                                       :read_start read-start
                                                       :read_end read-end})
                                  (if (not (str/blank? (:style seg)))
                                    (conj inflection-points {:kind "style"
                                                             :style (:style seg)
                                                             :segment_index seg-index
                                                             :read_start read-start
                                                             :read_end read-end})
                                    inflection-points)
                                  read-end
                                  (inc seg-index))))

                       "pause"
                       (recur (rest segs)
                              read-parts
                              (conj plan-segments {:kind "pause"
                                                   :pause_ms (:pause-ms seg)
                                                   :read_position cursor})
                              (conj inflection-points {:kind "pause"
                                                       :pause_ms (:pause-ms seg)
                                                       :segment_index seg-index
                                                       :read_position cursor})
                              cursor
                              (inc seg-index))

                       "effect"
                       (recur (rest segs)
                              read-parts
                              (conj plan-segments {:kind "effect"
                                                   :style (:style seg)
                                                   :duration_ms (:pause-ms seg)
                                                   :read_position cursor})
                              (conj inflection-points {:kind "effect"
                                                       :style (:style seg)
                                                       :duration_ms (:pause-ms seg)
                                                       :segment_index seg-index
                                                       :read_position cursor})
                              cursor
                              (inc seg-index))

                       ;; default
                       (recur (rest segs) read-parts plan-segments inflection-points cursor (inc seg-index))))))
        updated-prompt (clean-text (apply str (:read-parts result)))]
    {:updated_prompt   updated-prompt
     :read_aloud_text  updated-prompt
     :consumed_tags    consumed
     :segments         (:plan-segments result)
     :inflection_points (:inflection-points result)}))

;; ---------------------------------------------------------------------------
;; Sanitize for non-prompt backends
;; ---------------------------------------------------------------------------

(defn sanitize-for-non-prompt-backend
  "Compatibility wrapper: consume tags and return non-marked spoken text."
  [text]
  (let [[segments consumed] (parse-prompt-aware-segments text)]
    (if consumed
      (flatten-segments segments)
      ;; No known tags consumed; do basic cleanup
      (-> (str/replace text break-tag-pattern " ... ")
          (str/replace bracket-tag-pattern
                       (fn [[_ tag]]
                         (let [normalized (normalize-tag tag)]
                           (cond
                             (pause-tags normalized) " ... "
                             (direction-tags normalized) " "
                             :else (str "[" tag "]")))))
          (str/replace #"[ \t]+" " ")
          (str/replace #"\s+([,.;:!?])" "$1")
          (str/replace #"([.!?])\s+\.\.\.\s+" "$1 ... ")
          str/trim))))

;; ---------------------------------------------------------------------------
;; Performance directives (for per-segment ffmpeg filter chains)
;; ---------------------------------------------------------------------------

(def ^:private performance-directives
  {"excited"   {:pitch-ratio 1.122462 :tempo-ratio 1.08 :contour "bright_major_second"}
   "cheerful"  {:pitch-ratio 1.090508 :tempo-ratio 1.06 :contour "smiling_major_second"}
   "dramatic"  {:pitch-ratio 0.943874 :tempo-ratio 0.90 :contour "low_minor_third"}
   "serious"   {:pitch-ratio 0.971532 :tempo-ratio 0.94 :contour "low_half_step"}
   "sing"      {:pitch-ratio 1.334840 :tempo-ratio 0.96 :contour "perfect_fourth_lift"}
   "singing"   {:pitch-ratio 1.334840 :tempo-ratio 0.96 :contour "perfect_fourth_lift"}
   "autotune"  {:pitch-ratio 1.259921 :tempo-ratio 0.98 :contour "major_third_lift"}
   "suture"    {:pitch-ratio 1.189207 :tempo-ratio 0.95 :contour "minor_third_suture"}
   "sutured"   {:pitch-ratio 1.189207 :tempo-ratio 0.95 :contour "minor_third_suture"}
   "stretch"   {:pitch-ratio 0.890899 :tempo-ratio 0.82 :contour "stretched_whole_step_down"}
   "stretched" {:pitch-ratio 0.890899 :tempo-ratio 0.82 :contour "stretched_whole_step_down"}
   "glitch"    {:pitch-ratio 1.414214 :tempo-ratio 1.12 :contour "tritone_glitch"}})

(defn performance-directive
  "Get the performance directive for a given style."
  [style]
  (get performance-directives (normalize-tag style)))

(defn prompt-aware-segment-filter-chain
  "Build the ffmpeg filter chain for a prompt-aware segment style."
  [style]
  (let [normalized (normalize-tag style)
        perf (performance-directive normalized)
        filters (transient [])]
    ;; Base performance filters
    (when perf
      (conj! filters (format "rubberband=pitch=%.6f" (double (:pitch-ratio perf))))
      (conj! filters (format "atempo=%.6f" (double (:tempo-ratio perf))))
      (when (#{"sing" "singing" "autotune" "suture" "sutured"} normalized)
        (conj! filters "vibrato=f=5.600:d=0.055"))
      (when (= normalized "glitch")
        (conj! filters "aecho=0.55:0.32:42:0.24")
        (conj! filters "acrusher=level_in=1:level_out=0.82:bits=11:mode=log")))

    ;; Style-specific EQ and dynamics
    (cond
      (#{"excited" "cheerful"} normalized)
      (do (conj! filters "equalizer=f=3200:t=q:w=1.0:g=2.0")
          (conj! filters "equalizer=f=6200:t=q:w=1.2:g=1.0")
          (conj! filters "volume=1.8dB"))

      (#{"dramatic" "serious"} normalized)
      (do (conj! filters "equalizer=f=180:t=q:w=1.0:g=1.2")
          (conj! filters "equalizer=f=1800:t=q:w=1.1:g=0.8")
          (conj! filters "volume=1.1dB"))

      (#{"whisper" "whispering"} normalized)
      (do (conj! filters "atempo=0.96")
          (conj! filters "highpass=f=160")
          (conj! filters "lowpass=f=6200")
          (conj! filters "equalizer=f=3600:t=q:w=1.4:g=2.4")
          (conj! filters "volume=-4.5dB"))

      (#{"shout" "shouting"} normalized)
      (do (conj! filters "atempo=1.03")
          (conj! filters "equalizer=f=2600:t=q:w=1.0:g=3.0")
          (conj! filters "acompressor=threshold=0.16:ratio=3.0:attack=4:release=80:makeup=1.5")
          (conj! filters "volume=2.5dB"))

      (#{"calm" "soft" "sad"} normalized)
      (do (conj! filters "atempo=0.96")
          (conj! filters "equalizer=f=3000:t=q:w=1.2:g=-0.8")
          (conj! filters "volume=-1.0dB"))

      (= normalized "angry")
      (do (conj! filters "atempo=1.02")
          (conj! filters "equalizer=f=900:t=q:w=1.0:g=1.4")
          (conj! filters "equalizer=f=3000:t=q:w=1.0:g=2.4")
          (conj! filters "acompressor=threshold=0.15:ratio=3.5:attack=3:release=70:makeup=1.8")
          (conj! filters "volume=2.0dB"))

      ;; Performance styles without explicit EQ above
      (and perf (#{"sing" "singing" "autotune" "suture" "sutured"} normalized))
      (do (conj! filters "aecho=0.58:0.34:64:0.18")
          (conj! filters "equalizer=f=2400:t=q:w=1.0:g=2.6")
          (conj! filters "acompressor=threshold=0.18:ratio=2.8:attack=6:release=90:makeup=1.6")
          (conj! filters "volume=1.6dB"))

      (and perf (#{"stretch" "stretched"} normalized))
      (do (conj! filters "aecho=0.48:0.28:92:0.18")
          (conj! filters "lowpass=f=9200")
          (conj! filters "volume=0.6dB")))

    (str/join "," (persistent! filters))))
