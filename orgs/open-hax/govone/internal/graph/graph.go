// Package graph implements a verified fact store for GovOne's governance pipeline.
//
// DELEGATE-52 hardening rationale:
//   - LLMs silently corrupt documents during delegation (~25% frontier, ~50% average)
//   - Errors are sparse but catastrophic (80-98% of degradation from critical failures)
//   - Standard similarity metrics capture only ~25% of actual semantic corruption
//   - Ground truth must live in a deterministic external graph the model queries but cannot corrupt
//
// Architecture:
//   - Structural edges: deterministic relationships (field paths, document links, entity mentions)
//   - Inferred edges: probabilistic relationships (vector similarity, shared labels)
//   - Verified edges: human-labeled ground truth (axiomatic layer)
//
// The human is epistemically upstream — authoring axioms, not downstream approving outputs.
package graph

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"
)

// NodeType classifies graph nodes.
type NodeType string

const (
	NodeDocument NodeType = "document"
	NodeField    NodeType = "field"
	NodeEntity   NodeType = "entity"
	NodeClaim    NodeType = "claim"
)

// EdgeType classifies graph edges.
type EdgeType string

const (
	// Structural edges — deterministic, machine-extracted.
	EdgeContains  EdgeType = "contains"  // document → field
	EdgeMentions  EdgeType = "mentions"  // field → entity
	EdgeLinksTo   EdgeType = "links_to"  // document → document
	EdgeFieldPath EdgeType = "field_path" // field → parent field

	// Inferred edges — probabilistic, computed.
	EdgeSimilarTo EdgeType = "similar_to"  // field → field (vector similarity)
	EdgeCoRefers  EdgeType = "co_refers"   // entity → entity (coreference)
	EdgeSharedLbl EdgeType = "shared_label" // claim → claim (shared label)

	// Verified edges — human-labeled ground truth.
	EdgeVerifiedAs  EdgeType = "verified_as"  // claim → fact
	EdgeRejectedAs  EdgeType = "rejected_as"  // claim → falsehood
	EdgeUncertainAs EdgeType = "uncertain_as" // claim → uncertain
)

// EdgeSource indicates how an edge was created.
type EdgeSource string

const (
	SourceStructural EdgeSource = "structural" // machine-extracted, deterministic
	SourceInferred   EdgeSource = "inferred"   // computed, probabilistic
	SourceVerified   EdgeSource = "verified"   // human-labeled, axiomatic
)

// Node represents a vertex in the verified fact graph.
type Node struct {
	ID         string          `json:"id"`
	Type       NodeType        `json:"type"`
	TenantID   string          `json:"tenant_id"`
	SourceID   string          `json:"source_id,omitempty"`
	DocumentID string          `json:"document_id,omitempty"`
	FieldPath  string          `json:"field_path,omitempty"`
	Content    string          `json:"content"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
	CreatedAt  time.Time       `json:"created_at"`
}

// Edge represents a relationship between two nodes.
type Edge struct {
	ID         string    `json:"id"`
	Type       EdgeType  `json:"type"`
	Source     EdgeSource `json:"source"`
	FromID     string    `json:"from_id"`
	ToID       string    `json:"to_id"`
	Weight     float64   `json:"weight"`     // 1.0 for structural, [0,1] for inferred, confidence for verified
	Evidence   string    `json:"evidence,omitempty"` // provenance chain
	CreatedAt  time.Time `json:"created_at"`
}

// Chunk is the retrieve stage output — conforms to GovOne's existing HTTP contract.
type Chunk struct {
	ChunkID       string          `json:"chunk_id"`
	SourceID      string          `json:"source_id"`
	Content       string          `json:"content"`
	RelevanceScore float64        `json:"relevance_score"`
	Provenance    Provenance      `json:"provenance"`
	EdgeSupport   EdgeSupport     `json:"edge_support"`
}

// Provenance traces a chunk back to its source document and field.
type Provenance struct {
	SourceName   string `json:"source_name"`
	DocumentID   string `json:"document_id"`
	FieldPath    string `json:"field_path"`
}

// EdgeSupport describes the graph evidence backing a chunk.
type EdgeSupport struct {
	StructuralCount int     `json:"structural_count"`
	InferredCount   int     `json:"inferred_count"`
	VerifiedCount   int     `json:"verified_count"`
	CoherenceScore  float64 `json:"coherence_score"`
}

// Store is the verified fact graph backed by SQLite.
type Store struct {
	db *sql.DB
}

// NewStore creates a new graph store with the required schema.
func NewStore(db *sql.DB) (*Store, error) {
	s := &Store{db: db}
	if err := s.migrate(); err != nil {
		return nil, fmt.Errorf("graph migrate: %w", err)
	}
	return s, nil
}

func (s *Store) migrate() error {
	schema := `
	CREATE TABLE IF NOT EXISTS graph_nodes (
		id          TEXT PRIMARY KEY,
		type        TEXT NOT NULL,
		tenant_id   TEXT NOT NULL,
		source_id   TEXT DEFAULT '',
		document_id TEXT DEFAULT '',
		field_path  TEXT DEFAULT '',
		content     TEXT NOT NULL,
		metadata    BLOB DEFAULT '{}',
		created_at  TEXT NOT NULL DEFAULT (datetime('now')),
		UNIQUE(tenant_id, type, document_id, field_path, content)
	);

	CREATE TABLE IF NOT EXISTS graph_edges (
		id          TEXT PRIMARY KEY,
		type        TEXT NOT NULL,
		source      TEXT NOT NULL,
		from_id     TEXT NOT NULL REFERENCES graph_nodes(id),
		to_id       TEXT NOT NULL REFERENCES graph_nodes(id),
		weight      REAL NOT NULL DEFAULT 1.0,
		evidence    TEXT DEFAULT '',
		created_at  TEXT NOT NULL DEFAULT (datetime('now')),
		UNIQUE(from_id, to_id, type)
	);

	CREATE INDEX IF NOT EXISTS idx_edges_from ON graph_edges(from_id);
	CREATE INDEX IF NOT EXISTS idx_edges_to ON graph_edges(to_id);
	CREATE INDEX IF NOT EXISTS idx_edges_type ON graph_edges(type);
	CREATE INDEX IF NOT EXISTS idx_nodes_type ON graph_nodes(type);
	CREATE INDEX IF NOT EXISTS idx_nodes_tenant ON graph_nodes(tenant_id);
	CREATE INDEX IF NOT EXISTS idx_nodes_document ON graph_nodes(document_id);
	CREATE INDEX IF NOT EXISTS idx_nodes_field_path ON graph_nodes(field_path);

	-- FTS5 index for initial candidate retrieval before graph traversal
	-- Uses standalone FTS5 (not external content) for reliable triggers
	CREATE VIRTUAL TABLE IF NOT EXISTS graph_nodes_fts USING fts5(
		node_id, content, field_path, document_id
	);

	-- Triggers to keep FTS in sync
	CREATE TRIGGER IF NOT EXISTS graph_nodes_ai AFTER INSERT ON graph_nodes BEGIN
		INSERT INTO graph_nodes_fts(node_id, content, field_path, document_id)
		VALUES (new.id, new.content, new.field_path, new.document_id);
	END;

	CREATE TRIGGER IF NOT EXISTS graph_nodes_ad AFTER DELETE ON graph_nodes BEGIN
		INSERT INTO graph_nodes_fts(graph_nodes_fts, node_id, content, field_path, document_id)
		VALUES ('delete', old.id, old.content, old.field_path, old.document_id);
	END;

	CREATE TRIGGER IF NOT EXISTS graph_nodes_au AFTER UPDATE ON graph_nodes BEGIN
		INSERT INTO graph_nodes_fts(graph_nodes_fts, node_id, content, field_path, document_id)
		VALUES ('delete', old.id, old.content, old.field_path, old.document_id);
		INSERT INTO graph_nodes_fts(node_id, content, field_path, document_id)
		VALUES (new.id, new.content, new.field_path, new.document_id);
	END;
	`
	_, err := s.db.Exec(schema)
	return err
}

// InsertNode adds a node to the graph. Idempotent on (tenant_id, type, document_id, field_path, content).
func (s *Store) InsertNode(n *Node) error {
	if n.ID == "" {
		n.ID = hashID(string(n.Type) + ":" + n.TenantID + ":" + n.DocumentID + ":" + n.FieldPath + ":" + n.Content)
	}
	if n.CreatedAt.IsZero() {
		n.CreatedAt = time.Now().UTC()
	}
	if n.Metadata == nil {
		n.Metadata = json.RawMessage(`{}`)
	}

	_, err := s.db.Exec(`
		INSERT OR IGNORE INTO graph_nodes (id, type, tenant_id, source_id, document_id, field_path, content, metadata, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, n.ID, string(n.Type), n.TenantID, n.SourceID, n.DocumentID, n.FieldPath, n.Content, n.Metadata, n.CreatedAt.Format(time.RFC3339))
	return err
}

// InsertEdge adds an edge to the graph. Idempotent on (from_id, to_id, type).
func (s *Store) InsertEdge(e *Edge) error {
	if e.ID == "" {
		e.ID = hashID(e.FromID + ":" + e.ToID + ":" + string(e.Type))
	}
	if e.CreatedAt.IsZero() {
		e.CreatedAt = time.Now().UTC()
	}

	_, err := s.db.Exec(`
		INSERT OR IGNORE INTO graph_edges (id, type, source, from_id, to_id, weight, evidence, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, e.ID, string(e.Type), string(e.Source), e.FromID, e.ToID, e.Weight, e.Evidence, e.CreatedAt.Format(time.RFC3339))
	return err
}

// GetNode retrieves a node by ID.
func (s *Store) GetNode(id string) (*Node, error) {
	n := &Node{}
	var typ, createdAt string
	err := s.db.QueryRow(`
		SELECT id, type, tenant_id, source_id, document_id, field_path, content, metadata, created_at
		FROM graph_nodes WHERE id = ?
	`, id).Scan(&n.ID, &typ, &n.TenantID, &n.SourceID, &n.DocumentID, &n.FieldPath, &n.Content, &n.Metadata, &createdAt)
	if err != nil {
		return nil, err
	}
	n.Type = NodeType(typ)
	n.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
	return n, nil
}

// GetEdgesFrom returns all edges originating from a node.
func (s *Store) GetEdgesFrom(nodeID string, edgeTypes ...EdgeType) ([]Edge, error) {
	query := `SELECT id, type, source, from_id, to_id, weight, evidence, created_at FROM graph_edges WHERE from_id = ?`
	args := []any{nodeID}

	if len(edgeTypes) > 0 {
		placeholders := ""
		for i, t := range edgeTypes {
			if i > 0 {
				placeholders += ","
			}
			placeholders += "?"
			args = append(args, string(t))
		}
		query += ` AND type IN (` + placeholders + `)`
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var edges []Edge
	for rows.Next() {
		var e Edge
		var typ, src, createdAt string
		if err := rows.Scan(&e.ID, &typ, &src, &e.FromID, &e.ToID, &e.Weight, &e.Evidence, &createdAt); err != nil {
			return nil, err
		}
		e.Type = EdgeType(typ)
		e.Source = EdgeSource(src)
		e.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		edges = append(edges, e)
	}
	return edges, rows.Err()
}

// GetEdgesTo returns all edges pointing to a node.
func (s *Store) GetEdgesTo(nodeID string, edgeTypes ...EdgeType) ([]Edge, error) {
	query := `SELECT id, type, source, from_id, to_id, weight, evidence, created_at FROM graph_edges WHERE to_id = ?`
	args := []any{nodeID}

	if len(edgeTypes) > 0 {
		placeholders := ""
		for i, t := range edgeTypes {
			if i > 0 {
				placeholders += ","
			}
			placeholders += "?"
			args = append(args, string(t))
		}
		query += ` AND type IN (` + placeholders + `)`
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var edges []Edge
	for rows.Next() {
		var e Edge
		var typ, src, createdAt string
		if err := rows.Scan(&e.ID, &typ, &src, &e.FromID, &e.ToID, &e.Weight, &e.Evidence, &createdAt); err != nil {
			return nil, err
		}
		e.Type = EdgeType(typ)
		e.Source = EdgeSource(src)
		e.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		edges = append(edges, e)
	}
	return edges, rows.Err()
}

// Subgraph retrieves nodes and edges within `hops` of a seed set.
// Returns the subgraph as adjacency lists keyed by node ID.
func (s *Store) Subgraph(seedIDs []string, hops int) (map[string][]Edge, error) {
	visited := make(map[string]bool)
	adj := make(map[string][]Edge)
	frontier := make(map[string]bool)

	for _, id := range seedIDs {
		frontier[id] = true
	}

	for h := 0; h < hops; h++ {
		nextFrontier := make(map[string]bool)
		for nodeID := range frontier {
			if visited[nodeID] {
				continue
			}
			visited[nodeID] = true

			outEdges, err := s.GetEdgesFrom(nodeID)
			if err != nil {
				return nil, err
			}
			inEdges, err := s.GetEdgesTo(nodeID)
			if err != nil {
				return nil, err
			}

			allEdges := append(outEdges, inEdges...)
			adj[nodeID] = allEdges

			for _, e := range allEdges {
				if !visited[e.ToID] {
					nextFrontier[e.ToID] = true
				}
				if !visited[e.FromID] {
					nextFrontier[e.FromID] = true
				}
			}
		}
		frontier = nextFrontier
	}

	return adj, nil
}

func hashID(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:16])
}

// HashID is the exported version of hashID for use by other packages.
func HashID(s string) string {
	return hashID(s)
}
