(ns promethean.test-runner
  (:require [cljs.test :refer [run-tests]]
            [promethean.adapters.discord-test]
            [promethean.adapters.fs-test]
            [promethean.bridge.cephalon-ts-test]
            [promethean.contracts.markdown-frontmatter-test]
            [promethean.e2e.workflows-test]
            [promethean.eidolon.embed-test]
            [promethean.eidolon.nexus-index-test]
            [promethean.eidolon.nexus-keys-test]
            [promethean.eidolon.similarity-test]
            [promethean.eidolon.vector-store-test]
            [promethean.init-world-test]
            [promethean.llm.openai-test]
            [promethean.main-test]
            [promethean.memory.dedupe-test]
            [promethean.memory.model-test]
            [promethean.memory.store-test]
            [promethean.memory.tags-test]
            [promethean.rpc.envelope-test]
            [promethean.sys.cephalon-test]
            [promethean.sys.effects-test]
            [promethean.sys.eidolon-vectors-test]
            [promethean.sys.memory-test]
            [promethean.sys.route-test]
            [promethean.sys.sentinel-test]))

(defn -main
  []
  (run-tests 'promethean.adapters.discord-test
             'promethean.adapters.fs-test
             'promethean.bridge.cephalon-ts-test
             'promethean.contracts.markdown-frontmatter-test
             'promethean.e2e.workflows-test
             'promethean.eidolon.embed-test
             'promethean.eidolon.nexus-index-test
             'promethean.eidolon.nexus-keys-test
             'promethean.eidolon.similarity-test
             'promethean.eidolon.vector-store-test
             'promethean.init-world-test
             'promethean.llm.openai-test
             'promethean.main-test
             'promethean.memory.dedupe-test
             'promethean.memory.model-test
             'promethean.memory.store-test
             'promethean.memory.tags-test
             'promethean.rpc.envelope-test
             'promethean.sys.cephalon-test
             'promethean.sys.effects-test
             'promethean.sys.eidolon-vectors-test
             'promethean.sys.memory-test
             'promethean.sys.route-test
             'promethean.sys.sentinel-test))

(set! *main-cli-fn* -main)
