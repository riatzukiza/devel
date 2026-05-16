content = open('orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs').read()

old_text = '''(defn- sticky-session-base-conversation-id
  [job event]
  (let [author-id (or (get-in event [:payload :authorId]) "unknown-user")]
    (str "event-agent-" (:id job) "-" author-id "-" (str/lower-case (str (:sourceKind event))) "-sticky")))

(defn- sticky-session-base-session-id
  [job event]
  (let [author-id (or (get-in event [:payload :authorId]) "unknown-user")]
    (str "event-agent-session-" (:id job) "-" author-id "-sticky")))'''

new_text = '''(defn- sticky-session-base-conversation-id
  [job event]
  (let [source-kind (str (:sourceKind event))
        author-id (or (get-in event [:payload :authorId]) "unknown-user")
        owner-id (if (= source-kind "discord")
                   (or (get-in event [:payload :channelId]) author-id)
                   author-id)]
    (str "event-agent-" (:id job) "-" owner-id "-" (str/lower-case source-kind) "-sticky")))

(defn- sticky-session-base-session-id
  [job event]
  (let [source-kind (str (:sourceKind event))
        author-id (or (get-in event [:payload :authorId]) "unknown-user")
        owner-id (if (= source-kind "discord")
                   (or (get-in event [:payload :channelId]) author-id)
                   author-id)]
    (str "event-agent-session-" (:id job) "-" owner-id "-sticky")))'''

with open('orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs', 'w') as f:
    f.write(content.replace(old_text, new_text))
