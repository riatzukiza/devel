// GovOne — DELEGATE-52 hardened governance pipeline.
//
// This is the MVP demonstrating:
//  1. Structured field ingest into a verified fact graph
//  2. Graph-backed retrieval (not flat FTS)
//  3. Coherence-gated inspection against verified edges
//  4. Human labeling pipeline integrated into Merkle-chained audit
//
// Architecture: classify → redact → retrieve → generate → inspect → rehydrate → audit
//
// DELEGATE-52 findings this addresses:
//   - LLMs silently corrupt ~25% of content after 20 interactions (frontier models)
//   - 80-98% of degradation comes from sudden critical failures
//   - Standard similarity metrics capture only ~25% of actual corruption
//   - Ground truth must live in a deterministic external graph
//   - Human labels are axioms, not approvals
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	govone "github.com/open-hax/govone/internal"
	"github.com/open-hax/govone/internal/graph"

	_ "modernc.org/sqlite"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("govone: %v", err)
	}
}

func run() error {
	ctx := context.Background()

	// Open SQLite database
	dbPath := "govone.db"
	if v := os.Getenv("GOVONE_DB"); v != "" {
		dbPath = v
	}

	db, err := sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}
	defer db.Close()

	// Enable FTS5
	if _, err := db.Exec("PRAGMA journal_mode=WAL"); err != nil {
		return fmt.Errorf("pragma: %w", err)
	}

	// Create pipeline with DELEGATE-52 hardened defaults
	config := govone.DefaultPipelineConfig()
	pipe, err := govone.NewPipeline(db, config)
	if err != nil {
		return fmt.Errorf("new pipeline: %w", err)
	}

	// Demo: Ingest a healthcare policy document
	fmt.Println("=== GovOne DELEGATE-52 Hardened Pipeline Demo ===")
	fmt.Println()

	doc := graph.Document{
		ID:         "doc-policy-001",
		TenantID:   "tenant-demo",
		SourceID:   "src-hipaa-manual",
		SourceName: "HIPAA Privacy Rule Manual",
		Content:    "HIPAA Privacy Rule requires covered entities to protect patient health information. The minimum necessary standard limits PHI disclosure to the minimum amount needed. Business associate agreements must be executed before sharing PHI with third parties.",
		Fields: map[string]string{
			"policy.title":        "HIPAA Privacy Rule",
			"policy.version":      "2024.1",
			"policy.requirements": "Covered entities must implement administrative, physical, and technical safeguards for PHI.",
			"policy.min_necessary": "Limit PHI disclosure to minimum amount needed for intended purpose.",
			"policy.baa":          "Business associate agreements required before sharing PHI with third parties.",
			"policy.penalties":    "Civil penalties up to $50,000 per violation, criminal penalties up to $250,000.",
		},
		Entities: []string{
			"HIPAA", "PHI", "Business Associate Agreement", "Covered Entity",
		},
	}

	result, err := pipe.IngestDocument(doc)
	if err != nil {
		return fmt.Errorf("ingest: %w", err)
	}

	fmt.Printf("Document ingested:\n")
	fmt.Printf("  Document node: %s\n", result.DocumentNodeID)
	fmt.Printf("  Field nodes:   %d\n", len(result.FieldNodeIDs))
	fmt.Printf("  Entity nodes:  %d\n", len(result.EntityNodeIDs))
	fmt.Printf("  Edges created: %d\n", result.EdgesCreated)
	fmt.Println()

	// Compute field similarities
	simCount, err := pipe.ComputeFieldSimilarity("tenant-demo", 0.3)
	if err != nil {
		return fmt.Errorf("field similarity: %w", err)
	}
	fmt.Printf("Inferred edges (field similarity): %d\n", simCount)
	fmt.Println()

	// Demo: Execute the pipeline with a query and model output
	modelOutput := "The HIPAA Privacy Rule requires business associate agreements. Civil penalties reach $250,000 per violation. The minimum necessary standard applies."

	resp, err := pipe.Execute(ctx, govone.Request{
		TenantID:    "tenant-demo",
		SessionID:   "session-demo-001",
		Interaction: 1,
		Query:       "What are the HIPAA requirements for PHI disclosure?",
		TopK:        5,
	}, modelOutput)
	if err != nil {
		return fmt.Errorf("execute: %w", err)
	}

	fmt.Printf("Pipeline execution result:\n")
	fmt.Printf("  Retrieved chunks: %d\n", len(resp.RetrievedChunks))
	fmt.Printf("  Graph nodes visited: %d\n", resp.GraphStats.NodesVisited)
	fmt.Printf("  Passed: %v\n", resp.Passed)

	if resp.InspectionResult != nil {
		fmt.Printf("  Inspection:\n")
		fmt.Printf("    Overall score: %.3f\n", resp.InspectionResult.OverallScore)
		fmt.Printf("    Passed: %v\n", resp.InspectionResult.Passed)
		fmt.Printf("    Critical failure: %v\n", resp.InspectionResult.CriticalFailure)
		fmt.Printf("    Claims scored: %d\n", len(resp.InspectionResult.ClaimScores))
		for _, cs := range resp.InspectionResult.ClaimScores {
			fmt.Printf("      - [%v] %.3f: %s\n", cs.Passed, cs.CoherenceScore, cs.ClaimText)
		}
	}
	fmt.Println()

	// Verify audit chain integrity
	brokenIndex, err := pipe.VerifyChain("tenant-demo")
	if err != nil {
		return fmt.Errorf("verify chain: %w", err)
	}
	if brokenIndex == -1 {
		fmt.Println("Audit chain: INTACT ✓")
	} else {
		fmt.Printf("Audit chain: BROKEN at index %d\n", brokenIndex)
	}

	// Show retrieved chunks
	if len(resp.RetrievedChunks) > 0 {
		fmt.Println()
		fmt.Println("Retrieved chunks:")
		for i, chunk := range resp.RetrievedChunks {
			fmt.Printf("  [%d] %.3f — %s (field: %s)\n",
				i+1, chunk.RelevanceScore,
				truncate(chunk.Content, 60),
				chunk.Provenance.FieldPath)
			fmt.Printf("      Edge support: S=%d I=%d V=%d coherence=%.3f\n",
				chunk.EdgeSupport.StructuralCount,
				chunk.EdgeSupport.InferredCount,
				chunk.EdgeSupport.VerifiedCount,
				chunk.EdgeSupport.CoherenceScore)
		}
	}

	// Serialize response as JSON
	fmt.Println()
	fmt.Println("Full response JSON:")
	respJSON, _ := json.MarshalIndent(resp, "", "  ")
	fmt.Println(string(respJSON))

	return nil
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
