(ns opencode-unified.buffers
  (:require [opencode-unified.state :as state]
            [opencode-unified.workspace :as workspace]
            [opencode-unified.command-palette :as command-palette]
            [clojure.string :as str]
            [reagent.core :as r]))

;; Buffer ID counter
(defonce buffer-id-counter (r/atom 0))

(defn generate-buffer-id []
  (swap! buffer-id-counter inc))

(declare save-current-buffer
         save-current-buffer-as
         enter-normal-mode
         exit-visual-mode
         update-statusbar)

(defn- error-message [error]
  (cond
    (string? error) error
    (and error (some? (.-message error))) (.-message error)
    :else "Unknown error"))

(defn- language-for-path [file-path]
  (let [ext (some-> file-path
                    (str/split #"\\.")
                    last
                    str/lower-case)]
    (case ext
      "clj" "clojure"
      "cljs" "clojure"
      "cljc" "clojure"
      "edn" "clojure"
      "ts" "typescript"
      "tsx" "typescript"
      "js" "javascript"
      "jsx" "javascript"
      "json" "json"
      "md" "markdown"
      "txt" "text"
      "text")))

(defn- update-status! [message]
  (let [mode (or (state/get-evil-mode) :normal)]
    (state/update-statusbar! (str/upper-case (name mode)) "" message)))

(defn update-statusbar []
  (let [mode (or (state/get-evil-mode) :normal)]
    (state/update-statusbar!
     (str/upper-case (name mode))
     ""
     (str "Evil mode - " (name mode)))))

(defn- sorted-buffer-ids []
  (->> (:buffers @state/app-state)
       keys
       sort
       vec))

(defn- find-open-buffer-id [file-path]
  (some (fn [[buffer-id buffer]]
          (when (= (:path buffer) file-path)
            buffer-id))
        (:buffers @state/app-state)))

(defn- activate-buffer! [buffer-id]
  (state/set-current-buffer! buffer-id)
  buffer-id)

;; Buffer management
(defn close-buffer [buffer-id]
  (let [buffer (get-in @state/app-state [:buffers buffer-id])]
    (when (and buffer (:modified? buffer))
      (when (js/confirm (str "Save changes to " (:name buffer) "?"))
        (activate-buffer! buffer-id)
        (save-current-buffer)))
    (state/remove-buffer! buffer-id)))

(defn kill-current-buffer []
  (when-let [buffer-id (:current-buffer @state/app-state)]
    (close-buffer buffer-id)))

;; File operations
(defn open-file [file-path]
  (let [target-path (str/trim (or file-path ""))]
    (if (str/blank? target-path)
      (do
        (update-status! "Open failed: file path is required")
        (js/Promise.reject (js/Error. "file path is required")))
      (if-let [buffer-id (find-open-buffer-id target-path)]
        (do
          (activate-buffer! buffer-id)
          (update-status! (str "Focused " target-path))
          (js/Promise.resolve {:success true
                               :buffer-id buffer-id
                               :path target-path
                               :cached true}))
        (-> (workspace/read-file target-path)
            (.then (fn [result]
                     (let [buffer-id (generate-buffer-id)
                           file-name (last (str/split target-path #"/"))
                           content (or (:content result) "")
                           buffer (state/create-buffer buffer-id
                                                       content
                                                       :name file-name
                                                       :path target-path
                                                       :language (language-for-path target-path)
                                                       :modified? false)]
                       (state/add-buffer! buffer)
                       (activate-buffer! buffer-id)
                       (update-status! (str "Opened " target-path))
                       {:success true
                        :buffer-id buffer-id
                        :path target-path})))
            (.catch (fn [error]
                      (update-status! (str "Open failed: " (error-message error)))
                      (js/Promise.reject error))))))))

(defn create-buffer
  "Create and activate a new buffer with optional metadata/options."
  [file-path content & [metadata & options]]
  (let [buffer-id (generate-buffer-id)
        file-name (last (str/split (or file-path (str "buffer-" buffer-id)) #"/"))
        metadata-map (if (map? metadata) metadata {})
        option-map (if (seq options) (apply hash-map options) {})
        buffer (-> (state/create-buffer buffer-id
                                        (or content "")
                                        :name (or file-name (str "buffer-" buffer-id))
                                        :path file-path
                                        :language (language-for-path file-path)
                                        :modified? false)
                   (assoc :metadata metadata-map)
                   (merge option-map))]
    (state/add-buffer! buffer)
    (activate-buffer! buffer-id)
    (update-status! (str "Opened " (or file-path (:name buffer))))
    buffer))

(defn save-current-buffer []
  (if-let [buffer (state/get-current-buffer)]
    (let [target-path (:path buffer)]
      (if (str/blank? (or target-path ""))
        (save-current-buffer-as)
        (-> (workspace/write-file target-path (:content buffer))
            (.then (fn [_result]
                     (state/update-current-buffer!
                      (fn [b]
                        (-> b
                            (assoc :modified? false)
                            (assoc :saved? true)
                            (assoc :original-content (:content b))
                            (assoc-in [:metadata :last-modified] (js/Date.)))))
                     (update-status! (str "Saved " target-path))
                     {:success true :path target-path}))
            (.catch (fn [error]
                      (update-status! (str "Save failed: " (error-message error)))
                      (js/Promise.reject error))))))
    (do
      (update-status! "Save skipped: no active buffer")
      (js/Promise.resolve {:success false :message "No active buffer"}))))

(defn save-current-buffer-as []
  (if-let [buffer (state/get-current-buffer)]
    (let [default-path (or (:path buffer) (:name buffer) "README.md")
          prompt-value (js/prompt "Save file as:" default-path)
          target-path (str/trim (or prompt-value ""))]
      (if (str/blank? target-path)
        (do
          (update-status! "Save as cancelled")
          (js/Promise.resolve {:success false :message "Cancelled"}))
        (-> (workspace/write-file target-path (:content buffer))
            (.then (fn [_result]
                     (state/update-current-buffer!
                      (fn [b]
                        (-> b
                            (assoc :path target-path)
                            (assoc :name (last (str/split target-path #"/")))
                            (assoc :modified? false)
                            (assoc :saved? true)
                            (assoc :original-content (:content b))
                            (assoc-in [:metadata :last-modified] (js/Date.)))))
                     (update-status! (str "Saved " target-path))
                     {:success true :path target-path}))
            (.catch (fn [error]
                      (update-status! (str "Save as failed: " (error-message error)))
                      (js/Promise.reject error))))))
    (do
      (update-status! "Save as skipped: no active buffer")
      (js/Promise.resolve {:success false :message "No active buffer"}))))

;; Buffer operations
(defn switch-buffer []
  (let [buffer-ids (sorted-buffer-ids)]
    (if (empty? buffer-ids)
      (update-status! "Switch buffer: no open buffers")
      (let [options (->> buffer-ids
                         (map (fn [buffer-id]
                                (let [buffer (get-in @state/app-state [:buffers buffer-id])]
                                  (str buffer-id " - " (:name buffer)))))
                         (str/join "\n"))
            selection (js/prompt (str "Switch buffer (enter id):\n" options)
                                 (str (first buffer-ids)))
             target-id (js/parseInt (or selection "") 10)]
        (if (js/isNaN target-id)
          (update-status! "Switch buffer cancelled")
          (if (get-in @state/app-state [:buffers target-id])
            (do
              (activate-buffer! target-id)
              (update-status! (str "Switched to buffer " target-id)))
            (update-status! (str "Switch buffer failed: unknown id " selection))))))))

(defn next-buffer []
  (let [buffer-ids (sorted-buffer-ids)
        current-id (:current-buffer @state/app-state)
        current-index (.indexOf (clj->js buffer-ids) current-id)]
    (when (seq buffer-ids)
      (let [next-index (if (neg? current-index)
                         0
                         (mod (inc current-index) (count buffer-ids)))
            next-id (nth buffer-ids next-index)]
        (activate-buffer! next-id)
        (update-status! (str "Switched to " (:name (get-in @state/app-state [:buffers next-id]))))))))

(defn previous-buffer []
  (let [buffer-ids (sorted-buffer-ids)
        current-id (:current-buffer @state/app-state)
        current-index (.indexOf (clj->js buffer-ids) current-id)]
    (when (seq buffer-ids)
      (let [prev-index (if (neg? current-index)
                         0
                         (mod (dec current-index) (count buffer-ids)))
            prev-id (nth buffer-ids prev-index)]
        (activate-buffer! prev-id)
        (update-status! (str "Switched to " (:name (get-in @state/app-state [:buffers prev-id]))))))))

(defn list-buffers []
  (let [buffers (vals (:buffers @state/app-state))
        listing (if (seq buffers)
                  (->> buffers
                       (map (fn [buffer]
                              (str (:id buffer)
                                   " - "
                                   (:name buffer)
                                   (when (:modified? buffer) " *"))))
                       (str/join "\n"))
                  "No buffers open")]
    (js/alert listing)
    (update-status! "Buffer list opened")
    buffers))

;; End of file

;; End of file

;; End of file

;; End of file

;; End of file

;; Search functionality

;; Search functionality

;; Search functionality

;; End of file

;; End of file

;; End of file

;; Search functionality

;; Search functionality
(defn search-next [query]
  (when-let [buffer (state/get-current-buffer)]
    (let [content (:content buffer)
          current-pos (:cursor-pos buffer)
          search-pos (inc current-pos)
          match-index (str/index-of content query search-pos)]
      (if match-index
        (do
          (state/update-current-buffer!
           (fn [b]
             (-> b
                 (assoc :cursor-pos match-index)
                 (assoc :selection {:start match-index
                                    :end (+ match-index (count query))}))))
          (println "Found at position:" match-index))
        (println "Not found:" query)))))

(defn search-prev [query]
  (when-let [buffer (state/get-current-buffer)]
    (let [content (:content buffer)
          current-pos (:cursor-pos buffer)
          search-pos (max 0 (dec current-pos))
          match-index (str/last-index-of content query search-pos)]
      (if match-index
        (do
          (state/update-current-buffer!
           (fn [b]
             (-> b
                 (assoc :cursor-pos match-index)
                 (assoc :selection {:start match-index
                                    :end (+ match-index (count query))}))))
          (println "Found at position:" match-index))
        (println "Not found:" query)))))

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Command palette

;; Simplified key handlers for basic Evil mode

;; Mode transition functions

;; Mode transition functions

;; Duplicate utility functions removed - moved above motion functions

;; Duplicate line-col-to-pos function removed - moved above motion functions

;; Duplicate get-line-content function removed - moved above motion functions

;; Duplicate get-line-count function removed - moved above motion functions

;; Duplicate get-line-range function removed - moved above motion functions

;; Utility functions for cursor movement and text manipulation
(defn pos-to-line-col
  "Convert buffer position to line and column numbers (0-based)"
  [content pos]
  (if (zero? pos)
    [0 0]
    (let [before-pos (subs content 0 pos)
          ;; Count newlines directly to determine line number
          line-count (count (filter #{\newline} before-pos))
          last-line-start (str/last-index-of before-pos "\n")
          col (if (nil? last-line-start)
                pos
                (- pos (inc last-line-start)))]
      [line-count col])))

(defn line-col-to-pos
  "Convert line and column numbers (0-based) to buffer position"
  [content line col]
  (let [lines (str/split-lines content)
        line-count (count lines)
        line-num (if (and (number? line) (>= line 0)) line 0)]
    (if (>= line-num line-count)
      (count content)
      (loop [current-line 0
             pos 0
             remaining-lines lines]
        (if (= current-line line-num)
          (+ pos (min col (count (first remaining-lines))))
          (recur (inc current-line)
                 (+ pos (inc (count (first remaining-lines))))
                 (rest remaining-lines)))))))

(defn get-line-content
  "Get content of specific line (0-based)"
  [content line-num]
  (let [lines (str/split-lines content)]
    (when (< line-num (count lines))
      (nth lines line-num))))

(defn get-line-count
  "Get total number of lines in content"
  [content]
  (count (str/split-lines content)))

(defn get-line-range
  "Get start and end positions of a line (0-based)"
  [content line-num]
  (let [lines (str/split-lines content)
        line-count (count lines)]
    (when (< line-num line-count)
      (let [start-pos (line-col-to-pos content line-num 0)
            line-content (nth lines line-num)
            end-pos (+ start-pos (count line-content))]
        [start-pos end-pos]))))

;; Motion functions
(defn move-cursor-left [e]
  (let [el (.-target e)
        current-pos (.-selectionStart el)]
    (when (> current-pos 0)
      (set! (.-selectionStart el) (dec current-pos))
      (set! (.-selectionEnd el) (dec current-pos))
      (state/update-current-buffer! (fn [b] (assoc b :cursor-pos (dec current-pos)))))))

(defn move-cursor-right [e]
  (let [el (.-target e)
        current-pos (.-selectionStart el)
        max-pos (.-length (.-value el))]
    (when (< current-pos max-pos)
      (set! (.-selectionStart el) (inc current-pos))
      (set! (.-selectionEnd el) (inc current-pos))
      (state/update-current-buffer! (fn [b] (assoc b :cursor-pos (inc current-pos)))))))

(defn move-cursor-up [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)
        [line col] (pos-to-line-col content current-pos)]
    (when (> line 0)
      (let [new-pos (line-col-to-pos content (dec line) col)]
        (set! (.-selectionStart el) new-pos)
        (set! (.-selectionEnd el) new-pos)
        (state/update-current-buffer! (fn [b] (assoc b :cursor-pos new-pos)))))))

(defn move-cursor-down [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)
        [line col] (pos-to-line-col content current-pos)
        line-count (get-line-count content)]
    (when (< line (dec line-count))
      (let [new-pos (line-col-to-pos content (inc line) col)]
        (set! (.-selectionStart el) new-pos)
        (set! (.-selectionEnd el) new-pos)
        (state/update-current-buffer! (fn [b] (assoc b :cursor-pos new-pos)))))))

(defn move-to-line-start [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)
        [line _] (pos-to-line-col content current-pos)
        new-pos (line-col-to-pos content line 0)]
    (set! (.-selectionStart el) new-pos)
    (set! (.-selectionEnd el) new-pos)
    (state/update-current-buffer! (fn [b] (assoc b :cursor-pos new-pos)))))

(defn move-to-line-end [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)
        [line _] (pos-to-line-col content current-pos)
        line-content (get-line-content content line)
        new-pos (line-col-to-pos content line (count line-content))]
    (set! (.-selectionStart el) new-pos)
    (set! (.-selectionEnd el) new-pos)
    (state/update-current-buffer! (fn [b] (assoc b :cursor-pos new-pos)))))

;; Operator functions
(defn delete-char [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)]
    (when (< current-pos (count content))
      (let [new-content (str (subs content 0 current-pos) (subs content (inc current-pos)))]
        (set! (.-value el) new-content)
        (state/update-current-buffer!
         (fn [b]
           (-> b
               (assoc :content new-content)
               (assoc :cursor-pos current-pos)
               (assoc :modified? true))))))))

(defn delete-line [e]
  (let [el (.-target e)
        content (.-value el)
        current-pos (.-selectionStart el)
        [line _] (pos-to-line-col content current-pos)
        line-range (get-line-range content line)
        [start-pos end-pos] line-range
        new-content (str (subs content 0 start-pos) (subs content end-pos))]
    (set! (.-value el) new-content)
    (state/update-current-buffer!
     (fn [b]
       (-> b
           (assoc :content new-content)
           (assoc :cursor-pos start-pos)
           (assoc :modified? true))))))

;; Visual mode functions
(defn extend-selection-left [e]
  (let [el (.-target e)
        current-end (.-selectionEnd el)]
    (when (> current-end 0)
      (set! (.-selectionEnd el) (dec current-end))
      (state/update-current-buffer!
       (fn [b]
         (let [start (.-selectionStart el)
               end (.-selectionEnd el)]
           (assoc b :selection {:start (min start end) :end (max start end)})))))))

(defn extend-selection-right [e]
  (let [el (.-target e)
        current-end (.-selectionEnd el)
        max-pos (.-length (.-value el))]
    (when (< current-end max-pos)
      (set! (.-selectionEnd el) (inc current-end))
      (state/update-current-buffer!
       (fn [b]
         (let [start (.-selectionStart el)
               end (.-selectionEnd el)]
           (assoc b :selection {:start (min start end) :end (max start end)})))))))

(defn extend-selection-up [e]
  (let [el (.-target e)
        content (.-value el)
        current-end (.-selectionEnd el)
        [line col] (pos-to-line-col content current-end)]
    (when (> line 0)
      (let [new-pos (line-col-to-pos content (dec line) col)]
        (set! (.-selectionEnd el) new-pos)
        (state/update-current-buffer!
         (fn [b]
           (let [start (.-selectionStart el)
                 end (.-selectionEnd el)]
             (assoc b :selection {:start (min start end) :end (max start end)}))))))))

(defn extend-selection-down [e]
  (let [el (.-target e)
        content (.-value el)
        current-end (.-selectionEnd el)
        [line col] (pos-to-line-col content current-end)
        line-count (get-line-count content)]
    (when (< line (dec line-count))
      (let [new-pos (line-col-to-pos content (inc line) col)]
        (set! (.-selectionEnd el) new-pos)
        (state/update-current-buffer!
         (fn [b]
           (let [start (.-selectionStart el)
                 end (.-selectionEnd el)]
             (assoc b :selection {:start (min start end) :end (max start end)}))))))))

(defn yank-selection [e]
  (let [el (.-target e)
        content (.-value el)
        start (.-selectionStart el)
        end (.-selectionEnd el)
        selected-text (.substring content (min start end) (max start end))]
    (state/set-evil-register! selected-text)
    (exit-visual-mode)))

(defn delete-selection [e]
  (let [el (.-target e)
        content (.-value el)
        start (.-selectionStart el)
        end (.-selectionEnd el)
        selected-text (.substring content (min start end) (max start end))
        new-content (str (subs content 0 (min start end)) (subs content (max start end)))]
    (state/set-evil-register! selected-text)
    (set! (.-value el) new-content)
    (set! (.-selectionStart el) (min start end))
    (set! (.-selectionEnd el) (min start end))
    (state/update-current-buffer!
     (fn [b]
       (-> b
           (assoc :content new-content)
           (assoc :cursor-pos (min start end))
           (assoc :selection nil)
           (assoc :modified? true))))
    (enter-normal-mode)))

;; Mode transition functions
(defn enter-insert-mode []
  (state/set-evil-mode! :insert)
  (update-statusbar))

(defn enter-normal-mode []
  (state/update-current-buffer! (fn [b] (assoc b :selection nil)))
  (state/set-evil-mode! :normal)
  (update-statusbar))

(defn enter-visual-mode []
  (let [current-buffer (state/get-current-buffer)]
    (when current-buffer
      (let [cursor-pos (:cursor-pos current-buffer)]
        (state/update-current-buffer!
         (fn [b]
           (assoc b :selection {:start cursor-pos :end cursor-pos})))))
    (state/set-evil-mode! :visual)
    (update-statusbar)))

(defn enter-visual-line-mode []
  (let [current-buffer (state/get-current-buffer)]
    (when current-buffer
      (let [content (:content current-buffer)
            cursor-pos (:cursor-pos current-buffer)
            [line _] (pos-to-line-col content cursor-pos)
            line-range (get-line-range content line)]
        (state/update-current-buffer!
         (fn [b]
           (assoc b :selection {:start (first line-range) :end (second line-range)})))))
    (state/set-evil-mode! :visual-line)
    (update-statusbar)))

(defn exit-visual-mode []
  (state/update-current-buffer! (fn [b] (assoc b :selection nil)))
  (enter-normal-mode))

;; Command palette

;; Mode transition functions

;; Command palette
(defn command-palette []
  (command-palette/open!))

(defn show-command-palette []
  (command-palette/open!))

;; Window operations (placeholders)
(defn other-window []
  (println "Other window not implemented yet"))

(defn split-window []
  (println "Split window not implemented yet"))

(defn vsplit-window []
  (println "Vertical split window not implemented yet"))

(defn close-window []
  (println "Close window not implemented yet"))

;; File operations (placeholders)
(defn find-file []
  (let [file-path (str/trim (or (js/prompt "Open file (workspace-relative path):" "README.md") ""))]
    (if (str/blank? file-path)
      (update-status! "Open file cancelled")
      (open-file file-path))))

(defn find-file-in-project []
  (find-file))

(defn switch-project []
  (update-status! "Switch project is managed by the backend WORKSPACE_ROOT setting"))

;; Editor operations (placeholders)
(defn eval-expression []
  (println "Eval expression not implemented yet"))

;; UI operations
(defn toggle-terminal []
  (println "Toggle terminal not implemented yet"))

(defn toggle-fullscreen []
  (println "Toggle fullscreen not implemented yet"))

(defn open-settings []
  (println "Open settings not implemented yet"))

;; Duplicate pos-to-line-col function removed - moved above motion functions

;; Duplicate line-col-to-pos function removed - moved above motion functions

;; Duplicate get-line-content function removed - moved above motion functions

;; Duplicate get-line-count function removed - moved above motion functions

;; Duplicate get-line-range function removed - moved above motion functions

;; Search functionality

;; Empty function declaration removed

;; Duplicate get-current-line function removed

;; Empty function declaration removed

;; Duplicate get-current-col function removed

(defn find-buffer-by-path
  "Find buffer by file path"
  [path]
  (let [buffers (:buffers @state/app-state)]
    (first (filter #(= (:path %) path) (vals buffers)))))

;; Word boundary finding
(defn find-next-word-boundary
  "Find the next word boundary starting from pos"
  [content pos]
  (let [word-chars "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"
        content-len (count content)]
    (loop [current-pos pos
           phase :consume-word]
      (if (>= current-pos content-len)
        content-len
        (let [char (get content current-pos)
              is-word? (str/includes? word-chars char)]
          (case phase
            :consume-word
            (if is-word?
              (recur (inc current-pos) :consume-word)
              (recur current-pos :consume-space))
            
            :consume-space
            (if (not is-word?)
              (recur (inc current-pos) :consume-space)
              current-pos)))))))

(defn find-prev-word-boundary
  "Find the previous word boundary starting from pos"
  [content pos]
  (let [word-chars "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"]
    (loop [current-pos (dec pos)
           phase :skip-space]
      (if (< current-pos 0)
        0
        (let [char (get content current-pos)
              is-word? (str/includes? word-chars char)]
          (case phase
            :skip-space
            (if (not is-word?)
              (recur (dec current-pos) :skip-space)
              (recur current-pos :consume-word))
            
            :consume-word
            (if is-word?
              (recur (dec current-pos) :consume-word)
              (inc current-pos))))))))

;; Simplified key handlers for basic Evil mode
(defn handle-normal-mode-key [e key]
  (case key
    ;; Mode switches
    "i" (do (.preventDefault e) (enter-insert-mode))
    "v" (do (.preventDefault e) (enter-visual-mode))
    "V" (do (.preventDefault e) (enter-visual-line-mode))

    ;; Basic motions
    "h" (do (.preventDefault e) (move-cursor-left e))
    "j" (do (.preventDefault e) (move-cursor-down e))
    "k" (do (.preventDefault e) (move-cursor-up e))
    "l" (do (.preventDefault e) (move-cursor-right e))
    "0" (do (.preventDefault e) (move-to-line-start e))
    "$" (do (.preventDefault e) (move-to-line-end e))

    ;; Basic operators
    "x" (do (.preventDefault e) (delete-char e))
    "dd" (do (.preventDefault e) (delete-line e))

    nil))

(defn handle-visual-mode-key [e key]
  (case key
    "Escape" (do (.preventDefault e) (exit-visual-mode))
    "h" (do (.preventDefault e) (extend-selection-left e))
    "j" (do (.preventDefault e) (extend-selection-down e))
    "k" (do (.preventDefault e) (extend-selection-up e))
    "l" (do (.preventDefault e) (extend-selection-right e))
    "y" (do (.preventDefault e) (yank-selection e))
    "d" (do (.preventDefault e) (delete-selection e))
    nil))

;; Editor component with Evil mode integration
(defn editor [buffer]
  (let [content (:content buffer)
        cursor-pos (:cursor-pos buffer)
        selection (:selection buffer)
        evil-mode (state/get-evil-mode)]

    [:textarea.editor-content
     {:value content
      :read-only false
      :ref (fn [el]
             (when el
               (if selection
                 (do
                   (set! (.-selectionStart el) (min (:start selection) (:end selection)))
                   (set! (.-selectionEnd el) (max (:start selection) (:end selection))))
                 (let [pos (min (count content) (max 0 (or cursor-pos 0)))]
                   (set! (.-selectionStart el) pos)
                   (set! (.-selectionEnd el) pos)))))
      :on-before-input (fn [e]
                         (when (not= evil-mode :insert)
                           (.preventDefault e)))
      :on-change (fn [e]
                   (when (= evil-mode :insert)
                     (let [new-value (-> e .-target .-value)
                           new-cursor-pos (-> e .-target .-selectionStart)]
                       (state/update-current-buffer!
                        (fn [b]
                          (-> b
                              (assoc :content new-value)
                              (assoc :cursor-pos new-cursor-pos)
                              (assoc :modified? true)))))))
      :on-key-down (fn [e]
                      (let [key (.-key e)
                            ctrl-key (.-ctrlKey e)
                            alt-key (.-altKey e)
                            meta-key (.-metaKey e)]
                        (when-not (or ctrl-key alt-key meta-key)
                          (case evil-mode
                            :normal (do
                                      (.preventDefault e)
                                      (handle-normal-mode-key e key))
                            :insert (when (= key "Escape")
                                      (.preventDefault e)
                                      (enter-normal-mode))
                            :visual (do
                                      (.preventDefault e)
                                      (handle-visual-mode-key e key))
                            nil))))
      :style {:width "100%"
              :height "100%"
              :border "none"
              :outline "none"
              :background "transparent"
              :color "var(--text-primary)"
              :caret-color (if (= evil-mode :insert) "var(--accent)" "var(--text-primary)")
              :font-family "monospace"
              :font-size "14px"
              :line-height "1.5"
              :padding "1rem"
              :resize "none"
              :white-space "pre"
              :overflow "auto"}}]))
