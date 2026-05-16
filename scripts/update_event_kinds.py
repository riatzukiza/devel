content = open('orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs').read()

old_text = '''(defn- matches-event-kind?
  [job event-kind]
  (let [configured (vec (or (get-in job [:trigger :eventKinds]) []))]
    (or (empty? configured)
        (some #(= (str %) (str event-kind)) configured))))'''

new_text = '''(defn- matches-event-kind?
  [job event-kinds]
  (let [configured (vec (or (get-in job [:trigger :eventKinds]) []))
        kinds (if (string? event-kinds) [event-kinds] event-kinds)]
    (or (empty? configured)
        (some (fn [ek]
                (some (fn [conf] (= (str ek) (str conf)))
                      configured))
              kinds))))'''

with open('orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs', 'w') as f:
    f.write(content.replace(old_text, new_text))
