(ns eta-mu.extensions.image-render
  "Render images (local files, URLs, data URLs) inline in the TUI.
  Migrated from: ~/.ημ/agent/extensions/image-render.ts"
  (:require-macros [eta-mu.core :as em])
  (:require ["node:fs/promises" :as fs]
            ["node:os" :as os]
            ["node:path" :as path]
            ["node:child_process" :as cp]))

(def DEFAULT-MAX-BYTES (* 8 1024 1024))

(defn format-bytes [bytes]
  (cond
    (< bytes 1024) (str bytes " B")
    (< bytes (* 1024 1024)) (str (.toFixed (/ bytes 1024) 1) " KB")
    :else (str (.toFixed (/ bytes (* 1024 1024)) 2) " MB")))

(defn mime-from-ext [p]
  (case (.toLowerCase (path/extname p))
    ".png" "image/png"
    (".jpg" ".jpeg") "image/jpeg"
    ".gif" "image/gif"
    ".webp" "image/webp"
    ".bmp" "image/bmp"
    (".tiff" ".tif") "image/tiff"
    nil))

(defn parse-data-url [source]
  (let [match (re-find #"^data:([^;,]*)(;base64)?,(.*)$" source)]
    (if-not match
      (js/Promise.reject (js/Error. "Invalid data URL format."))
      (let [mime (or (nth match 1) "application/octet-stream")
            base64? (= ";base64" (nth match 2))
            data (or (nth match 3) "")]
        (if-not base64?
          (js/Promise.reject (js/Error. "Only base64-encoded data URLs are supported."))
          #js {:mimeType mime :data data})))))

(defn ext-from-mime [mime]
  (case mime
    "image/png" ".png"
    "image/jpeg" ".jpg"
    "image/gif" ".gif"
    "image/webp" ".webp"
    "image/bmp" ".bmp"
    "image/tiff" ".tiff"
    ".img"))

(defn has-cmd? [cmd]
  (= 0 (aget (cp/spawnSync "which" #js [cmd] #js {:stdio "ignore"}) "status")))

(defn pick-viewer []
  (cond
    (has-cmd? "imv") "imv"
    (has-cmd? "feh") "feh"
    (has-cmd? "sxiv") "sxiv"
    (has-cmd? "gwenview") "gwenview"
    :else "xdg-open"))

(defn is-alacritty? []
  (or (= "alacritty" (aget js/process.env "TERM"))
      (string? (aget js/process.env "ALACRITTY_SOCKET"))))

(defn open-in-viewer [file-path]
  (let [viewer (pick-viewer)]
    (try
      (let [child (cp/spawn viewer #js [file-path] #js {:stdio "ignore" :detached true})]
        (.unref child)
        #js {:viewer viewer :file-path file-path})
      (catch :default _ nil))))

(defn write-temp-image [buffer mime]
  (let [dir (path/join (os/tmpdir) "pi-render-image")
        ext (ext-from-mime mime)
        file (path/join dir (str "render-" (js/Date.now) "-" (.slice (.toString (js/Math.random) 16) 2) ext))]
    (-> (fs/mkdir dir #js {:recursive true})
        (.then (fn [] (fs/writeFile file buffer))))
    file))

(defn load-from-data-url [source max-bytes mime-override]
  (let [parsed (parse-data-url source)]
    (if (.-mimeType parsed)
      (let [buffer (js/Buffer.from (aget parsed "data") "base64")
            byte-count (.-length buffer)]
        (if (> byte-count max-bytes)
          (js/Promise.reject (js/Error. (str "Image is " (format-bytes byte-count) " which exceeds maxBytes (" (format-bytes max-bytes) ").")))
          (js/Promise.resolve #js {:data (aget parsed "data")
                                   :mimeType (or mime-override (aget parsed "mimeType"))
                                   :bytes byte-count
                                   :source-label "data URL"
                                   :origin "data"})))
      parsed)))

(defn load-from-url [source max-bytes mime-override signal]
  (-> (js/fetch source #js {:signal signal})
      (.then (fn [resp]
               (if (.-ok resp)
                 (-> (.arrayBuffer resp)
                     (.then (fn [ab]
                              (let [buffer (js/Buffer.from ab)
                                    byte-count (.-length buffer)
                                    mime (or mime-override
                                             (some-> (.. resp -headers (get "content-type"))
                                                     (.split ";")
                                                     (aget 0)
                                                     (.trim)))]
                                (if (> byte-count max-bytes)
                                  (js/Promise.reject (js/Error. (str "Image too large: " (format-bytes byte-count))))
                                  (if-not mime
                                    (js/Promise.reject (js/Error. "Unable to determine MIME type. Provide mimeType."))
                                    #js {:data (.toString buffer "base64")
                                         :mimeType mime
                                         :bytes byte-count
                                         :source-label source
                                         :origin "url"}))))))
                 (js/Promise.reject (js/Error. (str "Failed to fetch image (" (.-status resp) ")."))))))))

(defn load-from-file [source max-bytes mime-override cwd]
  (let [expanded (if (.startsWith source "~/")
                   (path/resolve (os/homedir) (.slice source 2))
                   (.replace source (js/RegExp. "^file:///?" "i") ""))
        resolved (path/resolve cwd expanded)]
    (-> (fs/readFile resolved)
        (.then (fn [buffer]
                 (let [byte-count (.-length buffer)
                       mime (or mime-override (mime-from-ext resolved))]
                   (if (> byte-count max-bytes)
                     (js/Promise.reject (js/Error. (str "Image too large: " (format-bytes byte-count))))
                     (if-not mime
                       (js/Promise.reject (js/Error. "Unable to infer MIME type. Provide mimeType."))
                       #js {:data (.toString buffer "base64")
                            :mimeType mime
                            :bytes byte-count
                            :source-label resolved
                            :origin "file"
                            :file-path resolved}))))))))

(em/defextension image-render
  :name "image-render"
  :description "Render a local image file or URL in the TUI"

  (em/tool "render_image"
    :label "Render image"
    :description "Render an image from a local path, URL, or data URL in the TUI."
    :parameters {:source {:type "string" :description "Local file path, http(s) URL, or data: URL to render."}
                 :mimeType {:type "string" :description "Optional MIME type override." :optional true}
                 :maxBytes {:type "integer" :description "Maximum bytes to load" :minimum 1 :optional true}}
    :execute (fn [tool-call-id params signal on-update ctx]
               (let [source (.trim (aget params "source"))
                     max-bytes (or (aget params "maxBytes") DEFAULT-MAX-BYTES)
                     mime-override (aget params "mimeType")
                     cwd (aget ctx "cwd")
                     load-promise (cond
                                    (.startsWith source "data:")
                                    (load-from-data-url source max-bytes mime-override)
                                    (or (.startsWith source "http://") (.startsWith source "https://"))
                                    (load-from-url source max-bytes mime-override signal)
                                    :else
                                    (load-from-file source max-bytes mime-override cwd))]
                 (when on-update
                   (on-update #js {:content #js [#js {:type "text" :text "Loading image..."}]}))
                 (-> load-promise
                     (.then (fn [payload]
                              (let [opened (when (is-alacritty?)
                                             (let [fp (if (and (= (aget payload "origin") "file")
                                                               (aget payload "file-path"))
                                                        (aget payload "file-path")
                                                        (write-temp-image (js/Buffer.from (aget payload "data") "base64")
                                                                          (aget payload "mimeType")))]
                                               (when fp
                                                 (open-in-viewer fp))))]
                                #js {:content #js [#js {:type "text"
                                                        :text (str "Rendered image from " (aget payload "source-label")
                                                                   " (" (aget payload "mimeType") ", " (format-bytes (aget payload "bytes")) ")."
                                                                   (when opened
                                                                     (str " Opened externally via " (aget opened "viewer") ": " (aget opened "file-path"))))}
                                                       #js {:type "image"
                                                            :data (aget payload "data")
                                                            :mimeType (aget payload "mimeType")}]
                                     :details #js {:source (aget payload "source-label")
                                                   :mimeType (aget payload "mimeType")
                                                    :bytes (aget payload "bytes")}}))))))))
