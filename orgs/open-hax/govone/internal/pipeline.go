package govone

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/open-hax/govone/internal/audit"
	"github.com/open-hax/govone/internal/classifier"
	"github.com/open-hax/govone/internal/graph"
	"github.com/open-hax/govone/internal/inspect"
	"github.com/open-hax/govone/internal/labeling"
	"github.com/open-hax/govone/internal/redact"
	"github.com/open-hax/govone/internal/retrieve"
)

// Pipeline orchestrates the full GovOne governance pipeline:
// classify → redact → retrieve → generate → inspect → rehydrate → audit chain
//
// DELEGATE-52 hardening:
//   - Retrieve is graph-backed (not flat FTS)
//   - Inspect checks claims against verified graph edges (not just placeholder presence)
//   - Every step is Merkle-chained in the audit log
//   - Critical failures trigger immediate flagging
type Pipeline struct {
	db           *sql.DB
	classifier   *classifier.Service
	redactor     *redact.Service
	graphStore   *graph.Store
	ingest       *graph.IngestService
	retriever    *retrieve.Service
	inspector    *inspect.CoherenceInspector
	priorScores  *inspect.PriorScoreStore
	auditChain   *audit.Chain
	labelingSvc  *labeling.Service
}

// PipelineConfig configures the pipeline.
type PipelineConfig struct {
	CoherenceThreshold    float64 `json:"coherence_threshold"`
	CriticalFailureDelta  float64 `json:"critical_failure_delta"`
	GraphHops             int     `json:"graph_hops"`
	TopK                  int     `json:"top_k"`
	FieldSimilarityThresh float64 `json:"field_similarity_threshold"`
}

// DefaultPipelineConfig returns hardened defaults from DELEGATE-52.
func DefaultPipelineConfig() PipelineConfig {
	return PipelineConfig{
		CoherenceThreshold:    0.98,
		CriticalFailureDelta:  0.10,
		GraphHops:             2,
		TopK:                  10,
		FieldSimilarityThresh: 0.3,
	}
}

// NewPipeline creates a new GovOne pipeline.
func NewPipeline(db *sql.DB, config PipelineConfig) (*Pipeline, error) {
	graphStore, err := graph.NewStore(db)
	if err != nil {
		return nil, fmt.Errorf("graph store: %w", err)
	}

	ingestSvc := graph.NewIngestService(graphStore, db)

	classifierSvc, err := classifier.NewService(classifier.DefaultConfig())
	if err != nil {
		return nil, fmt.Errorf("classifier: %w", err)
	}

	redactor, err := redact.NewService(redact.DefaultConfig())
	if err != nil {
		return nil, fmt.Errorf("redactor: %w", err)
	}

	retriever := retrieve.NewService(graphStore, db)

	coherenceConfig := inspect.CoherenceConfig{
		CoherenceThreshold:   config.CoherenceThreshold,
		CriticalFailureDelta: config.CriticalFailureDelta,
		MaxHops:              config.GraphHops,
	}
	priorScores := inspect.NewPriorScoreStore()
	inspector := inspect.NewCoherenceInspector(graphStore, coherenceConfig, priorScores)

	auditChain, err := audit.NewChain(db)
	if err != nil {
		return nil, fmt.Errorf("audit chain: %w", err)
	}

	labelingSvc, err := labeling.NewService(graphStore, auditChain, db)
	if err != nil {
		return nil, fmt.Errorf("labeling: %w", err)
	}

	return &Pipeline{
		db:          db,
		classifier:  classifierSvc,
		redactor:    redactor,
		graphStore:  graphStore,
		ingest:      ingestSvc,
		retriever:   retriever,
		inspector:   inspector,
		priorScores: priorScores,
		auditChain:  auditChain,
		labelingSvc: labelingSvc,
	}, nil
}

// Request is a full pipeline execution request.
type Request struct {
	TenantID    string   `json:"tenant_id"`
	SessionID   string   `json:"session_id"`
	Interaction int      `json:"interaction"`
	Query       string   `json:"query"`
	Entities    []string `json:"entities,omitempty"`
	TopK        int      `json:"top_k"`
}

// Response is the full pipeline execution response.
type Response struct {
	RetrievedChunks  []graph.Chunk        `json:"retrieved_chunks"`
	GraphStats       retrieve.GraphStats   `json:"graph_stats"`
	InspectionResult *inspect.InspectionResult `json:"inspection_result,omitempty"`
	AuditRecordIDs   []string              `json:"audit_record_ids"`
	Passed           bool                  `json:"passed"`
	Timestamp        time.Time             `json:"timestamp"`
}

// Execute runs the full governance pipeline.
func (p *Pipeline) Execute(ctx context.Context, req Request, modelOutput string) (*Response, error) {
	resp := &Response{
		Timestamp: time.Now().UTC(),
	}

	// Stage 1: Classify — extract entities from query
	classification := p.classifier.Classify(req.Query)
	entities := append(req.Entities, classification.Entities...)

	// Stage 2: Redact — strip PII
	redacted := p.redactor.Redact(req.Query)

	// Stage 3: Retrieve — graph-backed retrieval
	retrieveReq := retrieve.Request{
		TenantID: req.TenantID,
		Query:    redacted.Content,
		Entities: entities,
		TopK:     req.TopK,
		Hops:     2,
	}

	retrieveResp, err := p.retriever.Retrieve(ctx, retrieveReq)
	if err != nil {
		return nil, fmt.Errorf("retrieve: %w", err)
	}
	resp.RetrievedChunks = retrieveResp.Chunks
	resp.GraphStats = retrieveResp.GraphStats

	// Record retrieval in audit chain
	retrievePayload, _ := json.Marshal(map[string]any{
		"query":           redacted.Content,
		"entities":        entities,
		"chunks_returned": len(retrieveResp.Chunks),
		"graph_stats":     retrieveResp.GraphStats,
	})
	p.auditChain.Append(&audit.Record{
		EventType:   audit.EventRetrieve,
		TenantID:    req.TenantID,
		SessionID:   req.SessionID,
		Interaction: req.Interaction,
		Payload:     retrievePayload,
	})

	// Stage 5: Inspect — coherence-gated claim verification
	if modelOutput != "" {
		claimExtractor := inspect.NewClaimExtractor()
		var fieldPaths []string
		for _, chunk := range retrieveResp.Chunks {
			if chunk.Provenance.FieldPath != "" {
				fieldPaths = append(fieldPaths, chunk.Provenance.FieldPath)
			}
		}
		claims := claimExtractor.ExtractClaims(modelOutput, fieldPaths)

		// Resolve claims to graph entities
		for i := range claims {
			claims[i].EntityIDs = resolveClaimEntities(claims[i], entities, p.graphStore, req.TenantID)
		}

		scoreKey := fmt.Sprintf("%s:%s:%d", req.TenantID, req.SessionID, req.Interaction)
		inspectResult, err := p.inspector.Inspect(ctx, req.TenantID, modelOutput, claims, scoreKey)
		if err != nil {
			return nil, fmt.Errorf("inspect: %w", err)
		}
		resp.InspectionResult = inspectResult
		resp.Passed = inspectResult.Passed

		// Record inspection in audit chain
		inspectPayload, _ := json.Marshal(audit.InspectionPayload{
			OutputHash:   docHash(modelOutput),
			OverallScore: inspectResult.OverallScore,
			Passed:       inspectResult.Passed,
			CriticalFail: inspectResult.CriticalFailure,
			ClaimsTotal:  len(claims),
			ClaimsPassed: countPassed(inspectResult.ClaimScores),
		})
		p.auditChain.Append(&audit.Record{
			EventType:   audit.EventInspect,
			TenantID:    req.TenantID,
			SessionID:   req.SessionID,
			Interaction: req.Interaction,
			Payload:     inspectPayload,
		})

		// If critical failure detected, record it
		if inspectResult.CriticalFailure {
			cfPayload, _ := json.Marshal(audit.CriticalFailurePayload{
				Interaction:  req.Interaction,
				Delta:        inspectResult.DeltaFromPrior,
				PriorScore:   inspectResult.OverallScore + inspectResult.DeltaFromPrior,
				CurrentScore: inspectResult.OverallScore,
				OutputHash:   docHash(modelOutput),
			})
			p.auditChain.Append(&audit.Record{
				EventType:   audit.EventCriticalFail,
				TenantID:    req.TenantID,
				SessionID:   req.SessionID,
				Interaction: req.Interaction,
				Payload:     cfPayload,
			})

			// Create label requests for low-scoring claims
			for _, cs := range inspectResult.ClaimScores {
				if !cs.Passed {
					p.labelingSvc.CreateRequest(ctx, labeling.LabelRequest{
						EdgeID:      cs.ClaimID,
						TenantID:    req.TenantID,
						SessionID:   req.SessionID,
						Interaction: req.Interaction,
						Context:     fmt.Sprintf("Claim coherence %.2f below threshold. Claim: %s", cs.CoherenceScore, cs.ClaimText),
					})
				}
			}
		}
	}

	return resp, nil
}

// IngestDocument adds a document to the verified fact graph.
func (p *Pipeline) IngestDocument(doc graph.Document) (*graph.IngestResult, error) {
	return p.ingest.IngestDocument(doc)
}

// ComputeFieldSimilarity creates inferred edges between similar fields.
func (p *Pipeline) ComputeFieldSimilarity(tenantID string, threshold float64) (int, error) {
	return p.ingest.ComputeFieldSimilarity(tenantID, threshold)
}

// VerifyChain checks the integrity of the Merkle audit chain.
func (p *Pipeline) VerifyChain(tenantID string) (int, error) {
	return p.auditChain.Verify(tenantID)
}

// GetAuditChain returns the audit chain for inspection.
func (p *Pipeline) GetAuditChain() *audit.Chain {
	return p.auditChain
}

// GetLabelingService returns the labeling service.
func (p *Pipeline) GetLabelingService() *labeling.Service {
	return p.labelingSvc
}

// GetGraphStore returns the graph store.
func (p *Pipeline) GetGraphStore() *graph.Store {
	return p.graphStore
}

func resolveClaimEntities(claim inspect.Claim, entities []string, store *graph.Store, tenantID string) []string {
	var resolved []string
	claimLower := strings.ToLower(claim.Text)
	for _, entity := range entities {
		if strings.Contains(claimLower, strings.ToLower(entity)) {
			// Look up the entity node ID in the graph
			nodeID := graph.HashID(string(graph.NodeEntity) + ":" + tenantID + ":::" + entity)
			resolved = append(resolved, nodeID)
		}
	}
	return resolved
}

func countPassed(scores []inspect.ClaimScore) int {
	count := 0
	for _, s := range scores {
		if s.Passed {
			count++
		}
	}
	return count
}

func docHash(content string) string {
	h := sha256.Sum256([]byte(content))
	return hex.EncodeToString(h[:16])
}
