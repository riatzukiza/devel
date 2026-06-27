# Specifications Organization

This folder contains technical specifications derived from the documented implementation in `docs/notes/`.

## Folder Structure

```
specs/
├── README.md                    # This file - overview of spec organization
├── complete/                   # Specs ready for manual inspection and signoff
│   ├── core/               # Core framework specs
│   ├── agents/            # Agent framework specs
│   ├── benchmarks/         # Benchmark system specs
│   └── tools/             # Tool system specs
├── review/                     # Specs undergoing agent review
│   ├── pending/           # Specs waiting for review
│   ├── approved/           # Agent-approved specs
│   └── archived/           # Historical specs
└── dependencies/             # Cross-spec dependencies and relationships
```

## Workflow

1. **specs/complete/** - Human-reviewed specs ready for implementation
   - Specs are moved here when agents have manually inspected and approved
   - These are considered "complete" and ready for production use

2. **specs/review/** - Active review area
   - New specs are initially placed here
   - Agents can review, comment, and request changes
   - Once approved, specs move to `specs/complete/`

3. **specs/dependencies/** - Cross-spec tracking
   - Documents relationships between different spec areas
   - Tracks dependency chains between core, agents, benchmarks, and tools

## Spec Categories

Based on the documented implementation, we have these main areas:

### Core Framework Specs
- Ollama client interface
- Tool registry and validation
- Event sourcing and logging
- Message bus architecture
- File locking and resource management

### Agent Framework Specs
- Supervisor tree pattern
- Agent lifecycle management
- Model tiering and budgeting
- Hierarchical coordination
- State management and persistence

### Benchmark Specs
- Tool-calling evaluation
- Case generation and templates
- Scoring and metrics
- Decoy generation
- Interactive benchmark suites

### Tool System Specs
- Tool definition and registration
- Argument validation with clojure.spec.alpha
- Schema generation (JSON/OpenAI)
- Tool execution and error handling

## Status Tracking

Each spec file should include:
- **Status**: draft, review, approved, archived
- **Dependencies**: Related specs
- **Version**: Semantic versioning
- **Last Updated**: Timestamp of changes
- **Owner**: Primary responsible party (core/agents/benchmarks/tools)

This organization allows for parallel development workflows between human spec reviewers and the agent system, ensuring clear separation of concerns and traceability of specification evolution.