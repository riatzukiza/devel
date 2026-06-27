(ns opencode-unified.env
  "Environment abstraction layer for dual-mode support")

(defn electron?
  "Check if running in Electron environment"
  []
  (and (exists? js/window)
       (some? (aget js/window "electronAPI"))))

(defn node?
  "Check if running in Node.js environment"
  []
  (exists? js/process))

(defn web?
  "Check if running in web browser environment"
  []
  (and (exists? js/window)
       (not (electron?))
       (not (node?))))

(defn get-platform
  "Get the current platform: :electron, :web, or :node"
  []
  (cond
    (electron?) :electron
    (web?) :web
    (node?) :node
    :else :unknown))

(defn electron-api
  "Get Electron API if available"
  []
  (when (electron?)
    (aget js/window "electronAPI")))

(defn show-notification?
  "Check if notifications are supported"
  []
  (or (electron?)
      (and (web?)
           (exists? js/Notification)
           (= (.-permission js/Notification) "granted"))))

(defn file-system-access?
  "Check if file system access is available"
  []
  (electron?))

(defn get-app-version
  "Get application version"
  []
  (cond
    (electron?)
    (if-let [get-app-version (some-> (electron-api) (aget "getAppVersion"))]
      (get-app-version)
      "web-version")

    :else
    "web-version"))

(defn open-external-url
  "Open URL in external browser"
  [url]
  (cond
    (electron?)
    (if-let [open-external (some-> (electron-api) (aget "openExternal"))]
      (open-external url)
      (println "Cannot open external URL:" url))

    (web?)
    (.open js/window url "_blank")

    :else
    (println "Cannot open external URL:" url)))
