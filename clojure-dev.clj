#!/usr/bin/env bb

(ns clojure-dev.core
  "Unified Clojure development environment management"
  (:require [babashka.process :as p]
            [babashka.fs :as fs]
            [clojure.string :as str]))

(def config
  {:jvm-repl-port 7888
   :cljs-repl-port 9000
   :mcp-port 7888
   :shadow-port 9000
   :projects
   {:clojure-mcp {:type :jvm :path "clojure-mcp"}
    :promethean {:type :mixed :path "promethean"}
    :opencode-unified {:type :cljs :path "promethean/packages/opencode-unified"}
    :clj-hacks {:type :jvm :path "promethean/packages/clj-hacks"}}})

(defn start-jvm-repl
  "Start JVM REPL for Clojure projects"
  [port]
  (println (str "📦 Starting JVM REPL on port " port "..."))
  (p/process ["clojure" "-M:repl"
              "-J-Djdk.attach.allowAttachSelf"
              "-J-Xmx2g" "-J-Xss2m" "-J-XX:+UseG1GC"]
             {:inherit true}))

(defn start-cljs-repl
  "Start ClojureScript REPL"
  [port]
  (println (str "🌐 Starting ClojureScript REPL on port " port "..."))
  (p/process ["shadow-cljs" "cljs-repl" "--port" (str port)]
             {:inherit true}))

(defn start-mcp-server
  "Start Clojure-MCP server"
  []
  (println "🔌 Starting Clojure-MCP server...")
  (p/process ["clojure" "-X:mcp"]
             {:inherit true}))

(defn start-shadow-watch
  "Start Shadow-CLJS watch for all builds"
  []
  (println "👀 Starting Shadow-CLJS watch...")
  (p/process ["shadow-cljs" "watch"]
             {:inherit true}))

(defn list-projects
  "List all discovered Clojure projects"
  []
  (println "🔍 Discovered Clojure projects:")
  (doseq [[project-name project-info] (:projects config)]
    (println (str "  " project-name " (" (:type project-info) ") - " (:path project-info)))))

(defn build-all
  "Build all ClojureScript projects"
  []
  (println "🏗️  Building all ClojureScript projects...")
  (p/shell "shadow-cljs release"))

(defn clean-all
  "Clean all build artifacts"
  []
  (println "🧹 Cleaning all build artifacts...")
  (p/shell "shadow-cljs clean")
  (doseq [project (vals (:projects config))]
    (when (fs/exists? (str (:path project) "/dist"))
      (fs/delete-tree (str (:path project) "/dist")))))

(defn workspace-status
  "Show status of entire workspace"
  []
  (println "📊 Workspace Status:")
  (println "JVM Projects:")
  (p/shell "find . -name 'deps.edn' -not -path './node_modules/*' | head -10")
  (println "\nClojureScript Projects:")
  (p/shell "find . -name 'shadow-cljs.edn' -not -path './node_modules/*' | head -10")
  (println "\nBabashka Projects:")
  (p/shell "find . -name 'bb.edn' -not -path './node_modules/*' | head -5"))

(defn -main
  "Main entry point for Clojure development environment"
  [& args]
  (let [command (or (first args) "help")]
    (case command
      "repl-jvm" (start-jvm-repl (:jvm-repl-port config))
      "repl-cljs" (start-cljs-repl (:cljs-repl-port config))
      "repl-all" (do
                   (start-jvm-repl (:jvm-repl-port config))
                   (Thread/sleep 2000)
                   (start-cljs-repl (:cljs-repl-port config)))
      "mcp" (start-mcp-server)
      "shadow" (start-shadow-watch)
      "build" (build-all)
      "clean" (clean-all)
      "status" (workspace-status)
      "list" (list-projects)
      "dev-all" (do
                  (println "🚀 Starting full development environment...")
                  (future (start-mcp-server))
                  (Thread/sleep 2000)
                  (future (start-shadow-watch))
                  (Thread/sleep 2000)
                  (start-jvm-repl (:jvm-repl-port config)))
      (do
        (println "🔧 Unified Clojure Development Environment")
        (println "")
        (println "Usage: bb clojure-dev.clj <command>")
        (println "")
        (println "Commands:")
        (println "  repl-jvm    - Start JVM REPL")
        (println "  repl-cljs   - Start ClojureScript REPL") 
        (println "  repl-all    - Start both JVM and CLJS REPLs")
        (println "  mcp         - Start Clojure-MCP server")
        (println "  shadow      - Start Shadow-CLJS watch")
        (println "  build       - Build all ClojureScript projects")
        (println "  clean       - Clean all build artifacts")
        (println "  status      - Show workspace status")
        (println "  list        - List discovered projects")
        (println "  dev-all     - Start full development environment")
        (println "  help        - Show this help message")))))

(when (= *file* (System/getProperty "babashka.file"))
  (apply -main *command-line-args*))