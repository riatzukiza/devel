(ns axxium.db
  "PostgreSQL database layer for Axxium.
   Uses pg via JS interop — following knoxx/proxx patterns."
  (:require [axxium.config :as cfg]
            ["pg" :refer [Pool]]))

(def ^:private pg #js {:Pool Pool})

(defonce pool
  (delay
    (let [pool-config #js {:connectionString (cfg/db-url)
                           :max 20
                           :idleTimeoutMillis 30000
                           :connectionTimeoutMillis 2000}]
      (new Pool pool-config))))

(defn query
  "Execute a parameterized SQL query.
   Returns a promise of rows."
  [sql params]
  (.query @pool sql (clj->js params)))

(defn query-one
  "Execute query and return first row or nil."
  [sql params]
  (-> (query sql params)
      (.then (fn [result]
               (let [rows (js->clj (.-rows result) :keywordize-keys true)]
                 (first rows))))))

(defn query-all
  "Execute query and return all rows."
  [sql params]
  (-> (query sql params)
      (.then (fn [result]
               (js->clj (.-rows result) :keywordize-keys true)))))

(defn init-schema!
  "Initialize database schema. Idempotent."
  []
  (let [sql "CREATE TABLE IF NOT EXISTS entities (
               id TEXT PRIMARY KEY,
               kind TEXT NOT NULL,
               email TEXT UNIQUE,
               display_name TEXT,
               created_at TIMESTAMPTZ DEFAULT NOW()
             );
             
             CREATE TABLE IF NOT EXISTS actors (
               id TEXT PRIMARY KEY,
               entity_id TEXT NOT NULL REFERENCES entities(id),
               email TEXT,
               display_name TEXT,
               password_hash TEXT,
               capabilities JSONB DEFAULT '[]',
               roles JSONB DEFAULT '[]',
               status TEXT DEFAULT 'active',
               created_at TIMESTAMPTZ DEFAULT NOW(),
               updated_at TIMESTAMPTZ DEFAULT NOW()
             );
             
             CREATE TABLE IF NOT EXISTS sessions (
               id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
               actor_id TEXT NOT NULL REFERENCES actors(id),
               token_hash TEXT NOT NULL,
               expires_at TIMESTAMPTZ NOT NULL,
               created_at TIMESTAMPTZ DEFAULT NOW()
             );
             
             CREATE TABLE IF NOT EXISTS oauth_clients (
               id TEXT PRIMARY KEY,
               secret_hash TEXT NOT NULL,
               name TEXT NOT NULL,
               redirect_uris JSONB DEFAULT '[]',
               grant_types JSONB DEFAULT '[]',
               scopes JSONB DEFAULT '[]',
               created_at TIMESTAMPTZ DEFAULT NOW()
             );
             
             CREATE INDEX IF NOT EXISTS idx_actors_email ON actors(email);
             CREATE INDEX IF NOT EXISTS idx_sessions_actor ON sessions(actor_id);
             CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);"]
    (.query @pool sql #js [])))
