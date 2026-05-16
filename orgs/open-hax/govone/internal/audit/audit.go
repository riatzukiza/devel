// Package audit implements GovOne's Merkle-chained audit trail.
//
// DELEGATE-52 hardening: Every interaction, every claim verification, every
// human label is a first-class audit record in a tamper-evident Merkle chain.
//
// This ensures:
//   - Complete provenance for every decision in the pipeline
//   - Tamper detection for the verification chain
//   - Human labels are axiomatic records, not afterthoughts
//   - Critical failures can be traced to their exact interaction point
package audit

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// EventType classifies audit records.
type EventType string

const (
	EventRetrieve       EventType = "retrieve"        // retrieval operation
	EventInspect        EventType = "inspect"          // coherence inspection
	EventLabel          EventType = "label"             // human label event
	EventCriticalFail   EventType = "critical_failure"  // DELEGATE-52 critical failure detected
	EventPipelineRun    EventType = "pipeline_run"      // full pipeline execution
	EventEdgeVerified   EventType = "edge_verified"     // edge promoted to verified
	EventEdgeRejected   EventType = "edge_rejected"     // edge rejected by human
	EventClaimExtracted EventType = "claim_extracted"   // claim extracted from output
	EventClaimScored    EventType = "claim_scored"       // claim coherence scored
)

// Record is a single entry in the Merkle-chained audit log.
type Record struct {
	ID          string          `json:"id"`
	EventType   EventType       `json:"event_type"`
	TenantID    string          `json:"tenant_id"`
	SessionID   string          `json:"session_id,omitempty"`
	Interaction int             `json:"interaction,omitempty"` // interaction number (for DELEGATE-52 tracking)
	Payload     json.RawMessage `json:"payload"`
	PrevHash    string          `json:"prev_hash"` // Merkle chain: hash of previous record
	Hash        string          `json:"hash"`      // hash of this record (including prev_hash)
	Timestamp   time.Time       `json:"timestamp"`
}

// LabelPayload is the payload for human label events.
// Every label is a first-class audit record with full provenance.
type LabelPayload struct {
	EdgeID      string  `json:"edge_id"`      // which edge is being labeled
	LabelType   string  `json:"label_type"`   // "verified", "rejected", "uncertain"
	Confidence  float64 `json:"confidence"`   // annotator confidence [0,1]
	AnnotatorID string  `json:"annotator_id"` // who labeled it
	Reason      string  `json:"reason,omitempty"`
	Evidence    string  `json:"evidence,omitempty"` // supporting evidence
}

// InspectionPayload is the payload for inspection events.
type InspectionPayload struct {
	OutputHash    string  `json:"output_hash"`
	OverallScore  float64 `json:"overall_score"`
	Passed        bool    `json:"passed"`
	CriticalFail  bool    `json:"critical_failure"`
	ClaimsTotal   int     `json:"claims_total"`
	ClaimsPassed  int     `json:"claims_passed"`
}

// CriticalFailurePayload is the payload for critical failure events.
type CriticalFailurePayload struct {
	Interaction   int     `json:"interaction"`
	Delta         float64 `json:"delta"`
	PriorScore    float64 `json:"prior_score"`
	CurrentScore  float64 `json:"current_score"`
	OutputHash    string  `json:"output_hash"`
}

// Chain is the Merkle-chained audit log backed by SQLite.
type Chain struct {
	db *sql.DB
}

// NewChain creates a new Merkle audit chain.
func NewChain(db *sql.DB) (*Chain, error) {
	c := &Chain{db: db}
	if err := c.migrate(); err != nil {
		return nil, fmt.Errorf("audit migrate: %w", err)
	}
	return c, nil
}

func (c *Chain) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS audit_chain (
		id          TEXT PRIMARY KEY,
		event_type  TEXT NOT NULL,
		tenant_id   TEXT NOT NULL,
		session_id  TEXT DEFAULT '',
		interaction INTEGER DEFAULT 0,
		payload     BLOB NOT NULL,
		prev_hash   TEXT NOT NULL DEFAULT '',
		hash        TEXT NOT NULL,
		timestamp   TEXT NOT NULL DEFAULT (datetime('now'))
	);

	CREATE INDEX IF NOT EXISTS idx_audit_tenant ON audit_chain(tenant_id);
	CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_chain(session_id);
	CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_chain(event_type);
	CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_chain(timestamp);
	CREATE INDEX IF NOT EXISTS idx_audit_interaction ON audit_chain(interaction);
	`
	_, err := c.db.Exec(schema)
	return err
}

// Append adds a new record to the Merkle chain.
// The record's hash includes the previous record's hash, forming a chain.
func (c *Chain) Append(r *Record) error {
	if r.Timestamp.IsZero() {
		r.Timestamp = time.Now().UTC()
	}

	// Get the previous hash
	prevHash, err := c.lastHash(r.TenantID)
	if err != nil {
		return fmt.Errorf("get prev hash: %w", err)
	}
	r.PrevHash = prevHash

	// Compute hash: H(event_type || tenant_id || payload || prev_hash || timestamp)
	r.Hash = computeHash(r)

	if r.ID == "" {
		r.ID = r.Hash[:16] // Use first 16 chars of hash as ID
	}

	_, err = c.db.Exec(`
		INSERT INTO audit_chain (id, event_type, tenant_id, session_id, interaction, payload, prev_hash, hash, timestamp)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, r.ID, string(r.EventType), r.TenantID, r.SessionID, r.Interaction,
		r.Payload, r.PrevHash, r.Hash, r.Timestamp.Format(time.RFC3339))

	return err
}

// Verify checks the integrity of the Merkle chain for a tenant.
// Returns the index of the first broken link, or -1 if the chain is intact.
func (c *Chain) Verify(tenantID string) (int, error) {
	rows, err := c.db.Query(`
		SELECT id, event_type, tenant_id, session_id, interaction, payload, prev_hash, hash, timestamp
		FROM audit_chain
		WHERE tenant_id = ?
		ORDER BY timestamp ASC, rowid ASC
	`, tenantID)
	if err != nil {
		return -1, err
	}
	defer rows.Close()

	var prevHash string
	index := 0

	for rows.Next() {
		var r Record
		var eventType, ts string
		if err := rows.Scan(&r.ID, &eventType, &r.TenantID, &r.SessionID, &r.Interaction,
			&r.Payload, &r.PrevHash, &r.Hash, &ts); err != nil {
			return index, err
		}
		r.EventType = EventType(eventType)
		r.Timestamp, _ = time.Parse(time.RFC3339, ts)

		// Verify prev_hash links correctly
		if r.PrevHash != prevHash {
			return index, fmt.Errorf("broken chain at index %d: expected prev_hash %s, got %s", index, prevHash, r.PrevHash)
		}

		// Verify hash
		expectedHash := computeHash(&r)
		if r.Hash != expectedHash {
			return index, fmt.Errorf("tampered record at index %d: expected hash %s, got %s", index, expectedHash, r.Hash)
		}

		prevHash = r.Hash
		index++
	}

	return -1, rows.Err()
}

// GetBySession returns all audit records for a session.
func (c *Chain) GetBySession(tenantID, sessionID string) ([]Record, error) {
	rows, err := c.db.Query(`
		SELECT id, event_type, tenant_id, session_id, interaction, payload, prev_hash, hash, timestamp
		FROM audit_chain
		WHERE tenant_id = ? AND session_id = ?
		ORDER BY timestamp ASC, rowid ASC
	`, tenantID, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRecords(rows)
}

// GetCriticalFailures returns all critical failure events for a tenant.
func (c *Chain) GetCriticalFailures(tenantID string) ([]Record, error) {
	rows, err := c.db.Query(`
		SELECT id, event_type, tenant_id, session_id, interaction, payload, prev_hash, hash, timestamp
		FROM audit_chain
		WHERE tenant_id = ? AND event_type = ?
		ORDER BY timestamp DESC
	`, tenantID, string(EventCriticalFail))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRecords(rows)
}

// GetLabels returns all human label events for a tenant.
func (c *Chain) GetLabels(tenantID string) ([]Record, error) {
	rows, err := c.db.Query(`
		SELECT id, event_type, tenant_id, session_id, interaction, payload, prev_hash, hash, timestamp
		FROM audit_chain
		WHERE tenant_id = ? AND event_type = ?
		ORDER BY timestamp DESC
	`, tenantID, string(EventLabel))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	return scanRecords(rows)
}

// lastHash returns the hash of the most recent record for a tenant.
func (c *Chain) lastHash(tenantID string) (string, error) {
	var hash string
	err := c.db.QueryRow(`
		SELECT hash FROM audit_chain
		WHERE tenant_id = ?
		ORDER BY timestamp DESC, rowid DESC
		LIMIT 1
	`, tenantID).Scan(&hash)
	if err == sql.ErrNoRows {
		return "", nil // Genesis record
	}
	return hash, err
}

func computeHash(r *Record) string {
	h := sha256.New()
	h.Write([]byte(string(r.EventType)))
	h.Write([]byte(r.TenantID))
	h.Write([]byte(r.Payload))
	h.Write([]byte(r.PrevHash))
	h.Write([]byte(r.Timestamp.Format(time.RFC3339)))
	return hex.EncodeToString(h.Sum(nil))
}

func scanRecords(rows *sql.Rows) ([]Record, error) {
	var records []Record
	for rows.Next() {
		var r Record
		var eventType, ts string
		if err := rows.Scan(&r.ID, &eventType, &r.TenantID, &r.SessionID, &r.Interaction,
			&r.Payload, &r.PrevHash, &r.Hash, &ts); err != nil {
			return nil, err
		}
		r.EventType = EventType(eventType)
		r.Timestamp, _ = time.Parse(time.RFC3339, ts)
		records = append(records, r)
	}
	return records, rows.Err()
}
