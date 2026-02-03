(ns promethean.adapters.discord)

(defn now-ms [] (.now js/Date))

(defn make-discord [{:keys [token]}]
  (let [discord (js/require "discord.js")
        Client (.-Client discord)
        GatewayIntentBits (.-GatewayIntentBits discord)
        client (new Client
                    (clj->js {:intents #js [(.-Guilds GatewayIntentBits)
                                           (.-GuildMessages GatewayIntentBits)
                                           (.-MessageContent GatewayIntentBits)]}))]
    {:token token
     :discord discord
     :client client
     :ready? (atom false)}))

(defn start-discord! [{:keys [client token ready?]} world*]
  (when (and token (not= "" token))
    (.on client "ready"
         (fn []
           (reset! ready? true)
           (swap! world* update :events/out conj
                  {:event/id (str (random-uuid))
                   :event/ts (now-ms)
                   :event/type :discord/client.ready
                   :event/source {:kind :discord}
                   :event/payload {:ok true}})))
    (.on client "messageCreate"
         (fn [msg]
           (let [channel-id (some-> msg .-channelId str)
                 author (.-author msg)
                 author-id (some-> author .-id str)
                 author-bot (boolean (.-bot author))
                 content (or (some-> msg .-content str) "")
                 msg-id (some-> msg .-id str)]
             (swap! world* update :events/out conj
                    {:event/id (str (random-uuid))
                     :event/ts (now-ms)
                     :event/type :discord.message/new
                     :event/source {:kind :discord
                                    :channel-id channel-id
                                    :author-id author-id
                                    :message-id msg-id}
                     :event/payload {:content content
                                     :author-id author-id
                                     :author-bot author-bot
                                     :message-id msg-id}}))))
    (.login client token)))

(defn send-message! [{:keys [client ready?]} channel-id content]
  (if (and client @ready?)
    (-> (.fetch (.-channels client) channel-id)
        (.then (fn [ch] (.send ch content))))
    (js/Promise.reject (js/Error. "discord client not ready"))))
