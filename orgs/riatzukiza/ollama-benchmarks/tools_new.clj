(ns my.tools
  (:require
    [promethean.ollama.bench-tools :refer [def-tool doc domain tags params impl bench benchcase prompt args final-contains no-extras policy]]))

;; Math tools with templates
(def-tool add
  (doc "Add two integers.")
  (domain :math)
  (tags :math :add :arithmetic)
  (params
    [a :int "Left operand"]
    [b :int "Right operand"])
  (impl [{:keys [a b]}] (+ a b))
  (bench
    (benchcase "add/3+4"
      (prompt "What is 3 plus 4? Use tools if available.")
      (args {:a 3 :b 4})
      (final-contains "7")
      (no-extras))))

(def-tool mul
  (doc "Multiply two integers.")
  (domain :math)
  (tags :math :mul :arithmetic)
  (params
    [a :int "Left operand"]
    [b :int "Right operand"])
  (impl [{:keys [a b]}] (* a b))
  (bench
    (benchcase "mul/7x9"
      (prompt "Compute 7 times 9. Use tools if available.")
      (args {:a 7 :b 9})
      (final-contains "63")
      (no-extras))))

;; Search tools
(def-tool search_web
  (doc "Search the web for information.")
  (domain :search)
  (tags :search :web :information)
  (params
    [query :string "Search query"])
  (impl [{:keys [query]}] 
    (str "Search result for: " query))
  (bench
    (benchcase "search/clojure"
      (prompt "Find information about Clojure programming.")
      (args {:query "Clojure programming language"})
      (policy :best))))

;; Utility tools
(def-tool calculate_age
  (doc "Calculate age from birth year.")
  (domain :general)
  (tags :utility :calculation)
  (params
    [birth_year :int "Birth year (4 digits)"]
    [current_year :int "Current year (4 digits)"])
  (impl [{:keys [birth_year current_year]}] 
    (- current_year birth_year))
  (bench
    (benchcase "age/1990"
      (prompt "Calculate age for someone born in 1990 as of 2025.")
      (args {:birth_year 1990 :current_year 2025})
      (final-contains "35")
      (no-extras))))

(def-tool send_email
  (doc "Send an email message.")
  (domain :communication)
  (tags :email :messaging :communication)
  (params
    [to :string "Recipient email address"]
    [subject :string "Email subject line"]
    [body :string "Email body content"]
    [priority :string "Message priority: low, normal, high"])
  (impl [{:keys [to subject body priority]}] 
    (str "Email sent to " to " with subject '" subject "' and priority " priority))
  (bench
    (benchcase "email/notification"
      (prompt "Send a high priority notification email to admin@example.com about system maintenance.")
      (args {:to "admin@example.com" :subject "System Maintenance" :body "Scheduled maintenance tonight" :priority "high"})
      (policy :best))))

(def-tool query_database
  (doc "Execute a database query and return results.")
  (domain :data)
  (tags :database :query :data-processing)
  (params
    [table :string "Table name to query"]
    [conditions :string "WHERE conditions for query"])
  (impl [{:keys [table conditions]}] 
    (str "Query executed on " table " WHERE " conditions))
  (bench
    (benchcase "db/users"
      (prompt "Query the users table for all active users.")
      (args {:table "users" :conditions "status = 'active'"})
      (policy :best))))

(def-tool generate_code
  (doc "Generate code in specified language.")
  (domain :development)
  (tags :code-generation :programming :development)
  (params
    [language :string "Programming language"]
    [description :string "What the code should do"])
  (impl [{:keys [language description]}] 
    (str "// Generated " language " code for: " description))
  (bench
    (benchcase "code/login"
      (prompt "Generate TypeScript code for a login page component.")
      (args {:language "TypeScript" :description "Login page with username/password fields"})
      (policy :best))))

;; Advanced tools
(def-tool analyze_text
  (doc "Analyze text for sentiment and key topics.")
  (domain :text)
  (tags :text-analysis :nlp :sentiment)
  (params
    [text :string "Text to analyze"])
  (impl [{:keys [text]}] 
    {:sentiment (if (> (count text) 50) "positive" "neutral")
     :topics (clojure.string/split text #" ")
     :word-count (count (clojure.string/split text #" "))})
  (bench
    (benchcase "text/analysis"
      (prompt "Analyze the sentiment of this product review: 'This product is amazing and works perfectly!'")
      (args {:text "This product is amazing and works perfectly!"})
      (final-contains "positive")
      (no-extras))))

(def-tool file_operations
  (doc "Perform file system operations like read, write, list.")
  (domain :io)
  (tags :file :io :filesystem)
  (params
    [operation :string "Operation: read, write, list, delete"]
    [path :string "File or directory path"]
    [content {:type :string :optional true} "Content for write operations"])
  (impl [{:keys [operation path content]}] 
    (case operation
      "read" {:result (str "Content of " path)}
      "write" {:result (str "Wrote content to " path)}
      "list" {:result (str "Files in " path)}
      "delete" {:result (str "Deleted " path)}
      :default {:error "Unknown operation"}))
  (bench
    (benchcase "file/read"
      (prompt "Read the contents of /tmp/test.txt file.")
      (args {:operation "read" :path "/tmp/test.txt"})
      (policy :best))))

;; Powerful tools for complex operations
(def-tool system_command
  (doc "Execute system commands with security restrictions.")
  (domain :system)
  (tags :system :command :shell)
  (params
    [command :string "Command to execute"]
    [args {:type :string :optional true} "Command arguments"]
    [safe-mode {:type :boolean :default true} "Run in safe mode"])
  (impl [{:keys [command args safe-mode]}] 
    (if safe-mode
      {:result (str "Safe execution of: " command " " (clojure.string/join " " args))
       :output "Command would be executed safely"}
      {:result (str "Executing: " command " " (clojure.string/join " " args))
       :warning "Execution in unrestricted mode"}))
  (bench
    (benchcase "system/info"
      (prompt "Get system information safely.")
      (args {:command "uname -a" :safe-mode true})
      (final-contains "Linux")
      (no-extras))))

;; Export tools for easy access
(comment All tools are automatically registered via def-tool macro
   They provide:
   - OpenAI-compatible JSON schemas
   - clojure.spec.alpha validation
   - Prompt templates for benchmarking
   - Comprehensive error handling)
