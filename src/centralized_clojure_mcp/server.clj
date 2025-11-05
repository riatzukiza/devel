(ns centralized-clojure-mcp.server
  "Centralized MCP server for unified Clojure development across all runtimes"
  (:require [clojure-mcp.core :as core]
            [clojure-mcp.main :as main]
            [clojure-mcp.resources :as resources]
            [clojure-mcp.prompts :as prompts]
            [clojure-mcp.tools.eval.tool :as eval-tool]
            [clojure-mcp.tools.unified-read-file.tool :as read-tool]
            [clojure-mcp.tools.directory-tree.tool :as dir-tool]
            [clojure-mcp.tools.grep.tool :as grep-tool]
            [clojure-mcp.tools.glob-files.tool :as glob-tool]
            [clojure-mcp.tools.project.tool :as project-tool]
            [clojure-mcp.tools.think.tool :as think-tool]
            [clojure.java.io :as io]
            [clojure.string :as str]))

;; Runtime-specific configurations
(def runtime-configs
  {:jvm {:description "JVM Clojure Development"
          :paths ["clojure-mcp/src" "promethean/src" "promethean/packages/*/src"]
          :repl-port 7888
          :build-cmd "clojure -M:build"}
   :cljs {:description "ClojureScript Development"
           :paths ["promethean/packages/*/src/cljs" "riatzukiza/openhax/packages/*/src"]
           :repl-port 9000
           :build-cmd "shadow-cljs release"}
   :bb {:description "Babashka Scripting"
         :paths ["promethean/bb/src" "promethean/packages/clj-hacks/src"]
         :repl-port nil
         :build-cmd "bb build"}})

(defn make-runtime-resources
  "Create resources for each Clojure runtime"
  [nrepl-client-atom working-dir]
  (concat
   ;; Standard resources
   (main/make-resources nrepl-client-atom working-dir)
   
   ;; Runtime-specific resources
   (for [[runtime-id config] runtime-configs]
     (resources/create-string-resource
      (str "clojure-runtime://" (name runtime-id))
      (str (name runtime-id) "-runtime-info")
      (:description config)
      "text/plain"
      (str "# " (:description config) "\n\n"
            "## Paths\n```\n" (str/join "\n" (:paths config)) "\n```\n\n"
            "## REPL Port\n" (:repl-port config) "\n\n"
            "## Build Command\n```bash\n" (:build-cmd config) "\n```\n\n")))))

(defn make-runtime-prompts
  "Create prompts for different Clojure development workflows"
  [nrepl-client-atom working-dir]
  (concat
   ;; Standard prompts
   (main/make-prompts nrepl-client-atom working-dir)
   
   ;; Runtime-specific prompts
   [{:name "setup-clojure-project"
     :description "Setup a new Clojure project with proper configuration"
     :arguments [{:name "runtime"
                 :description "Runtime: jvm, cljs, or bb"
                 :required? true}
                {:name "project-name"
                 :description "Name of the project"
                 :required? true}]
     :prompt-fn (fn [_ args callback]
                  (let [runtime (get args "runtime")
                        project-name (get args "project-name")]
                    (callback
                     {:description (str "Setup " runtime " project: " project-name)
                      :messages [{:role :user
                                  :content (str "Please help setup a new " runtime " Clojure project called '" project-name "'. "
                                              "Include:\n"
                                              "- Proper deps.edn or shadow-cljs.edn configuration\n"
                                              "- Directory structure\n"
                                              "- Initial namespace setup\n"
                                              "- Build configuration\n"
                                              "- Testing setup\n"
                                              "- Development workflow instructions")}]})))}
    
    {:name "cross-runtime-build"
     :description "Build project across all Clojure runtimes"
     :arguments [{:name "project-path"
                 :description "Path to project"
                 :required? true}]
     :prompt-fn (fn [_ args callback]
                  (let [project-path (get args "project-path")]
                    (callback
                     {:description "Cross-runtime build strategy"
                      :messages [{:role :user
                                  :content (str "Analyze and provide build instructions for project at: " project-path "\n\n"
                                              "Consider:\n"
                                              "- JVM compilation (clojure -M:build)\n"
                                              "- ClojureScript compilation (shadow-cljs)\n"
                                              "- Babashka script compatibility\n"
                                              "- Dependency management\n"
                                              "- Testing across runtimes\n"
                                              "- Deployment strategies")}]})))}
    
    {:name "runtime-troubleshoot"
     :description "Troubleshoot issues across Clojure runtimes"
     :arguments [{:name "runtime"
                 :description "Runtime: jvm, cljs, or bb"
                 :required? true}
                {:name "issue-description"
                 :description "Description of the issue"
                 :required? true}]
     :prompt-fn (fn [_ args callback]
                  (let [runtime (get args "runtime")
                        issue (get args "issue-description")]
                    (callback
                     {:description (str "Troubleshoot " runtime " issue")
                      :messages [{:role :user
                                  :content (str "Help troubleshoot this " runtime " issue:\n\n" issue "\n\n"
                                              "Consider:\n"
                                              "- Runtime-specific pitfalls\n"
                                              "- Common configuration errors\n"
                                              "- Dependency conflicts\n"
                                              "- Build system issues\n"
                                              "- REPL connectivity problems\n"
                                              "- Classpath issues")}]})))}]))

(defn make-runtime-tools
  "Create tools for unified Clojure development across runtimes"
  [nrepl-client-atom working-directory]
  (concat
   ;; Standard tools
   (main/make-tools nrepl-client-atom working-directory)
   
   ;; Custom runtime management tools
   [{:name "clojure-runtime-info"
     :description "Get information about available Clojure runtimes"
     :inputSchema {:type "object"
                   :properties {:runtime {:type "string"
                                       :description "Runtime: jvm, cljs, bb, or all"
                                       :enum ["jvm" "cljs" "bb" "all"]}}
                   :required ["runtime"]}
     :handler (fn [{:keys [arguments]} callback]
                (let [runtime (get arguments "runtime")
                      info (if (= runtime "all")
                              runtime-configs
                              (get runtime-configs (keyword runtime)))]
                  (callback {:content (str "Clojure Runtime Information:\n\n"
                                         (clojure.pprint/pprint info))
                           :isError false})))}
    
    {:name "build-all-runtimes"
     :description "Build project across all configured Clojure runtimes"
     :inputSchema {:type "object"
                   :properties {:project-path {:type "string"
                                           :description "Path to project to build"
                                           :default "."}
                               :runtimes {:type "array"
                                          :description "Runtimes to build"
                                          :items {:type "string" :enum ["jvm" "cljs" "bb"]}
                                          :default ["jvm" "cljs"]}}
                   :required []}
     :handler (fn [{:keys [arguments]} callback]
                (let [project-path (or (get arguments "project-path") ".")
                      runtimes (or (get arguments "runtimes") ["jvm" "cljs"])
                      results (for [runtime runtimes
                                   :let [config (get runtime-configs (keyword runtime))]]
                                {:runtime runtime
                                 :command (str "cd " project-path " && " (:build-cmd config))
                                 :status "ready"})]
                  (callback {:content (str "Build commands prepared:\n\n"
                                         (clojure.pprint/pprint results))
                           :isError false})))}
    
    {:name "start-runtime-repl"
     :description "Start REPL for specific Clojure runtime"
     :inputSchema {:type "object"
                   :properties {:runtime {:type "string"
                                       :description "Runtime: jvm, cljs, or bb"
                                       :enum ["jvm" "cljs" "bb"]}
                               :port {:type "integer"
                                      :description "Port for REPL (optional)"}}
                   :required ["runtime"]}
     :handler (fn [{:keys [arguments]} callback]
                (let [runtime (keyword (get arguments "runtime"))
                      port (or (get arguments "port") (:repl-port (get runtime-configs runtime)))]
                  (if port
                    (callback {:content (str "Starting " runtime " REPL on port " port "\n"
                                           "Command: ./repl.sh " runtime " " port)
                               :isError false})
                    (callback {:content (str "No default port configured for " runtime " runtime)
                               :isError true}))))}
    
    {:name "list-clojure-projects"
     :description "List all Clojure projects in the workspace"
     :inputSchema {:type "object"
                   :properties {:filter {:type "string"
                                       :description "Filter by runtime: jvm, cljs, bb"
                                       :enum ["jvm" "cljs" "bb"]}}
                   :required []}
     :handler (fn [{:keys [arguments]} callback]
                (let [filter (get arguments "filter")
                      projects (cond
                                (= filter "jvm") (clojure.java.shell/sh "find" "." "-name" "deps.edn")
                                (= filter "cljs") (clojure.java.shell/sh "find" "." "-name" "shadow-cljs.edn")
                                (= filter "bb") (clojure.java.shell/sh "find" "." "-name" "bb.edn")
                                :else (clojure.java.shell/sh "find" "." "-name" "*.edn"))
                      result {:projects (str/split-lines (:out projects))
                              :count (count (str/split-lines (:out projects)))}]
                  (callback {:content (str "Clojure projects found:\n\n"
                                         (clojure.pprint/pprint result))
                           :isError false})))}]))

(defn start-centralized-mcp-server
  "Start the centralized Clojure development MCP server"
  [opts]
  (println "🚀 Starting Centralized Clojure MCP Server")
  (println "📦 Supporting JVM, ClojureScript, and Babashka runtimes")
  (core/build-and-start-mcp-server
   opts
   {:make-tools-fn make-runtime-tools
    :make-prompts-fn make-runtime-prompts
    :make-resources-fn make-runtime-resources}))

;; Main entry point for different deployment modes
(defn start-jvm-mcp [opts]
  "Start MCP server optimized for JVM Clojure development"
  (-> opts
      (assoc :runtime :jvm)
      start-centralized-mcp-server))

(defn start-cljs-mcp [opts]
  "Start MCP server optimized for ClojureScript development"
  (-> opts
      (assoc :runtime :cljs)
      start-centralized-mcp-server))

(defn start-unified-mcp [opts]
  "Start MCP server for all Clojure runtimes"
  (-> opts
      (assoc :runtime :unified)
      start-centralized-mcp-server))