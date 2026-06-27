(ns my.opencode.dsl
  (:require-macros [my.opencode.dsl.macros :refer [defplugin hook before-tool after-tool tools extra init]])
  (:require [my.opencode.spec]
            [my.opencode.runtime]))
