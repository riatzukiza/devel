{:tools [
  {:type "function"
   :function {:name "calculate_age"
              :description "Calculate age from birth year"
              :parameters {:type "object"
                         :properties {:birth_year {:type "integer"
                                               :description "Year of birth"}
                                     :current_year {:type "integer"
                                                   :description "Current year"}}
                         :required ["birth_year" "current_year"]}}}
  
  {:type "function"
   :function {:name "get_weather"
              :description "Get current weather for a location"
              :parameters {:type "object"
                         :properties {:location {:type "string"
                                             :description "City name or location"}
                                     :units {:type "string"
                                           :enum ["celsius" "fahrenheit"]
                                           :description "Temperature units"}}
                         :required ["location"]}}}
  
  {:type "function"
   :function {:name "create_file"
              :description "Create a file with specified content"
              :parameters {:type "object"
                         :properties {:filename {:type "string"
                                              :description "Name of the file to create"}
                                     :content {:type "string"
                                               :description "Content to write to file"}
                                     :path {:type "string"
                                           :description "Directory path (optional)"}}
                         :required ["filename" "content"]}}}
  
  {:type "function"
   :function {:name "send_email"
              :description "Send an email to specified recipient"
              :parameters {:type "object"
                         :properties {:to {:type "string"
                                          :description "Email address of recipient"}
                                     :subject {:type "string"
                                               :description "Email subject"}
                                     :body {:type "string"
                                            :description "Email body content"}
                                     :priority {:type "string"
                                               :enum ["low" "normal" "high"]
                                               :description "Email priority"}}
                         :required ["to" "subject" "body"]}}}
  
  {:type "function"
   :function {:name "query_database"
              :description "Query a database with SQL"
              :parameters {:type "object"
                         :properties {:table {:type "string"
                                            :description "Table name to query"}
                                     :columns {:type "array"
                                              :items {:type "string"}
                                              :description "Columns to return"}
                                     :where {:type "string"
                                            :description "WHERE clause conditions"}
                                     :limit {:type "integer"
                                            :description "Maximum number of rows to return"}}
                         :required ["table"]}}}
  
  {:type "function"
   :function {:name "generate_code"
              :description "Generate code in a specific programming language"
              :parameters {:type "object"
                         :properties {:language {:type "string"
                                             :description "Programming language"}
                                     :description {:type "string"
                                                  :description "What the code should do"}
                                     :framework {:type "string"
                                               :description "Framework or library to use (optional)"}}
                         :required ["language" "description"]}}}
  
  {:type "function"
   :function {:name "analyze_sentiment"
              :description "Analyze sentiment of text"
              :parameters {:type "object"
                         :properties {:text {:type "string"
                                           :description "Text to analyze"}
                                     :language {:type "string"
                                               :description "Language code (e.g., 'en', 'es', 'fr')"}}
                         :required ["text"]}}}
  
  {:type "function"
   :function {:name "convert_currency"
              :description "Convert amount from one currency to another"
              :parameters {:type "object"
                         :properties {:amount {:type "number"
                                            :description "Amount to convert"}
                                     :from_currency {:type "string"
                                                   :description "Source currency code (e.g., 'USD')"}
                                     :to_currency {:type "string"
                                                 :description "Target currency code (e.g., 'EUR')"}
                                     :date {:type "string"
                                           :description "Date for exchange rate (optional)"}}
                         :required ["amount" "from_currency" "to_currency"]}}}]}