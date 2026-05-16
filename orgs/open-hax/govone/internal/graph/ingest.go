package graph

import (
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
)

// IngestService populates the graph from structured documents.
// This is the "structured field ingest" from the MVP requirements.
type IngestService struct {
	store *Store
	db    *sql.DB
}

// NewIngestService creates a new ingest service.
func NewIngestService(store *Store, db *sql.DB) *IngestService {
	return &IngestService{store: store, db: db}
}

// Document is a source document to ingest into the graph.
type Document struct {
	ID         string            `json:"id"`
	TenantID   string            `json:"tenant_id"`
	SourceID   string            `json:"source_id"`
	SourceName string            `json:"source_name"`
	Content    string            `json:"content"`
	Fields     map[string]string `json:"fields"` // field_path -> content
	Entities   []string          `json:"entities"`
	Metadata   json.RawMessage   `json:"metadata,omitempty"`
}

// IngestResult reports what was created during ingest.
type IngestResult struct {
	DocumentNodeID string   `json:"document_node_id"`
	FieldNodeIDs   []string `json:"field_node_ids"`
	EntityNodeIDs  []string `json:"entity_node_ids"`
	EdgesCreated   int      `json:"edges_created"`
}

// IngestDocument adds a document and its fields/entities to the graph.
//
// This creates:
//   - 1 document node
//   - N field nodes (one per field_path)
//   - M entity nodes (one per unique entity)
//   - N "contains" edges (document → field)
//   - K "mentions" edges (field → entity)
//   - Entity co-occurrence edges (entity → entity via shared field)
func (is *IngestService) IngestDocument(doc Document) (*IngestResult, error) {
	result := &IngestResult{}

	// 1. Create document node
	docNode := &Node{
		Type:       NodeDocument,
		TenantID:   doc.TenantID,
		SourceID:   doc.SourceID,
		DocumentID: doc.ID,
		FieldPath:  "",
		Content:    doc.Content,
		Metadata:   doc.Metadata,
	}
	if err := is.store.InsertNode(docNode); err != nil {
		return nil, fmt.Errorf("insert document node: %w", err)
	}
	result.DocumentNodeID = docNode.ID

	// 2. Create field nodes and "contains" edges
	entityFieldMap := make(map[string][]string) // entity → list of field paths it appears in

	for fieldPath, content := range doc.Fields {
		fieldNode := &Node{
			Type:       NodeField,
			TenantID:   doc.TenantID,
			SourceID:   doc.SourceID,
			DocumentID: doc.ID,
			FieldPath:  fieldPath,
			Content:    content,
		}
		if err := is.store.InsertNode(fieldNode); err != nil {
			return nil, fmt.Errorf("insert field node: %w", err)
		}
		result.FieldNodeIDs = append(result.FieldNodeIDs, fieldNode.ID)

		// Structural edge: document contains field
		containsEdge := &Edge{
			Type:   EdgeContains,
			Source: SourceStructural,
			FromID: docNode.ID,
			ToID:   fieldNode.ID,
			Weight: 1.0,
		}
		if err := is.store.InsertEdge(containsEdge); err != nil {
			return nil, fmt.Errorf("insert contains edge: %w", err)
		}
		result.EdgesCreated++

		// Extract entities from this field (simple approach: check if known entities appear)
		contentLower := strings.ToLower(content)
		for _, entity := range doc.Entities {
			if strings.Contains(contentLower, strings.ToLower(entity)) {
				entityFieldMap[entity] = append(entityFieldMap[entity], fieldPath)
			}
		}
	}

	// 3. Create entity nodes and "mentions" edges
	entityNodeIDs := make(map[string]string) // entity name → node ID

	for entity, fieldPaths := range entityFieldMap {
		entityNode := &Node{
			Type:     NodeEntity,
			TenantID: doc.TenantID,
			SourceID: doc.SourceID,
			Content:  entity,
			Metadata: json.RawMessage(fmt.Sprintf(`{"field_paths":%s}`, marshalJSON(fieldPaths))),
		}
		if err := is.store.InsertNode(entityNode); err != nil {
			return nil, fmt.Errorf("insert entity node: %w", err)
		}
		entityNodeIDs[entity] = entityNode.ID
		result.EntityNodeIDs = append(result.EntityNodeIDs, entityNode.ID)

		// Structural edges: field mentions entity
		for _, fp := range fieldPaths {
			// Find the field node ID
			fieldNodeID := hashID(string(NodeField) + ":" + doc.TenantID + ":" + doc.ID + ":" + fp + ":" + doc.Fields[fp])
			mentionsEdge := &Edge{
				Type:   EdgeMentions,
				Source: SourceStructural,
				FromID: fieldNodeID,
				ToID:   entityNode.ID,
				Weight: 1.0,
			}
			if err := is.store.InsertEdge(mentionsEdge); err != nil {
				return nil, fmt.Errorf("insert mentions edge: %w", err)
			}
			result.EdgesCreated++
		}
	}

	// 4. Create entity co-occurrence edges (entities that appear in the same field)
	entityList := make([]string, 0, len(entityNodeIDs))
	for e := range entityNodeIDs {
		entityList = append(entityList, e)
	}

	for i := 0; i < len(entityList); i++ {
		for j := i + 1; j < len(entityList); j++ {
			// Check if they share any field paths
			fieldsI := entityFieldMap[entityList[i]]
			fieldsJ := entityFieldMap[entityList[j]]
			shared := intersect(fieldsI, fieldsJ)
			if len(shared) > 0 {
				weight := float64(len(shared)) / float64(max(len(fieldsI), len(fieldsJ)))
				coEdge := &Edge{
					Type:   EdgeCoRefers,
					Source: SourceInferred,
					FromID: entityNodeIDs[entityList[i]],
					ToID:   entityNodeIDs[entityList[j]],
					Weight: weight,
					Evidence: fmt.Sprintf("co_occurrence:%s", strings.Join(shared, ",")),
				}
				if err := is.store.InsertEdge(coEdge); err != nil {
					return nil, fmt.Errorf("insert co-ref edge: %w", err)
				}
				result.EdgesCreated++
			}
		}
	}

	return result, nil
}

// LabelEdge creates a verified edge from a human label.
// This is how human labels plug into the graph as axioms.
func (is *IngestService) LabelEdge(fromID, toID string, labelType EdgeType, confidence float64, annotatorID, reason string) error {
	edge := &Edge{
		Type:   labelType,
		Source: SourceVerified,
		FromID: fromID,
		ToID:   toID,
		Weight: confidence,
		Evidence: fmt.Sprintf("human_label:%s:%s", annotatorID, reason),
	}
	return is.store.InsertEdge(edge)
}

func intersect(a, b []string) []string {
	set := make(map[string]bool)
	for _, s := range a {
		set[s] = true
	}
	var result []string
	for _, s := range b {
		if set[s] {
			result = append(result, s)
		}
	}
	return result
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func marshalJSON(v any) string {
	b, _ := json.Marshal(v)
	return string(b)
}

// ComputeFieldSimilarity computes structural similarity between two fields.
// This creates inferred edges based on content similarity WITHOUT using embeddings.
// Uses a simple token overlap (Jaccard) as a proxy — fast, deterministic, no vector DB.
func (is *IngestService) ComputeFieldSimilarity(tenantID string, threshold float64) (int, error) {
	// Get all field nodes for this tenant
	rows, err := is.db.Query(`
		SELECT id, content FROM graph_nodes
		WHERE type = ? AND tenant_id = ?
	`, string(NodeField), tenantID)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	type fieldInfo struct {
		id      string
		tokens  map[string]bool
	}
	var fields []fieldInfo

	for rows.Next() {
		var fi fieldInfo
		var content string
		if err := rows.Scan(&fi.id, &content); err != nil {
			return 0, err
		}
		fi.tokens = tokenizeSet(content)
		fields = append(fields, fi)
	}

	// Compute pairwise Jaccard similarity
	edgesCreated := 0
	for i := 0; i < len(fields); i++ {
		for j := i + 1; j < len(fields); j++ {
			sim := jaccard(fields[i].tokens, fields[j].tokens)
			if sim >= threshold {
				edge := &Edge{
					Type:   EdgeSimilarTo,
					Source: SourceInferred,
					FromID: fields[i].id,
					ToID:   fields[j].id,
					Weight: sim,
					Evidence: fmt.Sprintf("jaccard:%.3f", sim),
				}
				if err := is.store.InsertEdge(edge); err != nil {
					return edgesCreated, err
				}
				edgesCreated++
			}
		}
	}

	return edgesCreated, nil
}

func tokenizeSet(text string) map[string]bool {
	tokens := make(map[string]bool)
	words := strings.FieldsFunc(strings.ToLower(text), func(r rune) bool {
		return r == ' ' || r == '\t' || r == '\n' || r == ',' || r == '.' || r == ';' || r == ':'
	})
	for _, w := range words {
		if len(w) > 2 {
			tokens[w] = true
		}
	}
	return tokens
}

func jaccard(a, b map[string]bool) float64 {
	if len(a) == 0 && len(b) == 0 {
		return 0
	}
	intersection := 0
	for k := range a {
		if b[k] {
			intersection++
		}
	}
	union := len(a) + len(b) - intersection
	if union == 0 {
		return 0
	}
	return float64(intersection) / float64(union)
}

// DocHash computes a deterministic hash of a document for tracking.
func DocHash(content string) string {
	h := sha256.Sum256([]byte(content))
	return hex.EncodeToString(h[:16])
}

