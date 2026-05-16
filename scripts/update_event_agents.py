import re

file_path = 'orgs/open-hax/openplanner/packages/agents/knoxx/backend/src/cljs/knoxx/backend/event_agents.cljs'
with open(file_path, 'r') as f:
    content = f.read()

# 1. Sticky Session Base IDs
# Replace the entire block of the two functions
pattern_sticky = r'(defn- sticky-session-base-conversation-id.*?sticky-session-base-session-id.*?sticky\)\)\n\n'
replacement_sticky = '''(defn- sticky-session-base-conversation-id
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
    (str "event-agent-session-" (:id job) "-" owner-id "-sticky")))

'''
content = re.sub(pattern_sticky, replacement_sticky, content, flags=re.DOTALL)

# 2. matches-event-kind?
pattern_match_kind = r'(defn- matches-event-kind?\s+\[job event-kind\]\s+ \(let \[configured \(vec \(or \(get-in job \[:trigger :eventKinds\]\) \[\]\)\)]\n    \(or \(empty? configured\)\n        \(some #(= \(str %\) \(str event-kind\)) configured\)\)\))'
# Since the regex is failing, I'll just use a simple string replace for a unique part.
# Let's find the function by name.
def replace_matches_event_kind(match):
    return '''(defn- matches-event-kind?
  [job event-kinds]
  (let [configured (vec (or (get-in job [:trigger :eventKinds]) []))]
    (or (empty? configured)
        (some (fn [conf]
                (some #(= (str conf) (str %) (str %))) # a dummy, let's write it properly
              event-kinds)))))'''
# Actually, the correct logic for `matches-event-kind?` when `event-kinds` is a vector:
# (some (fn [ek] (some #(= (str ek) (str %)) configured)) event-kinds)
# Or more simply: (some (fn [conf] (some #(= (str conf) (str %) (str %)) event-kinds)) configured)

# Let's rethink. If configured is [A B] and event-kinds is [X Y].
# We want to know if {A, B} ∩ {X, Y} is non-empty.
# (some (fn [conf] (some #(= (str conf) (str %) (str %)) event-kinds)) configured)
# No, (some (fn [conf] (some #(= (str conf) (str %)) event-kinds)) configured) is still wrong.

# Correct Clojure: (some (fn [ek] (some #(= (str ek) (str %)) configured)) event-kinds)
# Wait, `some` takes a predicate and a collection.
# (some (fn [ek] (some #(= (str ek) (str %)) configured)) event-kinds)
# Inside the inner `some`, `%` is the element of `configured`.
# So it is: (some (fn [ek] (some (fn [conf] (= (str ek) (str conf))) configured)) event-kinds)

# Let's just use a simpler replacement.
