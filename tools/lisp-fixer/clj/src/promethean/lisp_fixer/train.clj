(ns promethean.lisp-fixer.train
(:require
[clojure.string :as str]
[clojure.tools.cli :refer [parse-opts]]
[babashka.fs :as fs]
[libpython-clj2.python :as py]))

;; --- CLI ---------------------------------------------------------------------

(def cli-opts
[["-m" "--model MODEL" "HF model id"
:default "Qwen/Qwen2.5-4B"]
["-t" "--train PATH" "train.jsonl" :required true]
["-v" "--val PATH"   "val.jsonl"   :required true]
["-o" "--out DIR"    "output dir"  :required true]
["-l" "--seq-len N"  "sequence length" :default 12288 :parse-fn parse-long]
["-r" "--lora-r N"   "LoRA rank"       :default 16    :parse-fn parse-long]
["-a" "--lora-alpha N" "LoRA alpha"    :default 32    :parse-fn parse-long]
["-d" "--lora-dropout F" "LoRA dropout":default 0.05  :parse-fn #(Double/parseDouble %)]
["-h" "--help"]])

(defn usage [summary]
(str "Lisp-Fixer QLoRA trainer (libpython-clj2)\n\n"
"Options:\n" summary "\n"))

;; --- Python imports ----------------------------------------------------------

(defn py-imports! []
(py/initialize!)
(def torch          (py/import-module "torch"))
(def datasets       (py/import-module "datasets"))
(def transformers   (py/import-module "transformers"))
(def peft           (py/import-module "peft"))
(def bnb            (py/import-module "bitsandbytes"))
(def AutoTok        (py/get-attr transformers "AutoTokenizer"))
(def AutoLM         (py/get-attr transformers "AutoModelForCausalLM"))
(def Trainer        (py/get-attr transformers "Trainer"))
(def TrainArgs      (py/get-attr transformers "TrainingArguments"))
(def LoraConfig     (py/get-attr peft "LoraConfig"))
(def get-peft-model (py/get-attr peft "get_peft_model"))
(def prep-kbit      (py/get-attr peft "prepare_model_for_kbit_training"))
(def linear4bitcfg  (py/get-attr bnb.nn "Linear4bitLt"))
nil)

;; map a single JSONL sample into (input_ids, labels)
(defn ^:private make-mapper [tokenizer seq-len]
(py/pyfn
"map_record" [rec]
(let [pt (py/get-item rec "prompt_type")
prompt (if (= pt "fim")
(str "<FIM_PREFIX>" (py/get-item rec "prefix")
"<FIM_MIDDLE>" (py/get-item rec "middle")
"<FIM_SUFFIX>" (py/get-item rec "suffix"))
(str "<DIFF>" (py/get-item rec "broken") "\n"))
target (if (= pt "fim")
(py/get-item rec "middle")
(py/get-item rec "fixed"))
tk-inp (py/call-attr tokenizer "encode" prompt
:truncation true :max_length seq-len)
tk-lbl (py/call-attr tokenizer "encode" target
:truncation true :max_length seq-len)]
(py/kw-map {"input_ids" tk-inp "labels" tk-lbl}))))

(defn train! [{:keys [model train val out seq-len lora-r lora-alpha lora-dropout]}]
(py-imports!)

;; tokenizer & model (4-bit NF4)
(let [bnb-conf (py/call-attr linear4bitcfg "make_config"
:dtype (py/get-attr torch "bfloat16")
:compute_dtype (py/get-attr torch "bfloat16")
:quant_type "nf4")
tokenizer (py/call-attr AutoTok "from_pretrained" model :use_fast true)
_ (py/set-attr! tokenizer "pad_token" (py/get-attr tokenizer "eos_token"))
base-model (py/call-attr AutoLM "from_pretrained" model
:device_map "auto"
:load_in_4bit true
:quantization_config bnb-conf)
_ (py/setv base-model (py/call-attr prep-kbit "__call__" base-model))
        lcfg (py/call-attr LoraConfig "__call__"
                           :r lora-r :lora_alpha lora-alpha :lora_dropout lora-dropout
                           :target_modules ["q_proj" "k_proj" "v_proj" "o_proj"
                                            "gate_proj" "up_proj" "down_proj"])
        model* (py/call-attr get-peft-model "__call__" base-model lcfg)

       ;; datasets
        ds-tr (py/call-attr datasets "load_dataset" "json"
                            :data_files train :split "train")
        ds-va (py/call-attr datasets "load_dataset" "json"
                            :data_files val   :split "train")
        mapper (make-mapper tokenizer seq-len)
        ds-tr* (py/call-attr ds-tr "map" mapper :remove_columns
                             ["repo" "dialect" "path" "prompt_type"
                              "broken" "fixed" "prefix" "middle" "suffix" "labels"])
        ds-va* (py/call-attr ds-va "map" mapper :remove_columns
                             ["repo" "dialect" "path" "prompt_type"
                              "broken" "fixed" "prefix" "middle" "suffix" "labels"])

       args (py/call-attr TrainArgs "__call__"
                           :output_dir out
                           :per_device_train_batch_size 1
                           :gradient_accumulation_steps 64
                           :learning_rate 1e-4
                           :num_train_epochs 1
                           :lr_scheduler_type "cosine"
                           :warmup_ratio 0.03
                           :logging_steps 50
                           :evaluation_strategy "steps"
                           :eval_steps 500
                           :save_steps 500
                           :bf16 true
                           :gradient_checkpointing true
                           :optim "paged_adamw_8bit"
                           :max_grad_norm 1.0)

       ;; simple collator in Python (pads to max)
        collate (py/run-simple-string
                 "def _collate(batch, pad_id):
    maxl = max(len(x['input_ids']) + len(x['labels']) for x in batch)
    def pad(x): return x + [pad_id] * (maxl - len(x))
    inputs = [pad(x['input_ids']) for x in batch]
    labels = [pad(x['labels']) for x in batch]
    import torch
    return {'input_ids': torch.tensor(inputs), 'labels': torch.tensor(labels)}")
        py-collate (py/get-global "_collate")

       trainer (py/call-attr Trainer "__call__"
                              :model model*
                              :args args
                              :train_dataset ds-tr*
                              :eval_dataset ds-va*
                              :data_collator (py/partial py-collate
                                                         (py/get-attr tokenizer "pad_token_id")))]
    (py/call-attr trainer "train")
    (py/call-attr model* "save_pretrained" out)
    (py/call-attr tokenizer "save_pretrained" out)))

(defn -main [& argv]
  (let [{:keys [options summary errors]} (parse-opts argv cli-opts)]
    (cond
      (:help options) (do (println (usage summary)) (System/exit 0))
      errors          (do (binding [*out* *err*] (doseq [e errors] (println e)))
                          (System/exit 1)))
    (fs/create-dirs (:out options))
    (train! options)))