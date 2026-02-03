;; Simple test ecosystem using clobber DSL
(clobber.macro/defapp "test-app" {:script "node" :args ["-e" "console.log('hello')"]})

(clobber.macro/ecosystem-output)
