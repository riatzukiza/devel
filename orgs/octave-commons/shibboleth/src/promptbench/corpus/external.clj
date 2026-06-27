(ns promptbench.corpus.external
  "External dataset source registrations (Hugging Face + GitHub).

   These sources are intended for research-grade evaluation of:
   - jailbreak / prompt-injection detection
   - multilingual robustness
   - refusal-policy behavior across languages and code-mixed prompts

   Notes:
   - Some HF datasets are `gated=auto`; fetching may require an auth token
     after accepting dataset terms in the browser. Stage 0 fetch supports this
     via the `HF_TOKEN` / `HUGGINGFACE_TOKEN` environment variables.
   - Licenses vary; they are recorded per source.

   Usage:
     (external/register-all!)"
  (:require [promptbench.pipeline.sources :as sources]))

;; ============================================================
;; Source Registration
;; ============================================================

(defn register-sources!
  "Register external dataset sources." 
  []
  ;; --- aya-redteaming ---
  ;; Multilingual adversarial prompts from Cohere.
  ;; 7,419 prompts across 8 languages.
  (sources/register-source! :aya-redteaming
    {:description      "Aya Red Team dataset — multilingual adversarial prompts"
     :urls             ["https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_arb.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_eng.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_fra.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_hin.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_rus.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_spa.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_srp.jsonl"
                        "https://huggingface.co/datasets/CohereForAI/aya_redteaming/resolve/main/aya_tgl.jsonl"]
     :version          "5a16fee03c19d681b4f3527b6a750e1ed4d434c7"
     :license          :apache-2.0
     :format           :jsonl
     :schema           {:prompt :string :language :string :harm_category :string}
     :field-mapping    {:prompt        :text
                        :language      :language
                        :harm_category :harm-category}
     :taxonomy-mapping {:harm_category {}}})

  ;; --- harmbench ---
  (sources/register-source! :harmbench
    {:description      "HarmBench behaviors text dataset — English adversarial behaviors"
     :path             "data/raw/harmbench.csv"
     :url              "https://raw.githubusercontent.com/centerforaisafety/HarmBench/main/data/behavior_datasets/harmbench_behaviors_text_all.csv"
     :version          "1.0.0"
     :license          :mit
     :format           :csv
     :schema           {:Behavior :string :Category :string}
     :field-mapping    {:Behavior :text
                        :Category :harm-category}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- advbench ---
  (sources/register-source! :advbench
    {:description      "AdvBench harmful behaviors dataset — English adversarial goals"
     :path             "data/raw/advbench.csv"
     :url              "https://raw.githubusercontent.com/llm-attacks/llm-attacks/main/data/advbench/harmful_behaviors.csv"
     :version          "1.0.0"
     :license          :mit
     :format           :csv
     :schema           {:goal :string}
     :field-mapping    {:goal :text}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- toxicchat ---
  (sources/register-source! :toxicchat
    {:description      "ToxicChat dataset — toxicity + jailbreaking labels (mostly English)"
     :url              "https://huggingface.co/api/datasets/lmsys/toxic-chat/parquet/toxicchat0124/train/0.parquet"
     :version          "29df8e4dba60e1f4af4b4075c0705c5b313548a8"
     :license          :cc-by-nc-4.0
     :format           :parquet
     :schema           {:user_input :string :toxicity :int :jailbreaking :int}
     :field-mapping    {:user_input :text}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- All-Prompt-Jailbreak (AiActivity) ---
  ;; Meta-collection; we register two high-value sub-corpora explicitly.
  (sources/register-source! :all-prompt-jailbreak-800k
    {:description      "AiActivity/All-Prompt-Jailbreak — 800k prompt (benign/injection/jailbreak) classifier CSV"
     :url              "https://huggingface.co/datasets/AiActivity/All-Prompt-Jailbreak/resolve/main/Catch_the_prompt_injection_or_jailbreak_or_benign/dataset_800k.csv"
     :version          "710322532d52201cb68c454e84ece25565d2a982"
     :license          :mit
     :format           :csv
     :schema           {:prompt :string :type :string}
     :field-mapping    {:prompt :text
                        :type   :harm-category}
     ;; NOTE: values in :type are not yet normalized to our harm taxonomy.
     :taxonomy-mapping {:harm_category {"benign" :benign
                                        "jailbreak" :jailbreak
                                        "prompt_injection" :jailbreak}}})

  (sources/register-source! :all-prompt-jailbreak-chatgpt-jailbreak-prompts
    {:description      "AiActivity/All-Prompt-Jailbreak — ChatGPT Jailbreak Prompts (English CSV)"
     :url              "https://huggingface.co/datasets/AiActivity/All-Prompt-Jailbreak/resolve/main/ChatGPT-Jailbreak-Prompts/dataset.csv"
     :version          "710322532d52201cb68c454e84ece25565d2a982"
     :license          :mit
     :format           :csv
     :field-mapping    {:Prompt :text}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- WildJailbreak (AllenAI) ---
  ;; HF lists this as gated=auto; requires HF_TOKEN after accepting terms.
  (sources/register-source! :wildjailbreak-train
    {:description      "allenai/wildjailbreak — train split (TSV; gated=auto)"
     :url              "https://huggingface.co/datasets/allenai/wildjailbreak/resolve/main/train/train.tsv"
     :version          "5ddc12a7894f842b0619b8e1c7ee496b198af009"
     :license          :odc-by
     :format           :tsv
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  (sources/register-source! :wildjailbreak-eval
    {:description      "allenai/wildjailbreak — eval split (TSV; gated=auto)"
     :url              "https://huggingface.co/datasets/allenai/wildjailbreak/resolve/main/eval/eval.tsv"
     :version          "5ddc12a7894f842b0619b8e1c7ee496b198af009"
     :license          :odc-by
     :format           :tsv
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- XSafety ---
  (sources/register-source! :xsafety
    {:description      "ToxicityPrompts/XSafety — multilingual safety prompts (Parquet)"
     :url              "https://huggingface.co/datasets/ToxicityPrompts/XSafety/resolve/main/data/test-00000-of-00001.parquet"
     :version          "5c3f160be50d5d513ba07ed2400b43847cbcc318"
     :license          :odc-by
     :format           :parquet
     :schema           {:text :string :language :string :category :string}
     :field-mapping    {:text     :text
                        :language :language
                        :category :harm-category}
     :taxonomy-mapping {:harm_category {}}})

  ;; --- Anthropic red-team attempts ---
  (sources/register-source! :hh-rlhf-red-team-attempts
    {:description      "Anthropic/hh-rlhf — red-team-attempts (JSONL.GZ)"
     :url              "https://huggingface.co/datasets/Anthropic/hh-rlhf/resolve/main/red-team-attempts/red_team_attempts.jsonl.gz"
     :version          "09be8c5bbc57cb3887f3a9732ad6aa7ec602a1fa"
     :license          :mit
     :format           :jsonl
     :compression      :gzip
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- BeaverTails ---
  ;; Non-commercial; registered for research usage.
  (sources/register-source! :beavertails-30k-train
    {:description      "PKU-Alignment/BeaverTails — 30k_train (JSONL.GZ; non-commercial)"
     :url              "https://huggingface.co/datasets/PKU-Alignment/BeaverTails/resolve/main/round0/30k/train.jsonl.gz"
     :version          "8401fe609d288129cc684a9b3be6a93e41cfe678"
     :license          :cc-by-nc-4.0
     :format           :jsonl
     :compression      :gzip
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  (sources/register-source! :beavertails-30k-test
    {:description      "PKU-Alignment/BeaverTails — 30k_test (JSONL.GZ; non-commercial)"
     :url              "https://huggingface.co/datasets/PKU-Alignment/BeaverTails/resolve/main/round0/30k/test.jsonl.gz"
     :version          "8401fe609d288129cc684a9b3be6a93e41cfe678"
     :license          :cc-by-nc-4.0
     :format           :jsonl
     :compression      :gzip
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; Optional: full 330k (xz-compressed)
  (sources/register-source! :beavertails-330k-train
    {:description      "PKU-Alignment/BeaverTails — 330k_train (JSONL.XZ; non-commercial; LARGE)"
     :url              "https://huggingface.co/datasets/PKU-Alignment/BeaverTails/resolve/main/round0/330k/train.jsonl.xz"
     :version          "8401fe609d288129cc684a9b3be6a93e41cfe678"
     :license          :cc-by-nc-4.0
     :format           :jsonl
     :compression      :xz
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  (sources/register-source! :beavertails-330k-test
    {:description      "PKU-Alignment/BeaverTails — 330k_test (JSONL.XZ; non-commercial; LARGE)"
     :url              "https://huggingface.co/datasets/PKU-Alignment/BeaverTails/resolve/main/round0/330k/test.jsonl.xz"
     :version          "8401fe609d288129cc684a9b3be6a93e41cfe678"
     :license          :cc-by-nc-4.0
     :format           :jsonl
     :compression      :xz
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- ForbiddenQuestions ---
  (sources/register-source! :forbiddenquestions
    {:description      "walledai/ForbiddenQuestions — adversarial question set (Parquet)"
     :url              "https://huggingface.co/datasets/walledai/ForbiddenQuestions/resolve/main/data/train-00000-of-00001.parquet"
     :version          "46804e8403d125a07e5af5b693b476d60cfa5daa"
     :license          :mit
     :format           :parquet
     :schema           {:prompt :string :category :string}
     :field-mapping    {:prompt   :text
                        :category :harm-category}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- MaliciousInstruct ---
  (sources/register-source! :malicious-instruct
    {:description          "walledai/MaliciousInstruct — direct harmful instruction prompts"
     :url                  "https://huggingface.co/datasets/walledai/MaliciousInstruct/resolve/main/data/train-00000-of-00001.parquet"
     :version              "main"
     :license              :cc-by-sa-4.0
     :format               :parquet
     :schema               {:prompt :string}
     :field-mapping        {:prompt :text}
     :default-language     "en"
     :default-intent-label "adversarial"
     :taxonomy-mapping     {:harm_category {}}})

  ;; --- XSTest ---
  ;; Exaggerated-safety / over-refusal benchmark with explicit safe/unsafe labels.
  (sources/register-source! :xstest
    {:description      "Paul/XSTest — safe/unsafe contrast prompts for over-refusal evaluation"
     :url              "https://huggingface.co/datasets/Paul/XSTest/resolve/main/xstest_prompts.csv"
     :version          "main"
     :license          :cc-by-4.0
     :format           :csv
     :schema           {:id :string :prompt :string :type :string :label :string :focus :string :note :string}
     :field-mapping    {:prompt :text
                        :label  :intent-label
                        :type   :harm-category}
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- OR-Bench (hard benign complement) ---
  ;; We ingest the hard-1k subset as a benign high-risk-looking complement.
  (sources/register-source! :or-bench-hard-1k
    {:description          "bench-llm/or-bench — hard benign prompts for over-refusal evaluation"
     :url                  "https://huggingface.co/datasets/bench-llm/or-bench/resolve/main/or-bench-hard-1k.csv"
     :version              "main"
     :license              :cc-by-4.0
     :format               :csv
     :schema               {:prompt :string :category :string}
     :field-mapping        {:prompt   :text
                            :category :harm-category}
     :default-language     "en"
     :default-intent-label "benign"
     :taxonomy-mapping     {:harm_category {}}})

  ;; --- SocialHarmBench ---
  (sources/register-source! :socialharmbench
    {:description          "psyonp/SocialHarmBench — socially harmful direct requests"
     :url                  "https://huggingface.co/datasets/psyonp/SocialHarmBench/resolve/main/socialharmbench.csv"
     :version              "main"
     :license              :apache-2.0
     :format               :csv
     :schema               {:prompt_id :string :category :string :sub_topic :string :type :string
                            :year :string :ethnicity :string :religion :string :location :string
                            :prompt_text :string}
     :field-mapping        {:prompt_text :text
                            :category    :harm-category}
     :default-language     "en"
     :default-intent-label "adversarial"
     :taxonomy-mapping     {:harm_category {}}})

  ;; --- Qualifire prompt injection benchmark ---
  ;; HF lists this as gated=auto.
  (sources/register-source! :qualifire-prompt-injection-benchmark
    {:description      "qualifire/Qualifire-prompt-injection-benchmark — prompt injection benchmark (CSV; gated=auto)"
     :url              "https://huggingface.co/datasets/qualifire/Qualifire-prompt-injection-benchmark/resolve/main/test.csv"
     :version          "32fbc6fac607512074cbdda77be1b9165c429081"
     :license          :cc-by-nc-4.0
     :format           :csv
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  ;; --- SorryBench ---
  ;; HF lists this as gated=auto and license=other.
  (sources/register-source! :sorrybench-202406
    {:description      "sorry-bench/sorry-bench-202406 — SorryBench prompts + augmentations (CSV; gated=auto)"
     :url              "https://huggingface.co/datasets/sorry-bench/sorry-bench-202406/resolve/main/sorry_bench_202406.csv"
     :version          "b34822276edde97592eda99c0b56d306f8830469"
     :license          :other
     :format           :csv
     :default-language "en"
     :taxonomy-mapping {:harm_category {}}})

  nil)

;; ============================================================
;; Unified Registration
;; ============================================================

(defn register-all!
  "Register all external dataset sources.

   Idempotent guard: skips if :aya-redteaming is already registered." 
  []
  (when-not (sources/get-source :aya-redteaming)
    (register-sources!)))
