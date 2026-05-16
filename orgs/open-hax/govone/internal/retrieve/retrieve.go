// Package retrieve implements the graph-backed retrieval stage for GovOne.
//
// DELEGATE-52 hardening: Replace flat FTS text search with graph query against
// a verified fact store. The model queries ground truth it cannot corrupt.
//
// Pipeline:
//  1. Extract entities from query using max entropy classifier
//  2. Find matching nodes in the graph via FTS5 candidate retrieval
//  3. Traverse structural edges to find relevant fields/documents
//  4. Score by structural edge weight + inferred edge confidence + verified edge presence
//  5. Return chunks with full provenance (source_name, document_id, field_path)
package retrieve

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"sort"
	"strings"

	"github.com/open-hax/govone/internal/graph"
)

// Request is the retrieval query.
type Request struct {
	TenantID  string   `json:"tenant_id"`
	Query     string   `json:"query"`
	Entities  []string `json:"entities,omitempty"` // pre-extracted entities (from classifier stage)
	TopK      int      `json:"top_k"`
	Hops      int      `json:"hops"` // graph traversal depth (default 2)
}

// Response returns chunks conforming to GovOne's existing HTTP contract.
type Response struct {
	Chunks []graph.Chunk `json:"chunks"`
	GraphStats GraphStats `json:"graph_stats"`
}

// GraphStats provides observability into the retrieval graph traversal.
type GraphStats struct {
	NodesVisited    int     `json:"nodes_visited"`
	StructuralEdges int     `json:"structural_edges"`
	InferredEdges   int     `json:"inferred_edges"`
	VerifiedEdges   int     `json:"verified_edges"`
	AvgCoherence    float64 `json:"avg_coherence"`
}

// Service performs graph-backed retrieval.
type Service struct {
	store *graph.Store
	db    *sql.DB
}

// NewService creates a new retrieval service.
func NewService(store *graph.Store, db *sql.DB) *Service {
	return &Service{store: store, db: db}
}

// Retrieve performs graph-backed retrieval against the verified fact store.
//
// Algorithm:
//  1. FTS5 candidate retrieval — fast narrowing to relevant nodes
//  2. Entity resolution — match extracted entities to graph entity nodes
//  3. Graph expansion — traverse structural + verified edges (NOT inferred alone)
//  4. Coherence scoring — rank by edge support density
//  5. Chunk assembly — build response with full provenance
func (s *Service) Retrieve(ctx context.Context, req Request) (*Response, error) {
	if req.TopK <= 0 {
		req.TopK = 10
	}
	if req.Hops <= 0 {
		req.Hops = 2
	}

	// Phase 1: FTS5 candidate retrieval
	candidateIDs, err := s.ftsCandidates(ctx, req.TenantID, req.Query, req.TopK*3)
	if err != nil {
		return nil, fmt.Errorf("fts candidates: %w", err)
	}

	// Phase 2: Entity resolution — boost candidates that match known entities
	entityNodeIDs, err := s.resolveEntities(ctx, req.TenantID, req.Entities)
	if err != nil {
		return nil, fmt.Errorf("entity resolution: %w", err)
	}

	// Merge candidate sets
	seedSet := make(map[string]bool)
	for _, id := range candidateIDs {
		seedSet[id] = true
	}
	for _, id := range entityNodeIDs {
		seedSet[id] = true
	}

	seedIDs := make([]string, 0, len(seedSet))
	for id := range seedSet {
		seedIDs = append(seedIDs, id)
	}

	// Phase 3: Graph expansion — traverse from seeds
	subgraph, err := s.store.Subgraph(seedIDs, req.Hops)
	if err != nil {
		return nil, fmt.Errorf("graph expansion: %w", err)
	}

	// Phase 4: Score and rank chunks
	chunks := s.scoreAndRank(subgraph, seedIDs, req.TopK)

	// Phase 5: Compute graph stats
	stats := computeGraphStats(subgraph)

	return &Response{
		Chunks:    chunks,
		GraphStats: stats,
	}, nil
}

// ftsCandidates uses SQLite FTS5 to find initial candidate node IDs.
func (s *Service) ftsCandidates(ctx context.Context, tenantID, query string, limit int) ([]string, error) {
	// Tokenize query for FTS5 match
	tokens := tokenize(query)
	if len(tokens) == 0 {
		return nil, nil
	}

	// Build FTS5 match query — wrap each token in quotes for safety
	var quoted []string
	for _, t := range tokens {
		quoted = append(quoted, fmt.Sprintf("\"%s\"", t))
	}
	ftsQuery := strings.Join(quoted, " OR ")

	rows, err := s.db.QueryContext(ctx, fmt.Sprintf(`
		SELECT node_id FROM graph_nodes_fts
		WHERE graph_nodes_fts MATCH '%s'
		ORDER BY rank
		LIMIT %d
	`, ftsQuery, limit))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ids []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// resolveEntities maps entity strings to graph node IDs.
func (s *Service) resolveEntities(ctx context.Context, tenantID string, entities []string) ([]string, error) {
	if len(entities) == 0 {
		return nil, nil
	}

	var ids []string
	for _, entity := range entities {
		var id string
		err := s.db.QueryRowContext(ctx, `
			SELECT id FROM graph_nodes
			WHERE type = ? AND tenant_id = ? AND content = ?
			LIMIT 1
		`, string(graph.NodeEntity), tenantID, entity).Scan(&id)
		if err == sql.ErrNoRows {
			continue
		}
		if err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, nil
}

// scoreAndRank computes relevance scores from graph edge support.
//
// Scoring formula (DELEGATE-52 hardened):
//   - Structural edges provide base score (deterministic, cannot be corrupted)
//   - Verified edges provide high-weight boost (human-authored axioms)
//   - Inferred edges provide low-weight signal (probabilistic, may be wrong)
//   - Coherence = verified_edges / (structural + inferred + verified)
//
// This deliberately underweights inferred edges because DELEGATE-52 showed
// that semantic similarity metrics are nearly useless for detecting corruption.
func (s *Service) scoreAndRank(subgraph map[string][]graph.Edge, seedIDs []string, topK int) []graph.Chunk {
	type scoredNode struct {
		nodeID   string
		score    float64
		edges    []graph.Edge
	}

	nodeScores := make(map[string]*scoredNode)

	for nodeID, edges := range subgraph {
		sn := &scoredNode{nodeID: nodeID, edges: edges}

		structuralWeight := 0.0
		inferredWeight := 0.0
		verifiedWeight := 0.0

		for _, e := range edges {
			switch e.Source {
			case graph.SourceStructural:
				structuralWeight += e.Weight
			case graph.SourceInferred:
				inferredWeight += e.Weight * 0.3 // DELEGATE-52: inferred edges are unreliable
			case graph.SourceVerified:
				verifiedWeight += e.Weight * 2.0 // Human axioms get double weight
			}
		}

		// Is this node a seed? Boost it.
		seedBoost := 1.0
		for _, sid := range seedIDs {
			if sid == nodeID {
				seedBoost = 1.5
				break
			}
		}

		sn.score = (structuralWeight + inferredWeight + verifiedWeight) * seedBoost
		nodeScores[nodeID] = sn
	}

	// Sort by score descending
	ranked := make([]*scoredNode, 0, len(nodeScores))
	for _, sn := range nodeScores {
		ranked = append(ranked, sn)
	}
	sort.Slice(ranked, func(i, j int) bool {
		return ranked[i].score > ranked[j].score
	})

	// Build chunks from top-scoring field/document nodes
	var chunks []graph.Chunk
	seen := make(map[string]bool)

	for _, sn := range ranked {
		if len(chunks) >= topK {
			break
		}

		// Load the node to get content and provenance
		node, err := s.store.GetNode(sn.nodeID)
		if err != nil {
			continue
		}

		// Only emit chunks from field and document nodes
		if node.Type != graph.NodeField && node.Type != graph.NodeDocument {
			continue
		}

		if seen[node.ID] {
			continue
		}
		seen[node.ID] = true

		// Compute edge support
		support := graph.EdgeSupport{}
		for _, e := range sn.edges {
			switch e.Source {
			case graph.SourceStructural:
				support.StructuralCount++
			case graph.SourceInferred:
				support.InferredCount++
			case graph.SourceVerified:
				support.VerifiedCount++
			}
		}
		total := float64(support.StructuralCount + support.InferredCount + support.VerifiedCount)
		if total > 0 {
			support.CoherenceScore = float64(support.VerifiedCount+support.StructuralCount) / total
		} else {
			support.CoherenceScore = 0.0
		}

		// Normalize score to [0, 1]
		maxPossibleScore := 3.0 * 2.0 * 1.5 // max weight * max edges * seed boost
		normalizedScore := math.Min(sn.score/maxPossibleScore, 1.0)

		chunks = append(chunks, graph.Chunk{
			ChunkID:       node.ID,
			SourceID:      node.SourceID,
			Content:       node.Content,
			RelevanceScore: normalizedScore,
			Provenance: graph.Provenance{
				SourceName: node.SourceID,
				DocumentID: node.DocumentID,
				FieldPath:  node.FieldPath,
			},
			EdgeSupport: support,
		})
	}

	return chunks
}

func computeGraphStats(subgraph map[string][]graph.Edge) GraphStats {
	stats := GraphStats{
		NodesVisited: len(subgraph),
	}

	totalCoherence := 0.0
	coherenceCount := 0

	for _, edges := range subgraph {
		for _, e := range edges {
			switch e.Source {
			case graph.SourceStructural:
				stats.StructuralEdges++
			case graph.SourceInferred:
				stats.InferredEdges++
			case graph.SourceVerified:
				stats.VerifiedEdges++
			}
		}

		// Per-node coherence
		s, i, v := 0, 0, 0
		for _, e := range edges {
			switch e.Source {
			case graph.SourceStructural:
				s++
			case graph.SourceInferred:
				i++
			case graph.SourceVerified:
				v++
			}
		}
		total := float64(s + i + v)
		if total > 0 {
			totalCoherence += float64(v+s) / total
			coherenceCount++
		}
	}

	if coherenceCount > 0 {
		stats.AvgCoherence = totalCoherence / float64(coherenceCount)
	}

	return stats
}

// tokenize splits a query into FTS5-compatible tokens.
func tokenize(query string) []string {
	// Simple whitespace + punctuation tokenization
	// In production, use a proper tokenizer or the classifier's entity extraction
	words := strings.FieldsFunc(query, func(r rune) bool {
		return r == ' ' || r == '\t' || r == '\n' || r == ',' || r == '.' || r == ';' || r == ':'
	})

	var tokens []string
	for _, w := range words {
		w = strings.ToLower(strings.TrimSpace(w))
		if len(w) > 2 { // skip very short tokens
			tokens = append(tokens, w)
		}
	}
	return tokens
}
