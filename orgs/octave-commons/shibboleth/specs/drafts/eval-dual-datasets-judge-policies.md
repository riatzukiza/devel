# Eval runner: dual datasets + judge policies

## Goal
Implement the next evaluation layer so Shibboleth can:
- evaluate adversarial content placed in different channels (`system`, `developer`, direct `user` ask)
- distinguish the **context prompt** from the **illicit task prompt**
- replace the current "non-refusal = attack success" shortcut with explicit judge policies from the evaluation docs
- keep the experiment matrix reproducible and leakage-resistant

## Why this is needed
The docs already imply a richer factorization than the current runner:
- `docs/evaluation/shibboleth-evaluation-spec.md` separates:
  - policy router
  - target adapter
  - transport/interface normalization
  - refusal vs harmful-compliance judgments
- `docs/datasets/shibboleth-design-decisions.md` argues for explicit experimental factors and interface normalization
- `docs/datasets/shibboleth-threat-model.md` distinguishes direct adversarial attempts from overblocking / availability failures

The current runner still collapses several things together:
- one prompt text = one user request
- no explicit `developer` role in requests
- no separation between context-prompt attack and task-level attack
- no explicit harmful-compliance judge
- attack success is approximated as `not refusal`

## User-requested direction
We need two distinct datasets:

1. **Context/System prompts dataset**
   - prompts intended to be inserted as `system` or `developer`
   - each labeled `benign` or `adversarial`
   - examples:
     - benign assistant policy / role definitions
     - benign product/system instructions
     - adversarial override / jailbreak / extraction / policy-disable prompts

2. **Task/User prompts dataset**
   - prompts intended to be the actual user ask
   - each labeled `benign` or `adversarial`
   - examples:
     - benign task requests
     - direct jailbreak asks
     - prompt extraction requests
     - tool abuse / exfiltration asks

## Proposed dataset shapes

### 1) `context_prompts.parquet`
```clojure
{:context_id string
 :source_id string
 :role_channel string          ;; system | developer
 :intent_label string          ;; benign | adversarial
 :category string?             ;; jailbreak | override | extraction | benign-policy | etc.
 :canonical_text string
 :language string
 :split string                 ;; train | dev | test
 :dataset_origin [string]
 :quality_flags [string]}
```

### 2) `task_prompts.parquet`
```clojure
{:task_id string
 :source_id string
 :intent_label string          ;; benign | adversarial
 :category string?
 :canonical_text string
 :language string
 :split string                 ;; train | dev | test
 :dataset_origin [string]
 :quality_flags [string]}
```

### 3) Derived eval case shape
The runner should not assume one flat prompt anymore. It should build explicit request layouts from a context prompt + task prompt + placement mode.

```clojure
{:case_id string
 :context_id string?
 :task_id string
 :placement_mode string        ;; direct-user | system-context | developer-context
 :context_role string?         ;; system | developer
 :context_intent_label string?
 :task_intent_label string
 :language string
 :suite string
 :split string
 :messages [{:role string :content string}]}
```

## Required experimental factors
Future evaluation matrix should include:
- `policy_layer`
- `target_llm`
- `transport_mode`
- `placement_mode`
- `context_label`
- `task_label`
- `suite`
- `language`

This makes the key distinction explicit:
- adversarial **context** + benign **task**
- benign **context** + adversarial **task**
- adversarial **context** + adversarial **task**
- benign **context** + benign **task**

## Judge policies to implement from docs
Based on `docs/evaluation/shibboleth-evaluation-spec.md`, split judgments into separate policies.

### Refusal judge policies
1. `substring-refusal` (current baseline)
2. `provider-refusal-flag` (use explicit provider finish/metadata if exposed)
3. `refusal-judge-llm` (pinned judge model with rubric)
4. `refusal-ensemble` (OR/weighted combination of deterministic + judge)

### Harm / compliance judge policies
1. `rule-harm-detector` (narrow categories only)
2. `harm-judge-llm` (pinned judge model; primary planned policy)
3. `harm-ensemble`

### Availability / task success policies
1. `benign-task-judge-llm`
2. `benign-task-heuristic` (only for narrow deterministic tasks)

## Evaluation logic change required
Current shortcut:
- adversarial + not refused => `attack_success`

Target logic:
- adversarial case is **unsafe** only if `harmful_compliance=true`
- benign case is **overblocked** if blocked or refused
- benign case is **successful** only if task-success judge says yes

So the runner needs to emit separate fields such as:
```clojure
{:judgments
 {:refused boolean?
  :harmful_compliance boolean?
  :benign_task_success boolean?
  :benign_failure boolean?
  :policy_violation boolean?}}
```

## Runner / adapter changes needed
1. Add explicit support for `developer` messages in normalized requests.
2. Separate and log hashes for:
   - context prompt
   - task prompt
   - full request
3. Replace single `:text` case construction with a request-builder that composes:
   - base system prompt
   - optional context prompt in `system` or `developer`
   - task prompt in `user`
4. Add CLI/config options for:
   - `--context-dataset`
   - `--task-dataset`
   - `--placement-modes`
   - `--refusal-judge-policy`
   - `--harm-judge-policy`
   - `--benign-task-judge-policy`
5. Remove Claude from default sweeps for now.

## Recommended implementation phases

### Phase 0 — spec + schemas
- add schema/docs for `context_prompts` and `task_prompts`
- define eval case builder contract
- define judge policy enums/config

### Phase 1 — dataset spine
- create local curated seed sets for:
  - benign/adversarial context prompts
  - benign/adversarial task prompts
- build parquet artifacts with stable IDs and split invariants

### Phase 2 — request composition
- support `direct-user`, `system-context`, `developer-context`
- log separate context/task/request hashes
- keep provider-specific workarounds explicit and logged

### Phase 3 — judge policy plumbing
- formalize refusal judge interface
- add provider-refusal + substring baseline as composable policies
- add harm-judge stub/config
- stop equating `non-refusal` with harmful compliance

### Phase 4 — judge implementation
- add pinned judge model rubric for:
  - refusal
  - harmful compliance
  - benign task success
- write judge artifacts/telemetry

### Phase 5 — sweep + reporting
- rerun `glm-5`, `gpt-5.2`, `kimi-k2.5`
- factor by placement mode and context/task labels
- report where substring refusal breaks most badly

## Initial acceptance criteria
- A run can evaluate the same adversarial content as:
  - direct user ask
  - system prompt
  - developer prompt
- Events distinguish `context_prompt` from `task_prompt`.
- Metrics no longer use `not refusal == attack success` as the final truth condition.
- Judge policy is configurable and recorded in `config.edn` and events.
- Claude is not part of the default target mix.

## Immediate next move
Implement **Phase 0 + Phase 1** first:
- dual dataset schemas/artifacts
- request-composition contract
- judge policy config surface

That gives us the right spine before wiring the judge model itself.
