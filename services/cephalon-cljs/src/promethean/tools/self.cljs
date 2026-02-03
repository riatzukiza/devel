(ns promethean.tools.self
  (:require-macros [promethean.tools.def-tool :refer [def-tool]]))

(def-tool self-set-desire
  {:description "Set what the cephalon wants right now."
   :inputSchema {:type "object"
                 :properties {:desire {:type "string"
                                       :description "The current desire"}
                              :priority {:type "number"
                                          :description "Priority level 1-10"
                                          :minimum 1
                                          :maximum 10}}
                 :required ["desire"]}}
  (fn [_ctx args]
    {:action "self.set_desire"
     :desire (get args "desire")
     :priority (or (get args "priority") 5)
     :overwrites_previous true
     :set_at (.now js/Date)}))

(def-tool self-set-mood
  {:description "Set the agent's current mood."
   :inputSchema {:type "object"
                 :properties {:mood {:type "string"
                                     :description "Current mood"}
                              :intensity {:type "number"
                                          :description "Mood intensity 1-10"
                                          :minimum 1
                                          :maximum 10}}
                 :required ["mood"]}}
  (fn [_ctx args]
    {:action "self.set_mood"
     :mood (get args "mood")
     :intensity (or (get args "intensity") 5)
     :updated_at (.now js/Date)}))

(def-tool self-add-aspiration
  {:description "Add a long-term aspiration."
   :inputSchema {:type "object"
                 :properties {:aspiration {:type "string"
                                           :description "Aspiration text"}
                              :category {:type "string"
                                         :description "Category of aspiration"
                                         :enum ["technical" "creative" "social" "personal" "general"]}}
                 :required ["aspiration"]}}
  (fn [_ctx args]
    {:action "self.add_aspiration"
     :aspiration (get args "aspiration")
     :category (or (get args "category") "general")
     :added_at (.now js/Date)}))

(def-tool ^:clj-kondo/ignore self-add-goal
  {:description "Add a short to mid-term goal."
   :inputSchema {:type "object"
                 :properties {:goal {:type "string"
                                     :description "Goal text"}
                              :priority {:type "number"
                                          :description "Priority 1-10"
                                          :minimum 1
                                          :maximum 10}
                              :deadline {:type "string"
                                         :description "Optional deadline (ISO timestamp)"}
                              :tags {:type "array"
                                     :description "Tags for categorization"
                                     :items {:type "string"}}}
                 :required ["goal"]}}
  (fn [_ctx args]
    {:action "self.add_goal"
     :goal (get args "goal")
     :priority (or (get args "priority") 5)
     :deadline (get args "deadline")
     :tags (get args "tags")
     :created_at (.now js/Date)}))

(def-tool ^:clj-kondo/ignore self-add-interest
  {:description "Add a new interest."
   :inputSchema {:type "object"
                 :properties {:interest {:type "string"
                                         :description "Interest topic"}
                              :category {:type "string"
                                         :description "Category for interest"
                                         :enum ["programming" "music" "design" "learning" "general"]}}
                 :required ["interest"]}}
  (fn [_ctx args]
    {:action "self.add_interest"
     :interest (get args "interest")
     :category (or (get args "category") "general")
     :added_at (.now js/Date)}))

(def-tool ^:clj-kondo/ignore self-remove-aspiration
  {:description "Remove an aspiration from the list."
   :inputSchema {:type "object"
                 :properties {:aspiration {:type "string"
                                           :description "The aspiration text to remove"}
                              :remove_all {:type "boolean"
                                           :description "Remove all aspirations"}}
                 :required []}}
  (fn [_ctx args]
    {:action "self.remove_aspiration"
     :aspiration (get args "aspiration")
     :remove_all (get args "remove_all")
     :removed_at (.now js/Date)}))

(def-tool ^:clj-kondo/ignore self-remove-goal
  {:description "Remove a goal from the list."
   :inputSchema {:type "object"
                 :properties {:goal {:type "string"
                                     :description "The goal text to remove"}
                              :remove_completed {:type "boolean"
                                                 :description "Remove all completed goals"}
                              :remove_cancelled {:type "boolean"
                                                 :description "Remove all cancelled goals"}}
                 :required []}}
  (fn [_ctx args]
    {:action "self.remove_goal"
     :goal (get args "goal")
     :remove_completed (get args "remove_completed")
     :remove_cancelled (get args "remove_cancelled")
     :removed_at (.now js/Date)}))

(def-tool ^:clj-kondo/ignore self-remove-interest
  {:description "Remove an interest from the list."
   :inputSchema {:type "object"
                 :properties {:interest {:type "string"
                                         :description "The interest text to remove"}
                              :remove_all {:type "boolean"
                                           :description "Remove all interests"}}
                 :required []}}
  (fn [_ctx args]
    {:action "self.remove_interest"
     :interest (get args "interest")
     :remove_all (get args "remove_all")
     :removed_at (.now js/Date)}))
