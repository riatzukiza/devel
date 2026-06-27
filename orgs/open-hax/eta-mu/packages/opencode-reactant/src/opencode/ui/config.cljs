(ns opencode.ui.config)

(goog-define API_BASE "http://localhost:8787/api")
(goog-define WS_URL "ws://localhost:8787/events")
(goog-define WS_RECONNECT_MS 500)

(defn- env [k]
  (some-> js/process .-env (aget k)))

(defn api-base []
  (or (env "OPENHAX_API_BASE")
      (when (exists? js/globalThis)
        (.-__OPENHAX_API_BASE__ js/globalThis))
      API_BASE))

(defn ws-url []
  (or (env "OPENHAX_WS_URL")
      (when (exists? js/globalThis)
        (.-__OPENHAX_WS_URL__ js/globalThis))
      WS_URL))

(defn ws-reconnect-ms [] WS_RECONNECT_MS)
