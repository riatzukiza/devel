(pm2-clj.dsl/compose
 {:apps [{:name "api"
          :script "dist/api.js"
          :cwd "."
          :instances 1
          :autorestart true
          :max_restarts 10
          :env {:NODE_ENV "development"}}
         {:name "worker"
          :script "dist/worker.js"
          :cwd "."
          :instances 1
          :autorestart true
          :max_restarts 10
          :env {:NODE_ENV "development"}}]}
 {:profiles {:dev {:apps [{:name "api" :watch true}
                         {:name "worker" :watch true}]}
             :test {:apps [{:name "api" :env {:NODE_ENV "test"}}
                          {:name "worker" :env {:NODE_ENV "test"}}]}
             :prod {:apps [{:name "api"
                           :instances "max"
                           :exec_mode "cluster"
                           :env {:NODE_ENV "production"}}
                          {:name "worker"
                           :instances 2
                           :env {:NODE_ENV "production"}}]}}})
