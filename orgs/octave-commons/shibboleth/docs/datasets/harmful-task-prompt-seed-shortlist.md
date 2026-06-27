---
title: "Harmful Task Prompt Seed Shortlist"
description: "Candidate harmful task-prompt datasets to seed Shibboleth's task prompt corpus for multilingual generation"
tags: ["shibboleth", "datasets", "harmful-tasks", "evaluation", "multilingual"]
created: 2026-03-18
status: draft
---

# Harmful Task Prompt Seed Shortlist

## Purpose
Identify **harmful task prompt** datasets that are not already explicitly documented in the repo and are strong candidates for seeding a new `task_prompts` dataset.

This shortlist is for **task-level illicit requests** (the thing the user is asking for), not primarily for jailbreak wrappers or malicious system/developer prompt contexts.

## Selection criteria
Priority goes to datasets that are:
- direct harmful or prohibited-use **user requests**
- useful as seeds for multilingual generation
- reasonably well-known in current safety benchmarking
- category-diverse enough to support a useful taxonomy
- distinct from the existing jailbreak-centric seeds already called out in current docs

## Recommended ingest priority

### Tier 1 — ingest first

#### 1) HarmBench
- Type: harmful behavior / robust refusal benchmark
- Why it fits:
  - direct harmful requests rather than only jailbreak wrappers
  - widely used in recent robust-refusal evaluation
  - strong fit for seeding illicit task asks
- Best use in Shibboleth:
  - primary seed corpus for adversarial `task_prompts`
  - category mapping into harm taxonomy
- Risks / caveats:
  - likely overlap with other harmful behavior benchmarks
  - should dedupe against AdvBench / HEx-PHI / MaliciousInstruct
- Seed verdict: **excellent**
- Sources:
  - https://arxiv.org/abs/2402.04249
  - https://github.com/centerforaisafety/HarmBench
  - https://huggingface.co/datasets/AlignmentResearch/HarmBench

#### 2) HEx-PHI
- Type: harmful instruction benchmark aligned to prohibited-use style categories
- Why it fits:
  - highly suitable for direct illicit task requests
  - policy-oriented, likely useful for mapping to “what policy class is being invoked?”
- Best use in Shibboleth:
  - seed corpus for adversarial task prompts
  - category schema inspiration for harmful-task taxonomy
- Risks / caveats:
  - should verify exact license and raw prompt composition before ingestion
  - likely some conceptual overlap with HarmBench/AdvBench
- Seed verdict: **excellent**
- Sources:
  - https://huggingface.co/datasets/LLM-Tuning-Safety/HEx-PHI

#### 3) AdvBench
- Type: canonical harmful-behavior / harmful-instruction benchmark
- Why it fits:
  - one of the standard seed sets for harmful request evaluation
  - directly useful for task-prompt extraction
- Best use in Shibboleth:
  - foundational adversarial task-prompt seed set
  - good for comparability with existing jailbreak literature
- Risks / caveats:
  - heavily reused benchmark; watch for overlap/template familiarity
- Seed verdict: **very strong**
- Sources:
  - https://huggingface.co/datasets/AlignmentResearch/AdvBench

#### 4) MaliciousInstruct
- Type: harmful instruction dataset
- Why it fits:
  - directly task-oriented
  - complementary to AdvBench/HEx-PHI
- Best use in Shibboleth:
  - expand task diversity after dedupe
  - add additional seed requests for multilingual generation
- Risks / caveats:
  - appears smaller / less canonical than HarmBench and AdvBench
  - must inspect prompt composition and provenance carefully
- Seed verdict: **strong**
- Sources:
  - https://huggingface.co/datasets/walledai/MaliciousInstruct

### Tier 2 — ingest after core set

#### 5) AgentHarm
- Type: harmful benchmark for LLM agents / multi-step tasks
- Why it fits:
  - extends beyond simple direct asks into agentic harmful objectives
  - useful for future tool-abuse / multi-step task tracks
- Best use in Shibboleth:
  - seed specialized task prompts for tool abuse / agent workflow variants
  - future session/task decomposition work
- Risks / caveats:
  - smaller than broad harmful prompt sets
  - not the best first bulk seed for general direct asks
- Seed verdict: **high-value specialized source**
- Sources:
  - https://huggingface.co/datasets/ai-safety-institute/AgentHarm
  - https://arxiv.org/abs/2410.09024

#### 6) CySecBench
- Type: cybersecurity-focused harmful prompt benchmark
- Why it fits:
  - valuable vertical-specific harm source
  - useful for cyber subset of task prompts
- Best use in Shibboleth:
  - domain-specific task prompt slice
  - later specialized multilingual generation for cyber misuse requests
- Risks / caveats:
  - narrow vertical, not a general harmful task corpus
  - likely should be partitioned separately in reporting
- Seed verdict: **specialized but useful**
- Sources:
  - https://arxiv.org/abs/2501.01335

### Tier 3 — secondary / mostly eval-side

#### 7) StrongREJECT
- Type: jailbreak evaluation benchmark with forbidden/malicious prompts and rubric-based evaluation
- Why it fits:
  - contains harmful prompt material
  - useful as a benchmark and source of hard cases
- Best use in Shibboleth:
  - eval-side benchmark
  - secondary seed source for hard adversarial task prompts
- Risks / caveats:
  - more benchmark-oriented than broad training-seed oriented
  - smaller and partially composed from prior datasets; provenance must be tracked carefully
- Seed verdict: **secondary seed / strong eval asset**
- Sources:
  - https://arxiv.org/abs/2402.10260
  - https://strong-reject.readthedocs.io/
  - https://huggingface.co/datasets/Machlovi/strongreject-dataset

## What to keep separate from this task-prompt seed set
These are valuable, but should not be the core of the new `task_prompts` corpus:
- All-Prompt-Jailbreak
- WildJailbreak
- general jailbreak wrapper corpora
- prompt-injection / system-override corpora where the main artifact is the **wrapper/context** rather than the illicit task

These belong more naturally in:
- `context_prompts`
- eval transforms / wrapper suites
- placement-mode experiments (`system`, `developer`, direct `user`)

## Recommended first ingestion order
1. HarmBench
2. HEx-PHI
3. AdvBench
4. MaliciousInstruct
5. AgentHarm
6. CySecBench
7. StrongREJECT

## Ingestion notes for Phase 1
Before import, verify for each dataset:
- license and redistribution constraints
- exact field names and splits
- whether examples are direct harmful asks vs jailbreak wrappers
- overlap/duplication with existing sources
- harm taxonomy coverage
- whether prompts contain answer targets or only requests

## Suggested Shibboleth mapping
- `task_prompts.intent_label`:
  - `adversarial` for illicit harmful requests
  - `benign` for matched safe controls / lookalikes from separate benign corpora
- `task_prompts.category`:
  - map into your harm taxonomy
- `task_prompts.dataset_origin`:
  - preserve exact source benchmark(s)

## Immediate next step
Build a machine-readable ingest plan that lists:
- dataset
- host URL
- expected prompt field(s)
- expected label field(s)
- direct-task vs wrapper confidence
- ingestion priority
- license status
