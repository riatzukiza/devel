# GovOne — DELEGATE-52 Hardened Governance Pipeline

> *The ground truth lives in a deterministic external graph the model queries but cannot corrupt. Human labeling provides the axiomatic verified layer. Automatic coherence checks eliminate worst-case outcomes. This is augmented intelligence, not human-in-the-loop — the human is epistemically upstream, authoring axioms, not downstream approving outputs.*

## Why This Exists

Microsoft Research's **DELEGATE-52** paper (arxiv 2604.15597, April 2026) revealed:

| Finding | Implication |
|---------|-------------|
| Frontier models corrupt ~25% of content after 20 interactions | You cannot trust LLM output at face value |
| 80-98% of degradation comes from **sudden critical failures** | Gradual drift metrics miss the real damage |
| Standard similarity metrics (ROUGE-L, BERTScore, cosine) capture only ~25% of corruption | Traditional NLP evaluation is nearly useless |
| Agentic tool use made corruption **6% worse** | More capability ≠ more reliability |
| Errors are **sparse but catastrophic** | You need claim-level verification, not document-level scoring |

GovOne hardens against every one of these findings.

## Architecture

```
classify → redact → retrieve → generate → inspect → rehydrate → audit chain
                ↑                  ↑          ↑                    ↑
            Graph-backed      Claims       Coherence          Merkle chain
            fact store        extracted    scored against     every step
                              (no LLM)     verified graph
```

### Key Design Decisions

**1. Retrieve is graph-backed, not flat FTS**
- Documents are ingested as structured fields into a verified fact graph
- Three edge types: structural (deterministic), inferred (probabilistic), verified (human axioms)
- Retrieval traverses structural + verified edges, deliberately underweighting inferred edges
- Full provenance: every chunk traces back to source_name, document_id, field_path

**2. Inspect checks claims against verified edges, not just placeholders**
- Claims extracted using structured methods (regex, field parsing) — **no LLM in the verification loop**
- Each claim scored against the subgraph: `coherence = (verified + structural) / total`
- DELEGATE-52 "ready" threshold: 0.98
- Critical failure detection: tracks score deltas between interactions, flags drops ≥ 10%

**3. Human labels are axioms, not approvals**
- The human is epistemically **upstream** — authoring axioms into the graph
- Labels become verified edges with full provenance (who, when, why, confidence)
- Every label is a first-class audit record in the Merkle chain

**4. Audit chain is tamper-evident**
- Merkle-chained SQLite: each record's hash includes the previous record's hash
- Chain verification detects any tampering
- Complete provenance for every decision in the pipeline

## Edge Schema

### Structural Edges (deterministic, machine-extracted)
```
document --[contains]--> field
field    --[mentions]--> entity
document --[links_to]--> document
field    --[field_path]--> parent_field
```

### Inferred Edges (probabilistic, computed)
```
field   --[similar_to]--> field   (Jaccard token overlap, threshold ≥ 0.3)
entity  --[co_refers]-->  entity  (co-occurrence in same field)
claim   --[shared_label]--> claim (shared structural labels)
```

### Verified Edges (human-labeled ground truth)
```
claim --[verified_as]--> fact      (human confirmed true)
claim --[rejected_as]--> falsehood (human confirmed false)
claim --[uncertain_as]--> uncertain (human unsure)
```

## Quick Start

```bash
# Build
go build ./cmd/govone/

# Run demo
go run ./cmd/govone/

# Output shows:
# - Document ingest (fields, entities, edges)
# - Graph-backed retrieval with provenance
# - Coherence-gated claim inspection
# - Merkle chain verification
```

## Integration with Ecosystem

GovOne fits into the governance stack alongside:

- **CrabTrap** (`orgs/shuv/CrabTrap`) — HTTP proxy that evaluates outbound requests against security policies. GovOne can feed verified facts into CrabTrap's policy judge.
- **ussy-sentinel** (`orgs/ussyverse/.../ussy-sentinel`) — Immunological self/non-self code governance. GovOne's verified graph provides the "self" profile for policy documents.
- **ussy-parliament** (`orgs/ussyverse/.../ussy-parliament`) — Parliamentary procedure for agent self-governance. GovOne's audit chain feeds into Parliament's journal for motion verification.
- **OpenPlanner** (`orgs/open-hax/openplanner`) — Central planning system. GovOne provides verified facts for planning decisions.

## DELEGATE-52 Hardening Checklist

| DELEGATE-52 Finding | GovOne Countermeasure | Status |
|---------------------|----------------------|--------|
| ~25% corruption after 20 interactions | Graph-backed retrieval with verified edges | ✓ |
| 80-98% from critical failures | Critical failure detection (delta ≥ 10%) | ✓ |
| Similarity metrics capture only 25% | Claim-level coherence scoring against graph | ✓ |
| Agentic tool use makes it worse | No LLM in verification loop | ✓ |
| Errors sparse but catastrophic | Per-claim scoring, weakest-link gate | ✓ |
| Corruption compounds over time | Interaction tracking with prior score comparison | ✓ |

## Project Structure

```
govone/
├── cmd/govone/main.go           # Demo entry point
├── internal/
│   ├── pipeline.go              # Main orchestrator
│   ├── classifier/classifier.go # Rule-based entity extraction
│   ├── redact/redact.go         # PII redaction
│   ├── retrieve/retrieve.go     # Graph-backed retrieval
│   ├── inspect/coherence.go     # Coherence-gated inspection
│   ├── audit/audit.go           # Merkle-chained audit trail
│   ├── labeling/labeling.go     # Human labeling pipeline
│   ├── graph/
│   │   ├── graph.go             # Node/edge store with FTS5
│   │   └── ingest.go            # Document ingest + field similarity
│   └── controlplane/controlplane.go # CRUD for tenants, policies
└── go.mod
```

## References

- [DELEGATE-52 Paper](https://arxiv.org/abs/2604.15597)
- [DELEGATE-52 GitHub](https://github.com/microsoft/delegate52)
- [DELEGATE-52 Dataset](https://huggingface.co/datasets/microsoft/delegate52)
