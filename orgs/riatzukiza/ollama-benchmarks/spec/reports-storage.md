# Reports & Storage Contract

**Version**: 1.0.0  
**Dependencies**: core.md, benchmarks.md

## Overview

The Reports & Storage Contract defines a crash-proof, append-only storage system that ensures no benchmark progress is lost and enables resumable runs. All UI components read exclusively from these files, with no hidden state.

## Directory Structure

### Canonical Layout
```
reports/
├── run-id-12345-abcde/                    ; Unique run directory
│   ├── events.jsonl                     ; Append-only event log
│   ├── snapshots/                       ; Periodic agent state snapshots
│   │   ├── agent-supervisor.edn
│   │   ├── agent-worker-1.edn
│   │   └── agent-worker-2.edn
│   ├── summary.json                     ; Derived summary statistics
│   ├── tables/                          ; Derived CSV tables
│   │   ├── tool-calling-results.csv
│   │   ├── agent-performance.csv
│   │   └── timing-metrics.csv
│   ├── config.edn                       ; Run configuration snapshot
│   └── run-metadata.json               ; Run metadata and status
```

### Suite Organization
```
reports/
├── tool-calling-suite/
│   ├── run-2024-01-25-001/
│   ├── run-2024-01-25-002/
│   └── latest -> run-2024-01-25-002/    ; Symlink to latest run
├── coding-agent-suite/
│   ├── run-2024-01-25-001/
│   └── latest -> run-2024-01-25-001/
└── interactive-suite/
    ├── run-2024-01-25-001/
    └── latest -> run-2024-01-25-001/
```

## File Formats & Contracts

### 1. Event Log (events.jsonl)

**Format**: JSON Lines (one JSON object per line)  
**Purpose**: Append-only log of all system events  
**Append Order**: Strict chronological order  
**Crash Recovery**: Last processed event ID stored in run metadata

#### Event Structure
```json
{
  "event/id": "uuid-string",
  "event/timestamp-ms": 1706100000000,
  "event/type": "agent/status|tool/execution|supervisor/delegate|benchmark/milestone",
  "event/source": {
    "agent/id": "agent-123",
    "agent/name": "tool-calling-agent"
  },
  "event/data": {
    "status": "working",
    "current-task": "process-customer-data",
    "progress": {"completed": 15, "total": 25}
  },
  "event/context": {
    "run-id": "run-12345-abcde",
    "suite": "tool-calling-suite",
    "thread-id": "thread-789"
  }
}
```

#### Event Types
```clojure
;; Agent lifecycle events
{:agent/lifecycle {:event/subtype :initializing|:working|:sleeping|:blocked|:error|:stopped}}

;; Tool execution events
{:tool/execution {:event/subtype :requested|:started|:completed|:failed
                  :tool/name "load-customer-data"
                  :tool/call-id "call-456"
                  :duration-ms 1500}}

;; Supervisor events
{:supervisor/delegate {:task-id "task-789"
                       :from "supervisor"
                       :to "agent-123"
                       :task-type "data-analysis"}}

;; Benchmark events
{:benchmark/milestone {:milestone :suite-started|:suite-completed|:test-started|:test-completed
                       :test-id "test-tool-choice-001"
                       :result {:status :passed|:failed|:timeout}}}
```

### 2. Agent State Snapshots (snapshots/*.edn)

**Format**: Clojure EDN  
**Frequency**: Every 30 seconds or on significant state change  
**Retention**: Keep last 10 snapshots per agent

#### Snapshot Structure
```clojure
{:snapshot/timestamp-ms 1706100000000
 :snapshot/sequence 42
 :agent/id "agent-123"
 :agent/name "tool-calling-agent"
 :agent/status :working
 :agent/state
   {:current-tasks [{:task/id "task-789"
                     :task/type "data-analysis"
                     :task/progress 0.6
                     :task/started-ms 1706099800000}]
    :completed-tasks [{:task/id "task-456" :completed-ms 1706099700000}]
    :resource-usage {:cpu-percent 45.2 :memory-mb 256 :tokens-used 1500}
    :metrics {:tasks-completed 12 :tasks-failed 1 :average-duration-ms 2000}}
 :conversation/history
   [{:message/id "msg-001"
     :message/from "supervisor"
     :message/timestamp-ms 1706099750000
     :message/content {:type :task-delegation :task-id "task-789"}}]}
```

### 3. Run Summary (summary.json)

**Format**: JSON  
**Purpose**: High-level summary for UI dashboard  
**Update Frequency**: After each test completion

#### Summary Structure
```json
{
  "run/id": "run-12345-abcde",
  "run/timestamp-ms": 1706100000000,
  "run/status": "running|completed|failed|cancelled",
  "run/suite": "tool-calling-suite",
  "run/duration-ms": 120000,
  "run/configuration": {
    "ollama/model": "llama2:7b",
    "test-count": 50,
    "parallelism": 3
  },
  "run/summary": {
    "tests/completed": 25,
    "tests/failed": 2,
    "tests/passed": 23,
    "agents/active": 3,
    "tools/executed": 127,
    "events/processed": 850
  },
  "run/performance": {
    "average-test-duration-ms": 2400,
    "token-usage-total": 15000,
    "cpu-usage-average": 35.2,
    "memory-usage-peak-mb": 512
  }
}
```

### 4. Derived Tables (tables/*.csv)

**Format**: CSV with standardized header row  
**Purpose**: Easy import into analysis tools  
**Update Strategy**: Append-only, regenerated on run completion

#### Tool-Calling Results Table
```csv
timestamp_ms,test_id,agent_id,tool_name,choice_policy,selected_tool,expected_tool,result,score_ms,token_usage
1706100000000,test-choice-001,agent-123,tool-set-alpha,first,load_data,load_data,correct,1500,45
1706100020000,test-choice-002,agent-123,tool-set-beta,best,analyze_data,process_data,incorrect,1800,52
```

#### Agent Performance Table
```csv
timestamp_ms,agent_id,status,task_count,completed_count,failed_count,avg_duration_ms,cpu_usage,memory_usage,tokens_used
1706100000000,agent-123,working,25,23,2,2100,45.2,256,1500
1706100300000,agent-456,sleeping,10,10,0,1800,12.1,128,800
```

#### Timing Metrics Table
```csv
timestamp_ms,metric_type,agent_id,test_id,tool_name,value_ms
1706100000000,tool-execution,agent-123,test-001,load_data,1500
1706100000000,agent-thinking,agent-123,test-001,,800
1706100000000,total-test,agent-123,test-001,,2300
```

## Crash Recovery Protocol

### 1. Run Detection on Startup
```clojure
(defn detect-incomplete-runs []
  (->> (list-runs)
       (filter #(= (:run/status %) :running))
       (filter #(> (- (System/currentTimeMillis)
                     (:run/timestamp-ms %))
                   (* 30 60 1000))) ; Runs older than 30 mins
       (map :run/id)))
```

### 2. Run Resumption
```clojure
(defn resume-run! [run-id]
  (let [run-dir (get-run-dir run-id)
        metadata (read-json (str run-dir "/run-metadata.json"))
        last-event-id (:last-processed-event-id metadata)
        events (read-events-since run-dir last-event-id)]
    ;; Restore agent states from latest snapshots
    (restore-agent-snapshots! run-dir)
    ;; Replay events to rebuild current state
    (replay-events! events)
    ;; Continue execution
    (continue-execution!)))
```

### 3. State Consistency Validation
```clojure
(defn validate-run-consistency! [run-id]
  (let [run-dir (get-run-dir run-id)
        summary (read-json (str run-dir "/summary.json"))
        events (read-all-events run-dir)
        snapshots (list-snapshots run-dir)]
    ;; Validate event sequence integrity
    (validate-event-sequence! events)
    ;; Validate snapshot consistency with events
    (validate-snapshot-consistency! snapshots events)
    ;; Validate summary calculations
    (validate-summary-consistency! summary events)))
```

## UI Data Access Contracts

### Read-Only Access Patterns
```clojure
;; UI components only read from files
(defn get-run-summary [run-id]
  (read-json (str (get-run-dir run-id) "/summary.json")))

(defn get-agent-performance [run-id]
  (read-csv (str (get-run-dir run-id) "/tables/agent-performance.csv")))

(defn get-tool-calling-results [run-id]
  (read-csv (str (get-run-dir run-id) "/tables/tool-calling-results.csv")))

(defn get-real-time-events [run-id last-event-id]
  (read-events-since (get-run-dir run-id) last-event-id))
```

### WebSocket Streaming
```javascript
// UI subscribes to real-time updates via WebSocket
const ws = new WebSocket(`ws://localhost:8080/events/${run-id}`);
ws.onmessage = (event) => {
  const newEvent = JSON.parse(event.data);
  updateUIWithEvent(newEvent);
};
```

## Interactive Session Storage

### Chat History Persistence
```clojure
;; Interactive agent conversations stored as events
{:event/type :agent/communication
 :event/source {:agent/id "interactive-agent-123"}
 :event/data
   {:message/from "user"
    :message/type "chat"
    :message/content "Help me analyze this dataset"
    :message/session-id "session-456"}}
```

### Session State
```clojure
;; Session metadata in run-metadata.json
{:run/interactive-session
   {:session/id "session-456"
    :session/started-ms 1706100000000
    :session/agent-id "interactive-agent-123"
    :session/message-count 25
    :session/active-tools [:data-analyzer :visualizer]}}
```

## Storage Optimization

### Event Log Rotation
```clojure
;; Rotate event logs after 100MB or 100k events
(defn rotate-event-log! [run-id]
  (let [log-file (str (get-run-dir run-id) "/events.jsonl")
        archive-file (str (get-run-dir run-id) "/events-" 
                          (System/currentTimeMillis) ".jsonl")]
    (when (> (file-size log-file) (* 100 1024 1024))
      (move-file log-file archive-file)
      (create-new-event-log! log-file))))
```

### Snapshot Compression
```clojure
;; Compress old snapshots to save space
(defn compress-old-snapshots! [run-id]
  (let [snapshots (list-snapshots run-dir)
        old-snapshots (filter #(> (- (System/currentTimeMillis)
                                     (:snapshot/timestamp-ms %))
                                  (* 60 60 1000)) ; Older than 1 hour
                             snapshots)]
    (doseq [snapshot old-snapshots]
      (compress-file (:snapshot/path snapshot)))))
```

## Monitoring & Health Checks

### Storage Health Metrics
```clojure
(defn storage-health-check [run-id]
  {:disk-usage-mb (calculate-disk-usage (get-run-dir run-id))
   :event-log-size-mb (file-size (str (get-run-dir run-id) "/events.jsonl"))
   :snapshot-count (count (list-snapshots (get-run-dir run-id)))
   :last-event-age-ms (- (System/currentTimeMillis)
                         (get-last-event-timestamp run-id))
   :corruption-check (validate-event-log-integrity run-id)})
```

## Retention Policy

### Default Retention Rules
```clojure
{:retention/policy
 {:events {:keep-days 30                ; Keep events for 30 days
           :archive-after-days 7        ; Archive to compressed format
           :delete-after-days 90}        ; Permanently delete
  :snapshots {:keep-count 10            ; Keep last 10 snapshots
              :compress-after-hours 2    ; Compress snapshots older than 2 hours
              :delete-after-days 30}     ; Delete old snapshots
  :tables {:keep-days 90                ; Keep derived tables longer
           :regenerate-on-demand true}}} ; Can regenerate from events
```

## Version Compatibility

### Storage Format Versioning
```clojure
;; run-metadata.json includes format version
{:run/storage-format-version "1.0"
 :run/created-with-version "0.1.0"
 :run/migration-history [{:from "0.9.0" :to "1.0.0" :timestamp-ms 1706100000000}]}
```

### Migration Strategy
```clojure
(defn migrate-storage-format! [run-id target-version]
  (let [current-version (get-storage-version run-id)]
    (when (not= current-version target-version)
      (apply-migration-steps! run-id current-version target-version)
      (update-storage-version! run-id target-version))))