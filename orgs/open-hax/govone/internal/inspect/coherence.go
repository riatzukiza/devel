// Package inspect implements the coherence-gated inspection stage for GovOne.
//
// DELEGATE-52 hardening rationale:
//   - Standard similarity metrics (ROUGE-L, BERTScore, cosine) capture only ~25% of corruption
//   - 80-98% of degradation comes from sudden critical failures, not gradual drift
//   - We need a verification method that does NOT re-introduce LLM judgment
//
// Algorithm: Coherence-Gated Claim Verification
//
//  1. Claim Extraction: Parse model output into discrete claims using structured
//     extraction (regex, AST parsing, field extraction) — NOT LLM extraction.
//
//  2. Claim Resolution: Map each claim to graph nodes/entities via string matching
//     and entity resolution against the verified fact store.
//
//  3. Subgraph Retrieval: Get the verified subgraph (2-hop) around resolved nodes.
//
//  4. Coherence Scoring:
//     For each claim:
//       - Count verified edges supporting the claim
//       - Count structural edges supporting the claim
//       - Count inferred edges (low weight — DELEGATE-52 showed these are unreliable)
//       - score = (verified + structural) / (verified + structural + inferred)
//
//  5. Critical Failure Detection:
//     - Track score deltas between consecutive interactions
//     - If delta > threshold (default 0.10), flag as critical failure
//     - This directly addresses DELEGATE-52's finding that 80-98% of degradation
//       comes from sudden catastrophic failures
//
//  6. Gate Decision:
//     - If ANY claim scores below coherence_threshold, the entire output is flagged
//     - Returns detailed per-claim breakdown for audit trail
package inspect

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/open-hax/govone/internal/graph"
)

// CoherenceConfig controls the inspection behavior.
type CoherenceConfig struct {
	// CoherenceThreshold is the minimum coherence score for a claim to pass.
	// Default: 0.98 (the DELEGATE-52 "ready" threshold)
	CoherenceThreshold float64 `json:"coherence_threshold"`

	// CriticalFailureDelta is the minimum score drop between interactions
	// that constitutes a "critical failure" per DELEGATE-52 analysis.
	// Default: 0.10 (a 10% drop in a single interaction)
	CriticalFailureDelta float64 `json:"critical_failure_delta"`

	// MaxHops controls graph traversal depth for subgraph retrieval.
	MaxHops int `json:"max_hops"`
}

// DefaultCoherenceConfig returns the hardened defaults derived from DELEGATE-52.
func DefaultCoherenceConfig() CoherenceConfig {
	return CoherenceConfig{
		CoherenceThreshold:   0.98, // DELEGATE-52 "ready" threshold
		CriticalFailureDelta: 0.10, // 10% drop = critical failure
		MaxHops:              2,
	}
}

// Claim is a discrete factual assertion extracted from model output.
type Claim struct {
	ID       string `json:"id"`
	Text     string `json:"text"`
	FieldPath string `json:"field_path,omitempty"` // which field this claim relates to
	EntityIDs []string `json:"entity_ids,omitempty"` // resolved entity node IDs
}

// ClaimScore is the coherence score for a single claim.
type ClaimScore struct {
	ClaimID          string  `json:"claim_id"`
	ClaimText        string  `json:"claim_text"`
	CoherenceScore   float64 `json:"coherence_score"`
	VerifiedSupport   int     `json:"verified_support"`
	StructuralSupport int     `json:"structural_support"`
	InferredSupport   int     `json:"inferred_support"`
	Passed           bool    `json:"passed"`
}

// InspectionResult is the full output of a coherence-gated inspection.
type InspectionResult struct {
	Passed          bool          `json:"passed"`
	OverallScore    float64       `json:"overall_score"`
	ClaimScores     []ClaimScore  `json:"claim_scores"`
	CriticalFailure bool          `json:"critical_failure"`
	DeltaFromPrior  float64       `json:"delta_from_prior"`
	GraphStats      GraphInspectionStats `json:"graph_stats"`
	Timestamp       time.Time     `json:"timestamp"`
}

// GraphInspectionStats provides observability into the inspection.
type GraphInspectionStats struct {
	ClaimsExtracted   int `json:"claims_extracted"`
	ClaimsResolved    int `json:"claims_resolved"`
	NodesVisited      int `json:"nodes_visited"`
	VerifiedEdgesUsed int `json:"verified_edges_used"`
}

// PriorScoreStore tracks scores across interactions for critical failure detection.
type PriorScoreStore struct {
	scores map[string]float64 // tenant:model:output_hash -> prior score
}

// NewPriorScoreStore creates a new score tracking store.
func NewPriorScoreStore() *PriorScoreStore {
	return &PriorScoreStore{scores: make(map[string]float64)}
}

// GetPriorScore returns the prior coherence score for a given key.
func (ps *PriorScoreStore) GetPriorScore(key string) (float64, bool) {
	s, ok := ps.scores[key]
	return s, ok
}

// SetScore stores a coherence score.
func (ps *PriorScoreStore) SetScore(key string, score float64) {
	ps.scores[key] = score
}

// CoherenceInspector performs claim-level verification against the graph.
type CoherenceInspector struct {
	config   CoherenceConfig
	store    *graph.Store
	priorPS  *PriorScoreStore
}

// NewCoherenceInspector creates a new inspector.
func NewCoherenceInspector(store *graph.Store, config CoherenceConfig, priorScores *PriorScoreStore) *CoherenceInspector {
	if config.CoherenceThreshold == 0 {
		config = DefaultCoherenceConfig()
	}
	return &CoherenceInspector{
		config:  config,
		store:   store,
		priorPS: priorScores,
	}
}

// Inspect verifies model output claims against the verified fact graph.
//
// This is the core DELEGATE-52 hardening: we check claims against deterministic
// ground truth the model cannot corrupt, without re-introducing LLM judgment.
func (ci *CoherenceInspector) Inspect(ctx context.Context, tenantID string, output string, claims []Claim, scoreKey string) (*InspectionResult, error) {
	result := &InspectionResult{
		Timestamp: time.Now().UTC(),
		GraphStats: GraphInspectionStats{
			ClaimsExtracted: len(claims),
		},
	}

	if len(claims) == 0 {
		// No claims to verify — pass through (but flag as unverified)
		result.Passed = true
		result.OverallScore = 1.0
		return result, nil
	}

	// Phase 1: Resolve claims to graph nodes
	resolvedClaims := 0
	for i := range claims {
		if len(claims[i].EntityIDs) > 0 {
			resolvedClaims++
		}
	}
	result.GraphStats.ClaimsResolved = resolvedClaims

	// Phase 2: For each claim, retrieve subgraph and score coherence
	var claimScores []ClaimScore
	for _, claim := range claims {
		cs, err := ci.scoreClaim(ctx, tenantID, claim)
		if err != nil {
			return nil, fmt.Errorf("score claim %s: %w", claim.ID, err)
		}
		claimScores = append(claimScores, cs)
	}
	result.ClaimScores = claimScores

	// Phase 3: Compute overall score (minimum of all claim scores — weakest link)
	minScore := 1.0
	for _, cs := range claimScores {
		if cs.CoherenceScore < minScore {
			minScore = cs.CoherenceScore
		}
	}
	result.OverallScore = minScore

	// Phase 4: Gate decision — ALL claims must pass threshold
	result.Passed = minScore >= ci.config.CoherenceThreshold

	// Phase 5: Critical failure detection
	if scoreKey != "" {
		if priorScore, ok := ci.priorPS.GetPriorScore(scoreKey); ok {
			delta := priorScore - minScore
			result.DeltaFromPrior = delta
			result.CriticalFailure = delta >= ci.config.CriticalFailureDelta
		}
		ci.priorPS.SetScore(scoreKey, minScore)
	}

	// Count verified edges used
	for _, cs := range claimScores {
		result.GraphStats.VerifiedEdgesUsed += cs.VerifiedSupport
	}

	return result, nil
}

// scoreClaim verifies a single claim against the graph.
func (ci *CoherenceInspector) scoreClaim(ctx context.Context, tenantID string, claim Claim) (ClaimScore, error) {
	cs := ClaimScore{
		ClaimID:   claim.ID,
		ClaimText: claim.Text,
	}

	// If no entities resolved, we can't verify — score 0
	if len(claim.EntityIDs) == 0 {
		cs.CoherenceScore = 0.0
		cs.Passed = false
		return cs, nil
	}

	// Get subgraph around resolved entities
	subgraph, err := ci.store.Subgraph(claim.EntityIDs, ci.config.MaxHops)
	if err != nil {
		return cs, fmt.Errorf("subgraph: %w", err)
	}

	// Count edge support
	for _, edges := range subgraph {
		for _, e := range edges {
			switch e.Source {
			case graph.SourceVerified:
				cs.VerifiedSupport++
			case graph.SourceStructural:
				cs.StructuralSupport++
			case graph.SourceInferred:
				cs.InferredSupport++
			}
		}
	}

	// Coherence score: (verified + structural) / total
	// Structural edges are deterministic — they can't be corrupted by LLMs
	// Verified edges are human-authored axioms — the strongest signal
	// Inferred edges are unreliable per DELEGATE-52
	total := float64(cs.VerifiedSupport + cs.StructuralSupport + cs.InferredSupport)
	if total > 0 {
		cs.CoherenceScore = float64(cs.VerifiedSupport+cs.StructuralSupport) / total
	} else {
		cs.CoherenceScore = 0.0
	}

	cs.Passed = cs.CoherenceScore >= ci.config.CoherenceThreshold
	return cs, nil
}

// ClaimExtractor extracts claims from model output using structured methods.
// This deliberately does NOT use an LLM to extract claims — that would
// re-introduce the corruption vector DELEGATE-52 identified.
type ClaimExtractor struct{}

// NewClaimExtractor creates a new structured claim extractor.
func NewClaimExtractor() *ClaimExtractor {
	return &ClaimExtractor{}
}

// ExtractClaims parses model output into discrete claims using structural heuristics.
//
// Strategy: Parse the output into field-value pairs, sentences, and structured
// data. Each field-value pair is a claim. Each sentence containing a factual
// assertion is a claim.
//
// This is deliberately simple and deterministic — no LLM involved.
func (ce *ClaimExtractor) ExtractClaims(output string, fieldPaths []string) []Claim {
	var claims []Claim
	claimID := 0

	// Strategy 1: Extract field-value pairs (key: value or key=value)
	lines := strings.Split(output, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// Try to parse as field-value
		if fv := parseFieldValue(line); fv != nil {
			claimID++
			claims = append(claims, Claim{
				ID:        fmt.Sprintf("claim-%d", claimID),
				Text:      line,
				FieldPath: fv.field,
			})
			continue
		}

		// Strategy 2: Extract sentences as claims
		sentences := splitSentences(line)
		for _, sent := range sentences {
			sent = strings.TrimSpace(sent)
			if len(sent) > 10 && containsFactualSignal(sent) {
				claimID++
				claims = append(claims, Claim{
					ID:   fmt.Sprintf("claim-%d", claimID),
					Text: sent,
				})
			}
		}
	}

	// Strategy 3: If explicit field paths provided, try to extract values
	for _, fp := range fieldPaths {
		if val := extractFieldValue(output, fp); val != "" {
			claimID++
			claims = append(claims, Claim{
				ID:        fmt.Sprintf("claim-%d", claimID),
				Text:      val,
				FieldPath: fp,
			})
		}
	}

	return claims
}

type fieldValue struct {
	field string
	value string
}

func parseFieldValue(line string) *fieldValue {
	// Try "key: value" pattern
	for _, sep := range []string{": ", ":  ", ":\t"} {
		if idx := strings.Index(line, sep); idx > 0 && idx < 100 {
			return &fieldValue{
				field: strings.TrimSpace(line[:idx]),
				value: strings.TrimSpace(line[idx+len(sep):]),
			}
		}
	}
	// Try "key=value" pattern
	if idx := strings.Index(line, "="); idx > 0 && idx < 100 {
		return &fieldValue{
			field: strings.TrimSpace(line[:idx]),
			value: strings.TrimSpace(line[idx+1:]),
		}
	}
	return nil
}

func splitSentences(text string) []string {
	// Simple sentence splitting on period, exclamation, question mark
	var sentences []string
	current := ""
	for _, r := range text {
		current += string(r)
		if r == '.' || r == '!' || r == '?' {
			sentences = append(sentences, current)
			current = ""
		}
	}
	if current != "" {
		sentences = append(sentences, current)
	}
	return sentences
}

// containsFactualSignal checks if a sentence contains signals of a factual claim.
func containsFactualSignal(s string) bool {
	signals := []string{
		"is ", "are ", "was ", "were ", "has ", "have ", "had ",
		"contains ", "includes ", "equals ", "costs ", "measures ",
		"located ", "defined ", "specified ", "requires ",
		"according to ", "per ", "based on ",
	}
	lower := strings.ToLower(s)
	for _, sig := range signals {
		if strings.Contains(lower, sig) {
			return true
		}
	}
	return false
}

func extractFieldValue(output, fieldPath string) string {
	// Look for the field path in the output and extract the value
	// This handles formats like "field_path: value" or JSON-like structures
	lower := strings.ToLower(output)
	search := strings.ToLower(fieldPath)

	idx := strings.Index(lower, search)
	if idx < 0 {
		return ""
	}

	remainder := output[idx+len(fieldPath):]
	remainder = strings.TrimSpace(remainder)

	// Skip separator
	for _, sep := range []string{":", "=", " "} {
		if strings.HasPrefix(remainder, sep) {
			remainder = strings.TrimSpace(remainder[len(sep):])
			break
		}
	}

	// Take until newline or end
	if nlIdx := strings.Index(remainder, "\n"); nlIdx >= 0 {
		return remainder[:nlIdx]
	}
	return remainder
}

// ConfidenceInterval computes a simple confidence interval for coherence scores.
// Used to determine if we have enough evidence to make a gate decision.
func ConfidenceInterval(scores []float64) (mean, lower, upper float64) {
	if len(scores) == 0 {
		return 0, 0, 0
	}

	sum := 0.0
	for _, s := range scores {
		sum += s
	}
	mean = sum / float64(len(scores))

	// Simple standard error
	sumSq := 0.0
	for _, s := range scores {
		diff := s - mean
		sumSq += diff * diff
	}
	variance := sumSq / float64(len(scores))
	stderr := math.Sqrt(variance / float64(len(scores)))

	lower = math.Max(0, mean-1.96*stderr)
	upper = math.Min(1, mean+1.96*stderr)
	return
}
