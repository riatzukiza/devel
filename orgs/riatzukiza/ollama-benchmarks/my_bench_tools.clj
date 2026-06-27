(ns my-bench-tools
  (:require [promethean.ollama.bench-tools :refer [def-tool]]))

;; Simple tool definitions with implementations

(def-tool get_weather
  {:description "Get current weather for a location"
   :parameters {:type :object
                :required [:location]
                :properties {:location {:type :string :description "City name"}}}
   :bench/cases [{:id "nyc"
                  :prompt "What is the temperature in New York?"
                  :expect {:arguments {:location "New York"}}}]}
  [{:keys [location]}
   "New York" "22°C"
   "London" "15°C"
   "Tokyo" "18°C"
   "Unknown city" "22°C"])

(def-tool calculate_age
  {:description "Calculate age from birth year"
   :parameters {:type :object
                :required [:birth_year]
                :properties {:birth_year {:type :integer :description "Year of birth"}
                             :current_year {:type :integer :description "Current year (optional)"}}}
   :bench/cases [{:id "age-1990"
                  :prompt "Calculate age for someone born in 1990"
                  :expect {:arguments {:birth_year 1990}}}]}
  [{:keys [birth_year current_year]}
   (let [cy (or current_year (.getValue (java.time.Year/now)))]
     (- cy birth_year))])

(def-tool send_email
  {:description "Send an email to specified recipient"
   :parameters {:type :object
                :required [:to :subject :body]
                :properties {:to {:type :string :description "Email address of recipient"}
                             :subject {:type :string :description "Email subject"}
                             :body {:type :string :description "Email body content"}
                             :priority {:type :string :enum ["low" "normal" "high"] :description "Email priority"}}}
   :bench/cases [{:id "send-meeting"
                  :prompt "Send email to john@example.com with subject 'Meeting' and body 'See you tomorrow'"
                  :expect {:arguments {:to "john@example.com"
                                       :subject "Meeting"
                                       :body "See you tomorrow"}}}]}
  [{:keys [to subject body priority]}]
  (let [email-id (str "email-" (java.util.UUID/randomUUID))
        result {:id email-id
                :to to
                :subject subject
                :body body
                :priority (or priority "normal")
                :sent true}]
    (println (str "Mock email sent: " result))
    result))

(def-tool query_database
  {:description "Query a database with SQL"
   :parameters {:type :object
                :required [:table]
                :properties {:table {:type :string :description "Table name to query"}
                             :columns {:type :array :items {:type :string} :description "Columns to return"}
                             :where {:type :string :description "WHERE clause conditions"}
                             :limit {:type :integer :description "Maximum number of rows to return"}}}
   :bench/cases [{:id "query-users"
                  :prompt "Query the users table for active users"
                  :expect {:arguments {:table "users" :where "active = true"}}}]}
  [{:keys [table]}])

(def-tool generate_code
  {:description "Generate code in a specific programming language"
   :parameters {:type :object
                :required [:language :description]
                :properties {:language {:type :string :description "Programming language"}
                             :description {:type :string :description "What the code should do"}
                             :framework {:type :string :description "Framework or library to use (optional)"}}}
   :bench/cases [{:id "python-fib"
                  :prompt "Generate Python code to calculate fibonacci numbers"
                  :expect {:arguments {:language "python" :description "calculate fibonacci numbers"}}}]}
  [{:keys [language description framework]}])

(def-tool analyze_sentiment
  {:description "Analyze sentiment of text"
   :parameters {:type :object
                :required [:text]
                :properties {:text {:type :string :description "Text to analyze"
                                    :language {:type :string :description "Language code (e.g., 'en', 'es', 'fr')"}}}
                :bench/cases [{:id "sentiment-positive"
                               :prompt "Analyze sentiment of 'I love this amazing product!'"
                               :expect {:arguments {:text "I love this amazing product!"}}}]}}
  [{:keys [text language]}])

(def-tool convert_currency
  {:description "Convert amount from one currency to another"
   :parameters {:type :object
                :required [:amount :from_currency :to_currency]
                :properties {:amount {:type :number :description "Amount to convert"}
                             :from_currency {:type :string :description "Source currency code (e.g., 'USD')"
                                             :to_currency {:type :string :description "Target currency code (e.g., 'EUR')"}
                                             :date {:type :string :description "Date for exchange rate (optional)"}}}
                :bench/cases [{:id "usd-eur"
                               :prompt "Convert 100 USD to EUR"
                               :expect {:arguments {:amount 100 :from_currency "USD" :to_currency "EUR"}}}]}}
   [{:keys [:amount :from_:currency :to_:currency :date]}])
