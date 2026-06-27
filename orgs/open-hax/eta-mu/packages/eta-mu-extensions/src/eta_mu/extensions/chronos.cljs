(ns eta-mu.extensions.chronos
  "Time tracking tool for contracting work via local Chronos API.

  Migrated from: ~/.ημ/agent/extensions/chronos.ts"
  (:require-macros [eta-mu.core :as em])
  (:require [clojure.string :as str]))

(def CHRONOS-URL (or (aget js/process.env "CHRONOS_URL") "http://localhost:5199"))

(defn chronos-api
  ([endpoint] (chronos-api endpoint nil))
  ([endpoint opts]
   (let [url (str CHRONOS-URL "/api" endpoint)
         defaults #js {:headers #js {"Content-Type" "application/json"}}
         merged (if opts (js/Object.assign #js {} defaults opts) defaults)]
     (-> (js/fetch url merged)
         (.then (fn [resp]
                  (if (.-ok resp)
                    (.json resp)
                    (js/Promise.reject (js/Error. (str "Chronos API error: " (.-status resp)))))))))))

(defn fmt-duration [secs]
  (let [h (Math/floor (/ secs 3600))
        m (Math/floor (/ (mod secs 3600) 60))]
    (str h "h " m "m")))

(defn make-text-result [text]
  #js {:content #js [#js {:type "text" :text text}]})

(defn make-result [text details]
  #js {:content #js [#js {:type "text" :text text}]
       :details details})

(defn handle-status []
  (-> (chronos-api "/agent/status")
      (.then (fn [status]
               (let [active (js/Array.from (aget status "active"))
                     recent (js/Array.from (aget status "recent"))
                     projects (js/Array.from (aget status "projects"))
                     parts ["## Chronos Time Tracker Status\n"]
                     parts (if (pos? (count active))
                             (into parts (cons "### Active Sessions"
                                               (map (fn [s]
                                                      (let [duration (Math/floor (/ (- (js/Date.now) (js/Date.parse (aget s "start_time"))) 1000))
                                                            h (Math/floor (/ duration 3600))
                                                            m (Math/floor (/ (mod duration 3600) 60))]
                                                        (str "- **" (aget s "project") "**: " (or (aget s "task") "No task") "\n  - Duration: " h "h " m "m")))
                                                    active)))
                             (conj parts "No active sessions.\n"))
                     parts (conj parts "")
                     parts (if (pos? (count recent))
                             (into parts
                                   (concat
                                     ["### Recent Sessions"]
                                     (map (fn [s]
                                            (str "- " (aget s "project") ": " (or (aget s "task") "No task")
                                                 " (" (fmt-duration (or (aget s "duration_seconds") 0)) ")"))
                                          (take 5 recent))))
                             parts)
                     parts (conj parts "\n### Projects")
                     parts (into parts (map (fn [p]
                                              (str "- " (aget p "name")
                                                   (if-let [c (aget p "client")] (str " (" c ")") "")))
                                            projects))
                     text (str/join "\n" parts)]
                 (make-result text #js {:status status}))))))

(defn handle-start [params]
  (if-not (aget params "project")
    (make-text-result "Error: project parameter required for start action.")
    (-> (chronos-api "/sessions/start"
                     #js {:method "POST"
                          :body (js/JSON.stringify #js {:project_name (aget params "project")
                                                        :task (aget params "task")
                                                        :tags (aget params "tags")
                                                        :client (aget params "client")
                                                        :hourly_rate (aget params "hourly_rate")})})
        (.then (fn [result]
                 (make-text-result (str "Started session #" (aget result "id") " on **\""
                                        (or (aget result "project_name") (aget params "project"))
                                        "\"**"
                                        (if (aget params "task") (str ": " (aget params "task")) "")
                                        "\n\nView at: http://localhost:5199")))))))

(defn handle-stop []
  (-> (chronos-api "/sessions/stop-all" #js {:method "POST"})
      (.then (fn [result]
               (if (zero? (aget result "stopped"))
                 (make-text-result "No active sessions to stop.")
                 (let [sessions (->> (aget result "sessions")
                                     (js/Array.from)
                                     (map (fn [s] (str "\"" (aget s "project_name") "\" (" (fmt-duration (aget s "duration_seconds")) ")")))
                                     (str/join ", "))]
                   (make-text-result (str "Stopped " (aget result "stopped") " session(s): " sessions "\n\nTotal time logged."))))))))

(defn handle-list [params]
  (let [limit (or (aget params "limit") 10)]
    (-> (chronos-api (str "/sessions?limit=" limit))
        (.then (fn [sessions]
                 (if (zero? (alength sessions))
                   (make-text-result "No sessions found.")
                   (let [lines (into ["## Recent Sessions\n"]
                                     (map (fn [s]
                                            (let [secs (or (aget s "duration_seconds") 0)
                                                  end-time (if-let [et (aget s "end_time")]
                                                             (.toLocaleDateString (js/Date. et))
                                                             "active")]
                                              (str "- **" (aget s "project_name") "**: " (or (aget s "task") "No task") "\n  - Duration: " (fmt-duration secs) "\n  - Date: " end-time)))
                                          (js/Array.from sessions)))]
                     (make-result (str/join "\n" lines) #js {:sessions sessions}))))))))

(defn handle-project-create [params]
  (if-not (aget params "project")
    (make-text-result "Error: project parameter required.")
    (-> (chronos-api "/projects"
                     #js {:method "POST"
                          :body (js/JSON.stringify #js {:name (aget params "project")
                                                        :client (aget params "client")
                                                        :hourly_rate (aget params "hourly_rate")})})
        (.then (fn [result]
                 (make-text-result (str "Created project **\"" (aget result "name") "\"** (id: " (aget result "id") ")"
                                        (if-let [c (aget params "client")] (str " for client \"" c "\"") "")
                                        (if-let [r (aget params "hourly_rate")] (str " at $" r "/hr") ""))))))))

(defn handle-project-list []
  (-> (chronos-api "/projects")
      (.then (fn [projects]
               (if (zero? (alength projects))
                 (make-text-result "No projects found.")
                 (let [lines (into ["## Projects\n"]
                                   (map (fn [p]
                                          (cond-> (str "- **" (aget p "name") "**")
                                            (aget p "client") (str " (" (aget p "client") ")")
                                            (aget p "hourly_rate") (str "\n  - Rate: $" (aget p "hourly_rate") "/hr")))
                                        (js/Array.from projects)))]
                   (make-result (str/join "\n" lines) #js {:projects projects})))))))

(em/defextension chronos
  :name "chronos"
  :description "Time tracker for contracting work. Start/stop sessions and track time across projects."

  (em/tool "chronos"
    :label "Time Tracker"
    :description "Time tracker for contracting work. Start/stop sessions and track time across projects.

Actions:
- status: Check active sessions and recent activity (DEFAULT)
- start: Start a new session (requires project, optional task and tags)
- stop: Stop the currently active session
- list: List recent sessions
- project_create: Create a new project
- project_list: List all projects"
    :parameters {:action {:type "string"
                          :enum ["status" "start" "stop" "list" "project_create" "project_list"]
                          :description "Action to perform"
                          :default "status"}
                 :project {:type "string" :description "Project name" :optional true}
                 :task {:type "string" :description "Task description" :optional true}
                 :tags {:type "array" :items {:type "string"} :description "Tags for the session" :optional true}
                 :limit {:type "number" :description "Number of sessions to list" :optional true}
                 :client {:type "string" :description "Client name" :optional true}
                 :hourly_rate {:type "number" :description "Hourly rate" :optional true}}
    :execute (fn [_tcid params _signal _onUpdate ctx]
               (let [action (aget params "action")]
                 (condp = action
                   "status" (handle-status)
                   "start" (handle-start params)
                   "stop" (handle-stop)
                   "list" (handle-list params)
                   "project_create" (handle-project-create params)
                   "project_list" (handle-project-list)
                   (make-text-result (str "Unknown action: " action)))))))
