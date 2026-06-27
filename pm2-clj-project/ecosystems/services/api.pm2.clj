(pm2-clj.dsl/app "api"
  {:script "dist/api.js"
   :cwd "."
   :instances 1
   :autorestart true
   :max_restarts 10
   :env {:NODE_ENV "development"}})