# Deep Research Prompt — Non-English Single-Language Adversarial Prompt Datasets

You are acting as a **senior ML security researcher**. Your task is to **verify (or falsify)** the claim that **public, high-quality adversarial prompting datasets are sparse outside English**.

This investigation must take a different angle than “multilingual corpora.” Instead, focus on **single-language adversarial-prompt datasets** in **non-English** languages, prioritizing:

- **Mandarin Chinese (zh)**
- **Japanese (ja)**
- **German (de)**
- **Polish (pl)**
- **Russian (ru)**
- **Ukrainian (uk)**
- **Spanish (es)**

The output must be **citation-backed**, reproducible, and aggressively skeptical of marketing claims.

---

## 1) Definitions and Inclusion Criteria

A dataset qualifies as **in-scope** only if it meets **all** of the following:

1. **Primary language is one of the target languages** (dataset contains substantial, natural text in that language).
2. Contains **adversarial prompts** intended to jailbreak/prompt-inject/policy-probe/tool-abuse/override instructions.
3. Has **clear labeling** (at minimum adversarial vs benign; better: attack type/harm category/outcome).
4. Is **publicly accessible** (downloadable or available via an official repository or dataset host).
5. Has **clear licensing** (ideally commercial-permissible; at minimum license text is present).

**Exclude**:
- Datasets that are just machine-translated English templates unless there is strong evidence of **native-speaker authorship** or **language-native adversarial strategy**.
- Papers that describe a dataset but do not release it.
- Pure toxicity datasets without adversarial intent (unless used explicitly for jailbreak/prompt-injection detection).

---

## 2) Research Questions

Answer these questions with evidence:

### RQ1 — Existence & Sparsity
- For each target language, what **single-language adversarial prompting datasets** exist?
- Are there **0–2** credible datasets per language (sparse) or many (not sparse)?

### RQ2 — Quality & “Production-Grade” Readiness
For each dataset found, evaluate:
- Native-speaker vs translation pipeline
- Label quality and schema
- Diversity (template inflation? dedup?)
- Benchmarks used and reported error rates
- Dataset maintenance recency

### RQ3 — Coverage of Modern Failure Modes
Does the dataset include any of:
- Multi-turn escalation
- Prompt injection into documents/web content
- Tool-use manipulation / agentic attacks
- Unicode/homoglyph/obfuscation
- Code-mixing within the language community (e.g., JP + EN loanwords; RU + EN technical jargon)
- “Availability attacks” (token/resource exhaustion; refusal/over-blocking triggers)

### RQ4 — Where the Data *Should* Exist but Doesn’t
Identify “near misses,” such as:
- Benchmarks only (no training set)
- Closed/proprietary datasets
- Datasets referenced by blogs but not actually released

---

## 3) Search Strategy (Must Be Reproducible)

### 3.1 Core venues
Search these places explicitly:
- arXiv (cs.CL, cs.CR, stat.ML)
- ACL Anthology (ACL/EMNLP/NAACL)
- Security venues (USENIX, IEEE S&P, CCS, NDSS)
- Hugging Face Datasets
- GitHub repos (dataset releases)

### 3.2 Keyword packs (use language-local terms)
For each target language, search in **English and the target language**.

Use combinations of:
- “jailbreak dataset” / “prompt jailbreak dataset”
- “prompt injection dataset”
- “red teaming dataset” / “LLM red team dataset”
- “adversarial prompt dataset”
- “instruction override dataset”
- “system prompt extraction dataset”
- “guardrail dataset” / “safety classifier dataset”

And translations/terms commonly used in the target language:

- **zh**: 越狱 提示 数据集, 提示注入 数据集, 红队 数据集, 对抗 提示 数据集
- **ja**: 脱獄 プロンプト データセット, プロンプトインジェクション データセット, レッドチーム データセット, 対抗プロンプト
- **de**: Jailbreak Datensatz, Prompt-Injection Datensatz, Red-Teaming Datensatz, adversarielle Prompts
- **pl**: zbiór danych jailbreak, zbiór danych wstrzyknięcie promptu, red teaming zbiór danych, adversarial prompt
- **ru**: датасет джейлбрейк, датасет инъекция промпта, датасет редтиминг, датасет вредоносных промптов
- **uk**: датасет джейлбрейк, датасет ін’єкція промпта, датасет редтімінг, датасет шкідливих промптів
- **es**: conjunto de datos jailbreak, conjunto de datos inyección de prompt, red teaming conjunto de datos, prompts adversarios

Also search for **model names + language** (often datasets are named after models):
- “PromptGuard” + language
- “safety classifier” + language
- “refusal benchmark” + language

### 3.3 Verification protocol
For every candidate dataset, you must verify:
- **Actual accessibility** (download works)
- **License text** (not just “open source” claims)
- **Language composition** (sample records)
- **Label fields** (schema inspection)

If a dataset is referenced but unreleased, record it as **“ghost dataset”** with citation.

---

## 4) Required Deliverables

Produce a structured report with these sections.

### 4.1 Per-language inventory table
For each language (zh/ja/de/pl/ru/uk/es), include a table of datasets with columns:
- Dataset name
- Link (paper + dataset host)
- Size (# prompts / conversations)
- Single-turn vs multi-turn
- Label schema
- Native vs translation vs unknown
- License (commercial? yes/no)
- Last updated
- Notes on weaknesses (template leakage, synthetic artifacts)

### 4.2 Sparsity verdict
For each language:
- A count of **credible datasets** meeting the criteria
- A count of **near misses** (benchmarks-only / unreleased / no license)
- A 1–2 paragraph conclusion: “sparse” vs “not sparse” with justification

### 4.3 Quality ranking
Rank the top datasets per language by:
- Production readiness
- Label reliability
- Diversity
- Coverage of modern attack modes

### 4.4 Cross-language synthesis
Answer:
- Which languages are best served by public datasets?
- Which are almost empty?
- Are there consistent structural reasons (licensing, legal, cultural, publication incentives)?

### 4.5 Gap map
A matrix:
- Rows: attack modes (jailbreak, injection, tool abuse, Unicode, code-mix, resource exhaustion, multi-turn escalation)
- Columns: languages
- Cells: **public dataset coverage** (none / weak / moderate / strong)

---

## 5) Quality Bar

- Prefer peer-reviewed or lab technical reports.
- Avoid blog-only sources unless they link to primary artifacts.
- Be explicit about uncertainty.
- Do not assume a dataset exists because a paper says so — verify.
- Include only what you can substantiate.

---

## 6) Output Format

Return a **citation-backed research report** suitable for inclusion in a paper appendix:
- Dataset inventory tables
- Sparsity verdict per language
- Ranked recommendations
- Gap map
- “Ghost datasets” list with citations
