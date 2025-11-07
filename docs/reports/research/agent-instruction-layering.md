# Agent Instruction Layering Frameworks and Prompt Resilience
_Date: 2025-11-05_

## Summary
- Leading agent frameworks allow layered or replaceable instruction sets; they expose hooks for dynamic system prompts, modular tools, and runtime role control.[^1][^2][^3][^5]
- Guardrail and protocol stacks (NeMo Guardrails, MCP) treat instructions as configurable assets with capability negotiation, enabling explicit overrides per task.[^4][^6]
- Research and platform APIs stress hierarchical instruction priority and separated system prompts, offering patterns Codex OpenCode can adopt to stay robust when optional guidance layers appear.[^7][^8]

## Methodology
Reviewed primary documentation for LangChain/LangGraph, Microsoft AutoGen, CrewAI, NVIDIA NeMo Guardrails, Swarms, and Model Context Protocol. Cross-referenced platform guidance from OpenAI and Anthropic to extract proven patterns for instruction precedence, dynamic prompt updates, and tool negotiation. Findings focus on actionable implications for Codex OpenCode baseline prompts.

## Representative Frameworks & References
- **LangChain / LangGraph agents** – Middleware can rewrite the system prompt at runtime (`@dynamic_prompt`) while agent graphs coordinate models and tools.[^1]
- **Microsoft AutoGen** – Conversable agents change behavior via new system messages and registered auto-reply functions, enabling hierarchical hand-offs.[^2]
- **CrewAI** – Injects default instructions by role but lets teams override slices or provide fully custom system/prompt templates for deterministic control.[^3]
- **NVIDIA NeMo Guardrails** – Treats "general instructions" like system prompts, appended to every call, and supports task-specific prompt overrides plus rails for input/output filtering.[^4]
- **Swarms** – Exposes configurable `system_prompt`, auto-generated prompts, and runtime updates (`update_system_prompt`, `auto_generate_prompt`) alongside MCP tooling connectors.[^5]
- **Model Context Protocol (MCP)** – Defines capability negotiation and exposes prompts/resources as first-class primitives so hosts can discover and prioritize server-provided instructions.[^6]
- **Instruction hierarchy research & platform APIs** – OpenAI highlights privileged instruction tiers resisting prompt injection,[^7] while Anthropic’s API separates system prompts and MCP server lists from user turns.[^8]

## How Override Layers Are Handled
1. **Dynamic system prompt staging** – Frameworks expose hooks (middleware, `system_template`, `update_system_prompt`) letting higher-level orchestrators augment or replace baseline instructions without editing the root prompt.
2. **Capability handshake before execution** – MCP and NeMo Guardrails negotiate available prompts/tools upfront, signalling when a new instruction layer should take precedence.[^4][^6]
3. **Built-in fallbacks** – CrewAI’s hidden defaults and Swarms’ auto-generated prompts ensure the agent still runs if no custom instructions are supplied, while still permitting explicit overrides.[^3][^5]
4. **Task-scoped instructions** – NeMo Guardrails and LangChain support per-task prompt routing so specialized rails or middleware only apply when relevant, reducing conflicts with global rules.[^1][^4]

## Guidance for Codex OpenCode Global Prompts
- **Define explicit priority ordering**: Mirror the instruction hierarchy pattern—baseline system > workspace developer prompts > optional framework prompts > user instructions—to align with OpenAI’s findings on privileged instructions resisting injections.[^7]
- **Surface detection hooks**: When optional layers (Serena, MCP servers, guardrails) are present, log or annotate the prompt stating which layer injected new rules. Tie into Anthropic-style separate `system` fields so additional instructions do not mingle with user turns.[^8]
- **Modularize baseline instructions**: Split global prompts into capabilities (tool policy, safety, reporting) so middleware can selectively replace sections, similar to CrewAI prompt slices and LangChain middleware segments.[^1][^3]
- **Guard against silent overrides**: Require optional frameworks to declare the scope of their changes (e.g., "Serena overrides planning protocol only") before they execute. If multiple layers compete for the same slot, fallback to the highest-priority instruction and emit a warning, following NeMo’s explicit rails configuration.[^4]
- **Document expected handshake**: Encourage frameworks to expose readiness signals (e.g., MCP `initialize`, Serena onboarding). Codex prompts should reference that handshake to decide when to honor external instructions.[^6]

## Dynamic Prompt Analysis & Prefiltering Ideas
1. **Initialization audit** – During agent start-up, inspect system and developer channels to compare against a checklist of required clauses; flag gaps or conflicting directives before accepting optional layers.
2. **Capability registry** – Maintain a runtime registry mirroring MCP’s `tools/list` and `prompts/list` outputs, capturing which frameworks supplied which directives. Use it to resolve ties deterministically.[^6]
3. **Conflict simulation** – For each new instruction layer, run a lightweight dry-run (e.g., ask the model to restate its priorities) to ensure privileged instructions remain intact, leveraging instruction hierarchy testing principles.[^7]
4. **Change diffing** – Track hashed versions of baseline prompts; if an optional layer modifies text outside its allowed section, reject or sandbox the change, similar to CrewAI’s explicit template overrides.[^3]
5. **Fallback heuristics** – If prompt analysis detects missing critical clauses (tool safety, logging), inject minimal defaults inspired by Swarms’ auto-generated prompts so execution continues safely.[^5]

## References
[^1]: LangChain Agents documentation – dynamic middleware and system prompt overrides. <https://docs.langchain.com/oss/python/langchain/agents>
[^2]: Microsoft AutoGen multi-agent conversation framework – system message overrides and reply registration. <https://microsoft.github.io/autogen/0.2/docs/Use-Cases/agent_chat/>
[^3]: CrewAI prompt customization guide – default instruction injections and custom template overrides. <https://docs.crewai.com/en/guides/advanced/customizing-prompts>
[^4]: NVIDIA NeMo Guardrails configuration guide – general instructions, per-task prompts, and rails. <https://docs.nvidia.com/nemo/guardrails/latest/user-guides/configuration-guide.html>
[^5]: Swarms Agent reference – configurable `system_prompt`, auto-generated prompts, MCP integration. <https://docs.swarms.world/en/latest/swarms/structs/agent/>
[^6]: Model Context Protocol architecture overview – capability negotiation and prompts/resources as primitives. <https://modelcontextprotocol.io/docs/learn/architecture>
[^7]: OpenAI, "The Instruction Hierarchy" – prioritizing privileged instructions to resist prompt injections. <https://openai.com/index/the-instruction-hierarchy/>
[^8]: Anthropic Messages API – explicit system prompt parameter, MCP server configuration. <https://docs.claude.com/en/api/messages>
