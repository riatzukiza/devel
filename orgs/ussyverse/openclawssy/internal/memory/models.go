package memory

import "time"

const (
	EventTypeUserMessage     = "user_message"
	EventTypeAssistantOutput = "assistant_output"
	EventTypeToolCall        = "tool_call"
	EventTypeToolResult      = "tool_result"
	EventTypeError           = "error"
	EventTypeSchedulerRun    = "scheduler_run"
	EventTypeDecisionLog     = "decision_log"
	EventTypeCheckpoint      = "checkpoint"
	EventTypeMaintenance     = "maintenance"
)

type Event struct {
	ID        string         `json:"id"`
	Type      string         `json:"type"`
	Text      string         `json:"text,omitempty"`
	SessionID string         `json:"session_id,omitempty"`
	RunID     string         `json:"run_id,omitempty"`
	Timestamp time.Time      `json:"timestamp"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

const (
	MemoryStatusActive    = "active"
	MemoryStatusForgotten = "forgotten"
	MemoryStatusArchived  = "archived"
)

type MemoryItem struct {
	ID         string    `json:"id"`
	AgentID    string    `json:"agent_id"`
	Kind       string    `json:"kind"`
	Title      string    `json:"title"`
	Content    string    `json:"content"`
	Importance int       `json:"importance"`
	Confidence float64   `json:"confidence"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type SearchParams struct {
	Query         string `json:"query,omitempty"`
	Limit         int    `json:"limit,omitempty"`
	MinImportance int    `json:"min_importance,omitempty"`
	Status        string `json:"status,omitempty"`
}

type Health struct {
	DBPath         string `json:"db_path"`
	DBSizeBytes    int64  `json:"db_size_bytes"`
	TotalItems     int    `json:"total_items"`
	ActiveItems    int    `json:"active_items"`
	ForgottenItems int    `json:"forgotten_items"`
	ArchivedItems  int    `json:"archived_items"`
}

type CheckpointRecord struct {
	ID                 string    `json:"id"`
	AgentID            string    `json:"agent_id"`
	CreatedAt          time.Time `json:"created_at"`
	FromTimestamp      time.Time `json:"from_timestamp"`
	ToTimestamp        time.Time `json:"to_timestamp"`
	EventCount         int       `json:"event_count"`
	NewItemCount       int       `json:"new_item_count"`
	UpdatedItemCount   int       `json:"updated_item_count"`
	Summary            string    `json:"summary"`
	CheckpointFilePath string    `json:"checkpoint_file_path"`
}

type MaintenanceReport struct {
	ID                   string         `json:"id"`
	AgentID              string         `json:"agent_id"`
	CreatedAt            time.Time      `json:"created_at"`
	DeduplicatedCount    int            `json:"deduplicated_count"`
	ArchivedStaleCount   int            `json:"archived_stale_count"`
	VerificationCount    int            `json:"verification_count"`
	Compacted            bool           `json:"compacted"`
	Before               Health         `json:"before"`
	After                Health         `json:"after"`
	VerificationItemIDs  []string       `json:"verification_item_ids,omitempty"`
	ArchivedDuplicateIDs []string       `json:"archived_duplicate_ids,omitempty"`
	ArchivedStaleIDs     []string       `json:"archived_stale_ids,omitempty"`
	ReportFilePath       string         `json:"report_file_path"`
	Metadata             map[string]any `json:"metadata,omitempty"`
}

type Options struct {
	Enabled    bool
	BufferSize int
}

type Stats struct {
	DroppedEvents uint64 `json:"dropped_events"`
}
