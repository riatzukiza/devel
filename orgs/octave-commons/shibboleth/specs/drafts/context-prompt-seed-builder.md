# Context prompt seed builder

## Goal
Build the first normalized `context_prompts` seed artifact for prompts intended to act as `system` or `developer` context.

## Scope
Initial build should use curated local sources first:
- persona injections
- authority escalation
- developer mode
- benign context prompts

## Why now
We already built `task_prompts` seeds. The next dataset needed for the new promptbench is the parallel context/system prompt seed layer.

## Requirements
1. Produce a deterministic seed artifact separate from the main bundle.
2. Include both adversarial and benign context prompts.
3. Distinguish `role_channel` (`system` vs `developer`).
4. Preserve provenance and stable IDs.
5. Write at least:
   - `context_prompts.edn`
   - `context_prompts.parquet`
   - `manifest.edn`

## Initial source mapping
- `persona-injections` -> adversarial, `system`
- `authority-escalation` -> adversarial, `system`
- `developer-mode` -> adversarial, `developer`
- `benign-contexts` -> role comes from each row

## Definition of done
- A reproducible merged context prompt seed artifact exists on disk.
- It can be paired with the existing task prompt seed artifact for request composition work.
