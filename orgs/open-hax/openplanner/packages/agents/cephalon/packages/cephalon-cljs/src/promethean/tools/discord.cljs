(ns promethean.tools.discord
  (:require-macros [promethean.tools.def-tool :refer [def-tool]]))

(def-tool discord-update-status-text
  {:description "Update the bot's Discord status/activity text."
   :inputSchema {:type "object"
                 :properties {:status_text {:type "string"
                                            :description "Status text to display"}
                              :activity_type {:type "string"
                                              :description "Type of activity: PLAYING, WATCHING, LISTENING, STREAMING"
                                              :enum ["PLAYING" "WATCHING" "LISTENING" "STREAMING"]}}
                 :required ["status_text"]}}
  (fn [_ctx args]
    {:action "discord.update_status_text"
     :status_text (get args "status_text")
     :activity_type (get args "activity_type")
     :updated_at (.now js/Date)}))

(def-tool discord-update-profile
  {:description "Update the bot's Discord profile (username, avatar, display name)."
   :inputSchema {:type "object"
                 :properties {:username {:type "string"
                                         :description "New username to set"}
                              :avatar_url {:type "string"
                                           :description "URL to new avatar image"}
                              :display_name {:type "string"
                                             :description "New display name"}}
                 :required []}}
  (fn [_ctx args]
    {:action "discord.update_profile"
     :changes {:username (get args "username")
               :avatar_url (get args "avatar_url")
               :display_name (get args "display_name")}
     :updated_at (.now js/Date)}))
