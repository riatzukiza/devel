# Skill Optimization Guide

## Purpose
Provide a concise, repeatable method for optimizing OpenCode skills for clarity, reliability, and maintainability.

## Optimization Principles
1. **Structured layout**: Keep prompts and skills in explicit blocks (goal, inputs, constraints, output).
2. **Success criteria first**: Define completion conditions before writing steps.
3. **Output contracts**: Require explicit formats, sections, and constraints.
4. **Examples over adjectives**: Use concrete examples instead of vague style words.
5. **Lightweight self-checks**: Add a short checklist or rubric before final output.
6. **Iterate deliberately**: Draft, review, refine instead of one-shot.

## Techniques to Apply
1. **Use a fixed template**
   - Stick to Goal, Use/Do Not Use, Inputs, Steps, Output, References.
   - Avoid adding new section types unless needed.
2. **Compress ambiguity**
   - Replace generic phrases like "consider" with explicit actions and conditions.
   - Add constraints for tools, files, and outputs.
3. **Make outputs testable**
   - Provide required artifacts, paths, and validation steps.
   - Add acceptance checks that can be verified.
4. **Prefer references over duplication**
   - Cross-link to existing skills for repeated workflows.
   - Avoid repeating global rules already in `AGENTS.md`.
5. **Add a validation pass**
   - Include a checklist for completeness, correctness, and alignment to templates.

## Optimization Checklist
- Goal states a single, clear outcome.
- Use/Do Not Use gates are explicit and non-overlapping.
- Inputs list everything needed before execution.
- Steps are ordered, actionable, and testable.
- Output lists concrete deliverables.
- References point to existing docs or skills.
- No duplicate guidance that already exists in `AGENTS.md`.

## References
- Prompt Builder 2026: https://promptbuilder.cc/blog/prompt-engineering-best-practices-2026
- DigitalOcean Prompt Engineering: https://www.digitalocean.com/resources/articles/prompt-engineering-best-practices
- Kontent.ai Prompt Structures: https://kontent.ai/blog/the-only-5-prompt-structures-you-need/
- Maxim AI evaluation frameworks: https://www.getmaxim.ai/articles/prompt-evaluation-frameworks-measuring-quality-consistency-and-cost-at-scale/
