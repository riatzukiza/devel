;; Lightweight test utilities for CLJS tests in cephalon-cljs

(ns promethean.test-utils)

(defn await-promise
  "Await a Promise and call done with value or error.
   Use with cljs.test async helpers (pass the done callback)."
  [p done]
  (.then p
         (fn [v] (done v))
         (fn [err] (done err))))

(defn deferred
  "Create a small JS Promise deferred with resolve/reject handlers exposed."
  []
  (let [state (atom {:resolve nil :reject nil})
        p (js/Promise. (fn [resolve reject]
                         (swap! state assoc :resolve resolve)
                         (swap! state assoc :reject reject)))]
    {:promise p
     :resolve (fn [v] (when-let [r (:resolve @state)] (r v)))
     :reject (fn [e] (when-let [r (:reject @state)] (r e)))}))

(defn make-fake-openai-client
  "Create a fake OpenAI client that captures create payloads and resolves them."
  []
  (let [calls (atom [])
        create-chat (fn [payload]
                      (swap! calls conj {:type :chat :payload payload})
                      (js/Promise.resolve payload))
        create-embed (fn [payload]
                       (swap! calls conj {:type :embed :payload payload})
                       (js/Promise.resolve payload))
        client (clj->js {:chat {:completions {:create create-chat}}
                         :embeddings {:create create-embed}})]
    {:client client
     :calls calls}))

(defn make-fake-discord-client
  "Create a fake Discord client with ready state and fetch/send stubs."
  []
  (let [ready? (atom false)
        handlers (atom {})
        client (js-obj)]
    (set! (.-on client)
          (fn [evt handler]
            (swap! handlers assoc evt handler)
            client))
    (set! (.-login client)
          (fn [_token] (js/Promise.resolve true)))
    (set! (.-channels client)
          (clj->js {:fetch (fn [_channel-id]
                             (js/Promise.resolve (clj->js {:send (fn [_content] (js/Promise.resolve true))}))) }))
    {:client client
     :ready? (fn [] @ready?)
     :set-ready (fn [v] (reset! ready? v))
     :emit (fn [evt payload]
             (when-let [handler (get @handlers evt)]
               (handler payload)))}))

(defn make-fake-fs-adapter
  "Create a fake FS adapter with in-memory read/write + watcher stub."
  []
  (let [store (atom {})
        watcher (js-obj)]
    (set! (.-on watcher) (fn [_evt _handler] watcher))
    {:fsp (clj->js {:readFile (fn [path _encoding]
                                (js/Promise.resolve (get @store path)))
                    :writeFile (fn [path content _encoding]
                                 (swap! store assoc path content)
                                 (js/Promise.resolve true))})
     :chokidar (clj->js {:watch (fn [_path _opts] watcher)})}))
