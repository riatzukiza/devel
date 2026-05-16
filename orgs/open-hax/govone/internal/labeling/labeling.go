// Package labeling implements the human labeling pipeline for GovOne.
//
// DELEGATE-52 hardening: Human labels are the axiomatic verified layer.
// The human is epistemically UPSTREAM — authoring axioms, not downstream
// approving outputs. This is augmented intelligence, not human-in-the-loop.
//
// Architecture:
//  1. Label request created (from inspect stage or manual review)
//  2. Human annotator provides label (verified/rejected/uncertain)
//  3. Label event recorded as first-class audit record in Merkle chain
//  4. Edge promoted/demoted in the graph based on label
//  5. Coherence scores recalculated for affected subgraph
//
// Every label is a first-class audit record with:
//   - Full provenance (who, when, why)
//   - Edge reference (what is being labeled)
//   - Confidence (how certain is the annotator)
//   - Evidence (what supports this label)
package labeling

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/open-hax/govone/internal/audit"
	"github.com/open-hax/govone/internal/graph"
)

// LabelType classifies human labels.
type LabelType string

const (
	LabelVerified  LabelType = "verified"  // edge is confirmed true
	LabelRejected  LabelType = "rejected"  // edge is confirmed false
	LabelUncertain LabelType = "uncertain" // annotator is unsure
)

// LabelRequest is submitted for human review.
type LabelRequest struct {
	ID          string    `json:"id"`
	EdgeID      string    `json:"edge_id"`
	TenantID    string    `json:"tenant_id"`
	SessionID   string    `json:"session_id,omitempty"`
	Interaction int       `json:"interaction,omitempty"`
	Context     string    `json:"context,omitempty"` // why this edge was flagged
	CreatedAt   time.Time `json:"created_at"`
}

// LabelResponse is the human annotator's response.
type LabelResponse struct {
	RequestID   string    `json:"request_id"`
	LabelType   LabelType `json:"label_type"`
	Confidence  float64   `json:"confidence"` // [0,1]
	AnnotatorID string    `json:"annotator_id"`
	Reason      string    `json:"reason,omitempty"`
	Evidence    string    `json:"evidence,omitempty"`
}

// Service manages the labeling pipeline.
type Service struct {
	graphStore *graph.Store
	auditChain *audit.Chain
	db         *sql.DB
}

// NewService creates a new labeling service.
func NewService(gs *graph.Store, ac *audit.Chain, db *sql.DB) (*Service, error) {
	s := &Service{
		graphStore: gs,
		auditChain: ac,
		db:         db,
	}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("labeling migrate: %w", err)
	}
	return s, nil
}

func (s *Service) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS label_requests (
		id          TEXT PRIMARY KEY,
		edge_id     TEXT NOT NULL,
		tenant_id   TEXT NOT NULL,
		session_id  TEXT DEFAULT '',
		interaction INTEGER DEFAULT 0,
		context     TEXT DEFAULT '',
		status      TEXT NOT NULL DEFAULT 'pending',
		created_at  TEXT NOT NULL DEFAULT (datetime('now')),
		resolved_at TEXT DEFAULT ''
	);

	CREATE INDEX IF NOT EXISTS idx_label_req_tenant ON label_requests(tenant_id);
	CREATE INDEX IF NOT EXISTS idx_label_req_status ON label_requests(status);
	CREATE INDEX IF NOT EXISTS idx_label_req_edge ON label_requests(edge_id);
	`
	_, err := s.db.Exec(schema)
	return err
}

// CreateRequest submits an edge for human labeling.
func (s *Service) CreateRequest(ctx context.Context, req LabelRequest) error {
	if req.ID == "" {
		req.ID = fmt.Sprintf("lr-%s-%d", req.EdgeID, time.Now().UnixNano())
	}
	if req.CreatedAt.IsZero() {
		req.CreatedAt = time.Now().UTC()
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO label_requests (id, edge_id, tenant_id, session_id, interaction, context, status, created_at)
		VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
	`, req.ID, req.EdgeID, req.TenantID, req.SessionID, req.Interaction, req.Context, req.CreatedAt.Format(time.RFC3339))

	return err
}

// SubmitLabel processes a human label response.
// This is the critical path: the label becomes an axiom in the graph and
// a first-class record in the Merkle-chained audit log.
func (s *Service) SubmitLabel(ctx context.Context, resp LabelResponse) error {
	// 1. Get the original request
	var edgeID, tenantID, sessionID string
	var interaction int
	err := s.db.QueryRowContext(ctx, `
		SELECT edge_id, tenant_id, session_id, interaction FROM label_requests WHERE id = ?
	`, resp.RequestID).Scan(&edgeID, &tenantID, &sessionID, &interaction)
	if err != nil {
		return fmt.Errorf("get label request: %w", err)
	}

	// 2. Update the edge in the graph based on the label
	var newEdgeType graph.EdgeType
	var newEdgeSource graph.EdgeSource

	switch resp.LabelType {
	case LabelVerified:
		newEdgeType = graph.EdgeVerifiedAs
		newEdgeSource = graph.SourceVerified
	case LabelRejected:
		newEdgeType = graph.EdgeRejectedAs
		newEdgeSource = graph.SourceVerified
	case LabelUncertain:
		newEdgeType = graph.EdgeUncertainAs
		newEdgeSource = graph.SourceVerified
	default:
		return fmt.Errorf("unknown label type: %s", resp.LabelType)
	}

	// Get the original edge to preserve its endpoints
	origEdge, err := s.getEdge(edgeID)
	if err != nil {
		return fmt.Errorf("get original edge: %w", err)
	}

	// Insert the labeled edge (this replaces the inferred edge with a verified one)
	newEdge := &graph.Edge{
		Type:    newEdgeType,
		Source:  newEdgeSource,
		FromID:  origEdge.FromID,
		ToID:    origEdge.ToID,
		Weight:  resp.Confidence,
		Evidence: fmt.Sprintf("human_label:%s:%s", resp.AnnotatorID, resp.Reason),
	}
	if err := s.graphStore.InsertEdge(newEdge); err != nil {
		return fmt.Errorf("insert labeled edge: %w", err)
	}

	// 3. Record as first-class audit event
	payload, _ := json.Marshal(audit.LabelPayload{
		EdgeID:      edgeID,
		LabelType:   string(resp.LabelType),
		Confidence:  resp.Confidence,
		AnnotatorID: resp.AnnotatorID,
		Reason:      resp.Reason,
		Evidence:    resp.Evidence,
	})

	if err := s.auditChain.Append(&audit.Record{
		EventType:   audit.EventLabel,
		TenantID:    tenantID,
		SessionID:   sessionID,
		Interaction: interaction,
		Payload:     payload,
	}); err != nil {
		return fmt.Errorf("audit label: %w", err)
	}

	// 4. Also record the edge verification as a separate audit event
	edgeEventType := audit.EventEdgeVerified
	if resp.LabelType == LabelRejected {
		edgeEventType = audit.EventEdgeRejected
	}

	edgePayload, _ := json.Marshal(map[string]any{
		"edge_id":       edgeID,
		"new_edge_id":   newEdge.ID,
		"label_type":    resp.LabelType,
		"from_id":       origEdge.FromID,
		"to_id":         origEdge.ToID,
		"confidence":    resp.Confidence,
		"annotator_id":  resp.AnnotatorID,
	})

	if err := s.auditChain.Append(&audit.Record{
		EventType:   edgeEventType,
		TenantID:    tenantID,
		SessionID:   sessionID,
		Interaction: interaction,
		Payload:     edgePayload,
	}); err != nil {
		return fmt.Errorf("audit edge event: %w", err)
	}

	// 5. Mark request as resolved
	_, err = s.db.ExecContext(ctx, `
		UPDATE label_requests SET status = 'resolved', resolved_at = ? WHERE id = ?
	`, time.Now().UTC().Format(time.RFC3339), resp.RequestID)

	return err
}

// GetPendingRequests returns all pending label requests for a tenant.
func (s *Service) GetPendingRequests(ctx context.Context, tenantID string) ([]LabelRequest, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, edge_id, tenant_id, session_id, interaction, context, created_at
		FROM label_requests
		WHERE tenant_id = ? AND status = 'pending'
		ORDER BY created_at ASC
	`, tenantID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []LabelRequest
	for rows.Next() {
		var r LabelRequest
		var ts string
		if err := rows.Scan(&r.ID, &r.EdgeID, &r.TenantID, &r.SessionID, &r.Interaction, &r.Context, &ts); err != nil {
			return nil, err
		}
		r.CreatedAt, _ = time.Parse(time.RFC3339, ts)
		requests = append(requests, r)
	}
	return requests, rows.Err()
}

// LabelStats returns labeling statistics for a tenant.
type LabelStats struct {
	TotalRequests int `json:"total_requests"`
	Pending       int `json:"pending"`
	Verified      int `json:"verified"`
	Rejected      int `json:"rejected"`
	Uncertain     int `json:"uncertain"`
}

// GetStats returns labeling statistics.
func (s *Service) GetStats(ctx context.Context, tenantID string) (LabelStats, error) {
	stats := LabelStats{}

	// Total and pending
	err := s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM label_requests WHERE tenant_id = ?
	`, tenantID).Scan(&stats.TotalRequests)
	if err != nil {
		return stats, err
	}

	err = s.db.QueryRowContext(ctx, `
		SELECT COUNT(*) FROM label_requests WHERE tenant_id = ? AND status = 'pending'
	`, tenantID).Scan(&stats.Pending)
	if err != nil {
		return stats, err
	}

	// Label type breakdown from audit chain
	rows, err := s.db.QueryContext(ctx, `
		SELECT payload FROM audit_chain
		WHERE tenant_id = ? AND event_type = 'label'
	`, tenantID)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	for rows.Next() {
		var payload []byte
		if err := rows.Scan(&payload); err != nil {
			continue
		}
		var lp audit.LabelPayload
		if json.Unmarshal(payload, &lp) != nil {
			continue
		}
		switch lp.LabelType {
		case "verified":
			stats.Verified++
		case "rejected":
			stats.Rejected++
		case "uncertain":
			stats.Uncertain++
		}
	}

	return stats, rows.Err()
}

func (s *Service) getEdge(edgeID string) (*graph.Edge, error) {
	// Query the graph store for the edge
	// This is a simple lookup - in production we'd cache this
	var e graph.Edge
	var typ, src, createdAt string
	err := s.db.QueryRow(`
		SELECT id, type, source, from_id, to_id, weight, evidence, created_at
		FROM graph_edges WHERE id = ?
	`, edgeID).Scan(&e.ID, &typ, &src, &e.FromID, &e.ToID, &e.Weight, &e.Evidence, &createdAt)
	if err != nil {
		return nil, err
	}
	e.Type = graph.EdgeType(typ)
	e.Source = graph.EdgeSource(src)
	e.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return &e, nil
}
