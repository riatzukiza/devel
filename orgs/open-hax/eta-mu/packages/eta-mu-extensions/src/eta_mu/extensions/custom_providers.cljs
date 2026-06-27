(ns eta-mu.extensions.custom-providers
  "Registers LLM provider configurations for Open Hax remote and local proxies.

  Migrated from: ~/.ημ/agent/extensions/custom-providers.ts"
  (:require-macros [eta-mu.core :as em]))

(defn env-or
  ([] nil)
  ([k] (aget js/process.env k))
  ([k default] (or (env-or k) default)))

(def open-hax-base-url
  (-> (env-or "OPEN_HAX_OPENAI_PROXY_URL"
              (env-or "OPEN_HAX_PROXY_URL" "http://127.0.0.1:8789"))
      (.replace #"/+$/u" "")))

(def open-hax-api-base-url
  (if (.endsWith open-hax-base-url "/v1")
    open-hax-base-url
    (str open-hax-base-url "/v1")))

(def open-hax-token
  (env-or "OPEN_HAX_OPENAI_PROXY_AUTH_TOKEN"
          (env-or "PROXY_AUTH_TOKEN"
                  (env-or "PROXX_AUTH_TOKEN"
                          (env-or "PROXX_API_KEY"
                                  (env-or "OPEN_HAX_AUTH_TOKEN"
                                          "change-me-open-hax-proxy-token"))))))

;; (def open-hax-local-base-url
;;   (-> (env-or "OPEN_HAX_LOCAL_PROXY_URL" "http://127.0.0.1:8789")
;;       (.replace #"/+$/u" "")))

;; (def open-hax-local-api-base-url
;;   (if (.endsWith open-hax-local-base-url "/v1")
;;     open-hax-local-base-url
;;     (str open-hax-local-base-url "/v1")))

;; (def open-hax-local-token
;;   (env-or "OPEN_HAX_LOCAL_PROXY_AUTH_TOKEN"
;;    (env-or "PROXY_AUTH_TOKEN" "change-me-open-hax-proxy-token")))

(defn model [id name & {:keys [reasoning input output context-window max-tokens compat]}]
  #js {:id id
       :name name
       :reasoning (boolean reasoning)
       :input (into-array (or input ["text"]))
       :output (into-array (or output ["text"]))
       :cost #js {:input 0 :output 0 :cacheRead 0 :cacheWrite 0}
       :contextWindow (or context-window 200000)
       :maxTokens (or max-tokens 16384)
       :compat (when compat (clj->js compat))})

(def gpt-models
  #js [(model "gpt-5.5" "GPT 5.5"
              :reasoning true :input ["text" "image"]
              :context-window 1000000 :max-tokens 128000)
       (model "gpt-5.4" "GPT 5.4"
              :reasoning true :input ["text" "image"]
              :context-window 1000000 :max-tokens 128000)
       (model "gpt-5.2" "GPT 5.2"
              :reasoning true
              :input ["text" "image"] :context-window 272000 :max-tokens 128000)
       (model "gpt-5.3-codex" "GPT 5.3 codex"
              :reasoning true
              :input ["text" "image"]
              :context-window 272000 :max-tokens 128000)
       (model "gpt-5.4-mini" "GPT 5.4 Mini"
              :reasoning true
              :input ["text" "image"]
              :context-window 272000 :max-tokens 128000)

       (model "gpt-5.2-codex" "GPT 5.2 codex"
              :reasoning true
              :input ["text" "image"]
              :context-window 272000 :max-tokens 128000)])

(def factory-models
  #js [(model "claude-haiku-4-5-20251001" "Claude Haiku 4.5 (Factory)"
              :input ["text" "image"] :context-window 200000 :max-tokens 8192)
       (model "claude-sonnet-4-5-20250929" "Claude Sonnet 4.5 (Factory)"
              :reasoning true :input ["text" "image"]
              :context-window 200000 :max-tokens 16384
              )
       (model "claude-sonnet-4-6" "Claude Sonnet 4.6 (Factory)"
              :reasoning true :input ["text" "image"]
              :context-window 200000 :max-tokens 16384)
       (model "claude-opus-4-5-20251101" "Claude Opus 4.5 (Factory)"
              :reasoning true :input ["text" "image"]
              :context-window 200000 :max-tokens 32000)
       (model "factory/claude-opus-4-6" "Claude Opus 4.6 (Factory)"
              :reasoning true :input ["text" "image"]
              :context-window 200000 :max-tokens 32000)
       (model "factory/claude-opus-4-6-fast" "Claude Opus 4.6 Fast (Factory)"
              :reasoning true :input ["text" "image"]
              :context-window 200000 :max-tokens 32000)])

(def compat-models
  #js [(model "gemini-3-flash-preview" "Gemini 3 Flash Preview"
              :input ["text" "image"]
              :context-window 1048576 :max-tokens 65536)
       (model "gemini-3-pro-preview" "Gemini 3 Pro Preview"
              :input ["text" "image"] :context-window 1048576 :max-tokens 65536)
       (model "gemini-2.5-flash" "Gemini 2.5 Flash" :input ["text" "image"]
              :context-window 1048576 :max-tokens 65536)
       (model "gemini-2.5-pro" "Gemini 2.5 Pro"
              :input ["text" "image"]
              :context-window 1048576 :max-tokens 65536)
       (model "gemini-3.1-pro-preview" "Gemini 3.1 Pro Preview"
              :input ["text" "image"] :context-window 1048576 :max-tokens 65536)
       (model "DeepSeek-V3.2" "DeepSeek V3.2"
              :input ["text"] :context-window 64000 :max-tokens 8192)
       ;; (model "mimo v2.5 Pro" ""

       ;;        :reasoning true :input ["text" "image"]
       ;;        :context-window 1000000 :max-tokens 128000
       ;;        )
       (model "mimo-v2.5-pro" "Mimo v2.5 Pro (Extended context)"

              :reasoning true :input ["text" "image"]
              :context-window 1000000 :max-tokens 128000
              )
       (model "glm-5v-turbo" "GLM 5V Turbo"
              :reasoning true :input ["text" "image"] :context-window 100000 :max-tokens 131072
              )
       (model "glm-5-turbo" "GLM 5V Turbo"
              :reasoning true :input ["text" "image"] :context-window 100000 :max-tokens 131072)
       (model "glm-5" "GLM 5" :reasoning true
              :input ["text"] :context-window 100000 :max-tokens 128000 ;;:compat {:thinkingFormat "zai"}
              )
       (model "glm-5.1" "GLM 5.1" :reasoning true :input ["text"]
              :context-window 100000 :max-tokens 128000 ;; :compat {:thinkingFormat "zai"}
              )

       (model "kimi-k2.5" "Kimi K2.5" :input ["text" "image"]
              :context-window 262144 :max-tokens 262144)
       (model "kimi-k2.6" "Kimi K2.6" :input ["text" "image"]
              :reasoning true
              :context-window 262144 :max-tokens 262144)
       ])

(defn concat-model-arrays [& arrays]
  (apply #(.concat %1 %2) (js/Array.from (first arrays)) (map js/Array.from (rest arrays))))

(defn register-providers! [pi]
  (let [register-provider (aget pi "registerProvider")]
    (.call register-provider pi "open-hax"
      #js {:baseUrl open-hax-api-base-url
           :apiKey open-hax-token
           :api "openai-responses"
           :models gpt-models})
    (.call register-provider pi "open-hax-responses"
      #js {:baseUrl open-hax-api-base-url
           :apiKey open-hax-token
           :api "openai-responses"
           :models gpt-models})
    (.call register-provider pi "open-hax-completions"
      #js {:baseUrl open-hax-api-base-url
           :apiKey open-hax-token
           :api "openai-completions"
           :models (concat-model-arrays gpt-models factory-models)})
    (.call register-provider pi "open-hax-compat"
      #js {:baseUrl open-hax-api-base-url
           :apiKey open-hax-token
           :api "openai-completions"
           :models compat-models})
    ;; (.call register-provider pi "open-hax-local"
    ;;   #js {:baseUrl open-hax-local-api-base-url
    ;;        :apiKey open-hax-local-token
    ;;        :api "openai-responses"
    ;;        :models gpt-models})
    ;; (.call register-provider pi "open-hax-local-responses"
    ;;   #js {:baseUrl open-hax-local-api-base-url
    ;;        :apiKey open-hax-local-token
    ;;        :api "openai-responses"
    ;;        :models gpt-models})
    ;; (.call register-provider pi "open-hax-local-completions"
    ;;   #js {:baseUrl open-hax-local-api-base-url
    ;;        :apiKey open-hax-local-token
    ;;        :api "openai-completions"
    ;;        :models (concat-model-arrays gpt-models factory-models)})
    ;; (.call register-provider pi "open-hax-local-compat"
    ;;   #js {:baseUrl open-hax-local-api-base-url
    ;;        :apiKey open-hax-local-token
    ;;        :api "openai-completions"
    ;;        :models (js/Array.
    ;;                  (model "gemini-3-flash-preview" "Gemini 3 Flash Preview"
    ;;                         :input ["text" "image"]
    ;;                         :context-window 1048576
    ;;                         :max-tokens 65536)
    ;;                  (model "gemini-3-pro-preview" "Gemini 3 Pro Preview"
    ;;                         :input ["text" "image"]
    ;;                         :context-window 1048576
    ;;                         :max-tokens 65536)
    ;;                  (model "gemini-2.5-flash" "Gemini 2.5 Flash"
    ;;                         :input ["text" "image"]
    ;;                         :context-window 1048576
    ;;                         :max-tokens 65536)
    ;;                  (model "gemini-2.5-pro" "Gemini 2.5 Pro"
    ;;                         :input ["text" "image"] :context-window 1048576 :max-tokens 65536)
    ;;                  (model "gemini-3.1-pro-preview" "Gemini 3.1 Pro Preview"
    ;;                         :input ["text" "image"] :context-window 1048576 :max-tokens 65536)
    ;;                  (model "DeepSeek-V3.2" "DeepSeek V3.2"
    ;;                         :input ["text"] :context-window 64000 :max-tokens 8192)
    ;;                  (model "glm-5" "GLM 5"
    ;;                         :reasoning true
    ;;                         :input ["text"]
    ;;                         :context-window 131072
    ;;                         :max-tokens 16384
    ;;                         :compat {:thinkingFormat "zai"})
    ;;                  (model "glm-5.1" "GLM 5.1"
    ;;                         :reasoning true
    ;;                         :input ["text"]
    ;;                         :context-window 204800
    ;;                         :max-tokens 131072
    ;;                         :compat {:thinkingFormat "zai"})
    ;;                  (model "Kimi-K2.5" "Kimi K2.5"
    ;;                         :input ["text" "image"]
    ;;                         :context-window 262144 :max-tokens 262144))})
    ))

(em/defextension custom-providers
  :name "custom-providers"
  :description "Register Open Hax remote and local LLM providers"
  :init register-providers!)
