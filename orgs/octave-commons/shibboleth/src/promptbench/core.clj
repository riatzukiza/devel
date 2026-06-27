(ns promptbench.core
  "Entry point and CLI dispatch for Shibboleth.

   Serves as the -main entry point for the CLI:
     clj -M -m promptbench.core build --config pipelines/v1.edn --seed 1337
     clj -M -m promptbench.core verify --config pipelines/v1.edn
     clj -M -m promptbench.core coverage --config pipelines/v1.edn --format markdown
     clj -M -m promptbench.core rebuild --config pipelines/v1.edn --from transforms"
  (:require [promptbench.cli :as cli])
  (:gen-class))

(defn -main
  "Main entry point. Dispatches CLI commands via promptbench.cli/run.
   Calls System/exit with the result exit code."
  [& args]
  (let [result (cli/run (vec args))
        code (or (:exit-code result) 0)]
    (shutdown-agents)
    (System/exit code)))
