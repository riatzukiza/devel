;; Complex ecosystem test using clobber DSL
(clobber.macro/defapp "web-app" {:script "node/server.js" :port 3000 :instances 2})

(clobber.macro/defapp "worker" {:script "node/worker.js" :instances 2 :merge-logs true})

(clobber.macro/defprofile :dev
  (clobber.macro/defapp "web-app" {:env {:NODE_ENV "development"}})
  (clobber.macro/defapp "worker" {:env {:NODE_ENV "development"}}))

(clobber.macro/ecosystem-output)
