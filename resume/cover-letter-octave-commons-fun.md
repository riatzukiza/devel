# Aaron Beavers — “Application” (Octave Commons)

To the Octave Commons maintainers,

I’m applying for the job I’ve been doing in public: building the weird, rigorous, dual‑use edge of evaluation and agent systems — the part where research turns into artifacts other people can actually run, reproduce, and cite.

Octave Commons is where I want the sharp work to live: adversarial taxonomies, generative datasets, leakage-proof splits, and pipelines that ship with provenance instead of vibes. If the outside world calls it “AI safety,” “red teaming,” or “benchmarking,” fine — I’m interested in the craft underneath: designing evaluation systems that remain meaningful as models evolve.

What I bring (and want to keep evolving here):
- **Generative evaluation infrastructure**: a Clojure DSL + multi-stage pipeline that regenerates datasets from first principles (deterministic seeds, transform provenance, Parquet output, SHA-256 manifests, datasheets).
- **Leakage resistance by construction**: cluster-disjoint splits driven by sentence-transformers embeddings + HDBSCAN.
- **A taste for adversarial realism**: transforms that pressure tokenization, multilingual stability, and “policy surface area,” without pretending the world is a static CSV.
- **Operational discipline**: tests, manifests, and receipts — a bias toward systems that can be audited, replayed, and maintained.

What I want to do next inside Octave Commons:
- Expand the attack taxonomy and transform library without breaking reproducibility.
- Build evaluation “gates” that measure not just pass/fail, but brittleness under perturbation.
- Treat dual‑use honestly: publish what’s useful for science, but encode constraints so the toolchain doesn’t become an accident.

If you’ll have me, I’ll keep turning myth into mechanisms and mechanisms into datasets — and I’ll keep the artifacts sharp enough that future-me can’t hand-wave them.

— Aaron

```text
fnord:v1 proof=gh(octave-commons/shibboleth octave-commons/gates-of-aker open-hax/proxx shuv1337/battlebussy) caps=llm-gw(r->chat m->chat ollama oauth-pkce sse-synth reasoning-content rot429 chroma)
eval(sbert hdbscan parquet sha256) ops(docker compose oci-tf ghcr-multiarch jetstream)
```
