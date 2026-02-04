# High-level planning across Promethean + benchmarks

## Scope
Focus modules:
- `orgs/octave-commons/promethean-agent-system`
- `orgs/riatzukiza/ollama-benchmarks`
- `orgs/riatzukiza/promethean`

## Code files and references
- `orgs/octave-commons/promethean-agent-system/README.md` (architecture + core components, lines 1-147)
- `orgs/octave-commons/promethean-agent-system/AGENTS.md` (architecture principles + tool/module defs, lines 1-176)
- `orgs/riatzukiza/ollama-benchmarks/README.md` (benchmark workflows + outputs, lines 1-205)
- `orgs/riatzukiza/promethean/README.md` (workspace structure, package ecosystem, automation pipelines, lines 1-238)
- `docs/MASTER_CROSS_REFERENCE_INDEX.md` (ecosystem integration patterns, lines 1-189)

## Existing issues / PRs
- None referenced in workspace.

## Requirements
1. Treat EDN outputs from `ollama-benchmarks` as the source of truth; aggregated stats are strictly reporting artifacts.
2. Place model/tool selection inputs in the Promethean agent system configuration (Clojure side), not in the benchmarking tool itself.
3. Produce a high-level integration map describing how raw EDN benchmark data feeds model/tool decisions in the agent system.
4. Identify the key interfaces between the Clojure agent runtime, the existing TypeScript Promethean services (notably MCP), and the Babashka benchmarking suite.
5. Define a staged plan (phased) that supports the long-term migration goal of converting Promethean to Clojure script while keeping the system operational.
6. Capture open questions or missing docs that block deeper design decisions.

## Definition of done
- A concise plan exists with phases, owners/modules, and validation steps, reflecting EDN truth and agent config ownership.
- Integration points and data flow are documented at a high level, including MCP consolidation into the Clojure agent system.
- Risks and unknowns are listed for follow-up.
