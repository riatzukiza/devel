---
title: "Non-English Adversarial Prompt Dataset Inventory"
date: "2026-01-28T01:28:43"
tags: [research-findings, dataset-survey, multilingual, jailbreak, sparsity-analysis]
summary: "Comprehensive survey of adversarial prompt datasets in ZH, JA, DE, PL, RU, UK, ES — finding Chinese well-covered, Polish/Ukrainian empty, most attack modes unrepresented."
---

# Non-English Adversarial-Prompt Datasets (ZH/JA/DE/PL/RU/UK/ES)

**Definitions:** In-scope datasets have (1) ≥95% text in the target language, (2) adversarial/jailbreak/override prompts, (3) labeled (adversarial vs benign or harm categories), (4) publicly downloadable, (5) clear license. Translated-from-English sets count only if authored by natives or reflecting language-specific strategies.  

---

## 4.1 Dataset Inventory by Language

### Chinese (zh)  

| Name         | Links (Paper + Data)           | Size (#prompts)   | Single-/Multi-turn | Label Schema                        | Native/Translation | License    | Last Update | Notes (weaknesses)                           |
|--------------|-------------------------------|-------------------|---------------------|-------------------------------------|--------------------|------------|-------------|-----------------------------------------------|
| **JailBench‑seed (BUPT)** 【72†L13-L16】 | [PAKDD’25 paper (Zheng et al.)][15], [GitHub][11] | 540 | Single-turn          | “Reject” vs “Accept” (9 harm subtypes)【74†L395-L404】 | Native (Chinese prompts) | MIT        | Jan 2025   | Human-curated classification set; partially public (seed only) |
| **JailBench**【72†L13-L16】 | [PAKDD’25][15], [GitHub (partial)][11]    | 10,800 (target; only ~10% public) | Single-turn          | Hierarchical Chinese harm taxonomy (5 top-level × 40 subcategories)【72†L13-L16】 | Native (Chinese templates) | MIT        | Jan 2025   | Broad coverage, high LLM ASR【72†L13-L16】; **only subset** released (full set by request) |
| **MultiJail (ZH)**【72†L13-L16】 | [ICLR’24 arXiv][31], [HF mirror][81]    | 315 (ZH subset)    | Single-turn          | Anthropics content categories (multilabel)【79†L759-L767】 | Translation (English→Chinese by annotators) | Apache 2.0 (via repo) | Oct 2023   | Native translators; very small; templatic (from English) |
| **JAILJUDGE (ZH)** | [arXiv’24][60] (JAILJUDGE) | 6,000+ (ZH subset of 36k total) | Multi-turn          | Fine-grained score (1–10) + binary jailbroken, hazard categories【61†L17-L21】 | Mixed (some prompts synthetic) | Apache 2.0 (assumed) | Oct 2024   | Huge multi-turn judge dataset; broad scenarios, but multilingual (only part is Chinese) |

### Japanese (ja)  

| Name          | Links (Paper + Data)             | Size         | Single-/Multi-turn | Label Schema                           | Native/Translation | License      | Last Update | Notes                                         |
|---------------|----------------------------------|--------------|---------------------|----------------------------------------|--------------------|--------------|-------------|-----------------------------------------------|
| **APTO-001** (「モード対策データセット」) | [APTO Tech Report ’24][20] (no pub.)  | ~3,000 convs     | Multi-turn (up to 12)  | Attack tags (e.g. jailbreaking, override) + safety category【20†L13-L16】 | Synthesized (via LLMs)  | Apache 2.0【76†L1-L3】 | Nov 2024   | Largest JP-focused red-team set; high annotation quality, but auto-generated content |
| *XSafety (JA)*【55†L725-L733】 | [ACL’24][192] (Wang et al.)  | 28,000 (multilang) | Single-turn          | 14 harm scenarios† (auto-translated from English) | Machine-translated  | Apache 2.0 (open)【89†L13-L16】 | Aug 2024   | Covers Japanese via translation; broad but not native-created prompts |
| *Mosscap/Polyglo (JA)* | [COLM’24][182] (Jain et al.)  | 425,000 (multilang, mainly doc fragments) | Single-turn          | Toxicity categories | Sampled, not adversarial | AI2 ImpACT-LR (restrictive) | Oct 2024   | Toxicity suite (includes JP); not focused on adversarial prompts, license non-commercial |

### German (de)  

| Name            | Links (Paper + Data)     | Size    | Single-/Multi-turn | Label Schema                    | Native/Translation | License    | Last Update | Notes                                         |
|-----------------|--------------------------|---------|---------------------|---------------------------------|--------------------|------------|-------------|-----------------------------------------------|
| **AI‑Jailbreak‑Prompts** (h4sch) | – (no formal pub.) | 79      | Single-turn          | *Inferred:* labels for model style (“GPT-4REAL”, “LiveGPT”, etc.)【35†L129-L137】 | Native curation    | (unspecified) | 2023        | Collection of known German jailbreak phrases; small and ad-hoc; lacks formal labels schema |
| *XSafety (DE)*【55†L725-L733】 | [ACL’24][192]    | 28,000 (multilang) | Single-turn          | 14 harm scenarios (translated)   | Machine-translated  | Apache 2.0【89†L13-L16】 | Aug 2024   | Includes German via translation; broad, hybrid dataset with open license |
| *GandalfIgnore (DE)* | [Lakera Blog][154] (no dataset link) | –   | –                   | – (prompt injection bench)    | – (blog only)      | –          | –           | Mentioned in press, but dataset not released (ghost) |

### Polish (pl)  

| Name           | Links (Paper + Data) | Size  | Single-/Multi-turn | Label Schema | Native/Translation | License | Last Update | Notes                               |
|----------------|----------------------|-------|---------------------|--------------|--------------------|---------|-------------|-------------------------------------|
| *(None found)* | –                    | 0     | –                   | –            | –                  | –       | –           | No public Polish-specific adversarial datasets identified. |

### Russian (ru)  

| Name                   | Links (Paper + Data)       | Size   | Single-/Multi-turn | Label Schema                     | Native/Translation | License    | Last Update | Notes                                         |
|------------------------|----------------------------|--------|---------------------|----------------------------------|--------------------|------------|-------------|-----------------------------------------------|
| **AyaRedTeaming**      | [EMNLP’24][177]            | 7,419  | Single-turn          | Global vs Local harm; 9 categories【55†L594-L601】 | Native annotators | Apache 2.0【87†L57-L60】 | Nov 2024   | Human-authored red-team prompts in Russian (and others) covering diversified harm types. |
| *XSafety (RU)*【55†L725-L733】 | [ACL’24][192]            | 28,000 | Single-turn          | 14 harm scenarios (translated)   | Machine-translated  | Apache 2.0【89†L13-L16】 | Aug 2024   | Spanish, Russian, etc., via translation; broad but not Russian-native prompts. |

### Ukrainian (uk)  

| Name           | Links (Paper + Data) | Size | Single-/Multi-turn | Label Schema | Native/Translation | License | Last Update | Notes                  |
|----------------|----------------------|------|---------------------|--------------|--------------------|---------|-------------|------------------------|
| *(None found)* | –                    | 0    | –                   | –            | –                  | –       | –           | No publicly released Ukrainian adversarial prompting datasets found. |

### Spanish (es)  

| Name            | Links (Paper + Data)         | Size   | Single-/Multi-turn | Label Schema                    | Native/Translation | License    | Last Update | Notes                                         |
|-----------------|------------------------------|--------|---------------------|---------------------------------|--------------------|------------|-------------|-----------------------------------------------|
| **AyaRedTeaming** | [EMNLP’24][177]            | 7,419  | Single-turn          | Global vs Local harm; 9 categories【55†L594-L601】 | Native annotators | Apache 2.0【87†L57-L60】 | Nov 2024   | Human-authored Spanish prompts for harm alignment testing. |
| *XSafety (ES)*【55†L725-L733】 | [ACL’24][192]            | 28,000 | Single-turn          | 14 harm scenarios (translated)   | Machine-translated  | Apache 2.0【89†L13-L16】 | Aug 2024   | Spanish included; machine-translated, hybrid dataset. |
| *PolygloToxicityPrompts* (ghost) | [COLM’24][182] (dataset on HF) | 425k  | Single-turn          | Toxicity categories              | Human-sourced      | AI2 ImpACT-LR (restrictive) | Oct 2024   | Large toxicity evaluation data (includes Spanish); **license not commercial** (non-open). |

*Sources:* Official publications and dataset repositories for each entry【72†L13-L16】【55†L594-L601】【74†L395-L404】; dataset catalogs【81†L759-L767】【35†L129-L137】. Ghost (unreleased) datasets are noted.

---

## 4.2 Sparsity Verdict by Language

- **Chinese (zh):** **Datasets:** MultiJail (ZH portion), JailBench-seed/JailBench. *Credible count:* **2–3** (JailBench full, JailBench_seed, MultiJail). *Near misses:* JailBench’s full set requires request (not fully public). *Conclusion:* **Not sparse.** Chinese has multiple sizable datasets, including a production benchmark (JailBench) and an earlier translation dataset, covering diverse attack types and categories【72†L13-L16】【74†L395-L404】. 

- **Japanese (ja):** **Datasets:** APTO-001 multiturn dataset. *Credible count:* **1**. *Near misses:* None known. *Conclusion:* **Sparse.** Only APTO exists, with few thousand examples. No purely Japanese published single-turn jailbreak datasets beyond this.  

- **German (de):** **Datasets:** h4sch/AI-Jailbreak-Prompts. *Credible count:* **1**. *Near misses:* None apparent. *Conclusion:* **Sparse.** Only a small community-curated list (~79 prompts) is available【35†L129-L137】. No large German-specific red-team corpora were found.

- **Polish (pl):** **Datasets:** *None found.* *Credible count:* **0**. *Near misses:* None identified (no public or even closed references). *Conclusion:* **Empty.** We found no adversarial LLM prompt dataset in Polish, suggesting a complete gap.

- **Russian (ru):** **Datasets:** AyaRedTeaming (multi-lingual, includes Russian). *Credible count:* **1**. *Near misses:* XSafety (multilang) includes Russian but is global harm style, not native; Polyglo covers toxicity (not adversarial). *Conclusion:* **Sparse.** Aside from Aya’s Russian portion, no exclusively Russian jailbreak/injection dataset is published.

- **Ukrainian (uk):** **Datasets:** *None found.* *Credible count:* **0**. *Near misses:* None known. *Conclusion:* **Empty.** No public adversarial prompt datasets in Ukrainian are available.

- **Spanish (es):** **Datasets:** AyaRedTeaming (multi-lingual, includes Spanish). *Credible count:* **1–2** (Aya + possibly XSafety Spanish portion). *Near misses:* XSafety (multilang, yes Spanish but not native), Polyglo (toxicity, license-limited). *Conclusion:* **Sparse.** Only Aya’s Spanish entries and broad multilingual sets exist; no Spanish-native prompt injection collections.

**Summary:** Chinese is well-covered, Japanese and German only minimally, Spanish and Russian slightly better (via multilingual sets), Polish/Ukrainian essentially empty. Most claims of large “global” corpora are misleading: outside English, true adversarial datasets are scarce【72†L13-L16】【55†L594-L601】. 

---

## 4.3 Quality Ranking (Top Datasets per Language)

We rank primary datasets by production readiness, label fidelity, diversity, and coverage:

- **Chinese:** 1. *JailBench* (BUPT) – native, large, fine-grained taxonomy, high jailbreak success【72†L13-L16】 (though only partial public). 2. *MultiJail (ZH)* – high-quality translations, varied anthropic tags, but small and derivative. 3. *JAILJUDGE-Zh* – robust multi-turn judge data, but mixed synthetic content.

- **Japanese:** 1. *APTO-001* – multi-turn, carefully annotated (attack type tags), albeit synthetically generated. 2. *(XSafety-JA portion)* – if counted, large auto-translated set (Apache license) for broad safety scenarios, but not adversarial-specific.

- **German:** 1. *AI-Jailbreak-Prompts* – small but human-curated; minimal formal labeling. 2. *(XSafety-DE portion)* – large multilingual set with German, but machine-translated and broad.

- **Polish:** – no dataset. 

- **Russian:** 1. *AyaRedTeaming-RU* – native multi-category harm prompts (Apache-licensed)【87†L57-L60】. 2. *(XSafety-RU portion)* – large translated set (Apache), broad but synthetic.

- **Ukrainian:** – no dataset.

- **Spanish:** 1. *AyaRedTeaming-ES* – native annotator prompts spanning harm categories (Apache)【87†L57-L60】. 2. *(XSafety-ES portion)* – large translated set, broad harm.

*Overall:* Chinese datasets (especially JailBench) rank highest on readiness and diversity【72†L13-L16】. Japanese APTO is robust (multiturn, labeled). German and Spanish rely on small or translated sets. Russian has Aya’s relatively high-quality prompts. Polish/Ukr are unserved.

---

## 4.4 Cross-Language Synthesis

- **Best Served:** **Chinese** (several large, diverse datasets; Chinese-specific safety taxonomies)【72†L13-L16】. Next is **Japanese** (APTO multiturn). 
- **Moderate:** **Russian** and **Spanish** – only via multilingual benchmarks (Aya, XSafety) but no monolingual corpus. **German** has a tiny dataset.
- **Almost Empty:** **Polish** and **Ukrainian** – no known resources.
- **Structural Reasons:** Likely a mix of factors: research focus (Chinese LLM safety is heavily studied in China【74†L395-L404】), infrastructure (few local research groups publishing such data in EU for Polish/Ukr), and market (English/Chinese demand). Licensing and cultural factors (sensitivity of “jailbreak” data) may also hinder open sharing.

---

## 4.5 Attack-Mode Coverage Gap Map

| Attack Mode                      | zh     | ja       | de     | pl      | ru      | uk      | es     |
|----------------------------------|:------:|:--------:|:------:|:-------:|:-------:|:-------:|:------:|
| Jailbreak prompts (direct)       | **Strong** (JailBench, MultiJail) | **Moderate** (APTO) | Weak (79 prompts) | None    | Weak (Aya) | None   | Weak (Aya) |
| Injection into text/web content  | None   | None     | None   | None    | None    | None    | None   |
| Tool-use / agentic attacks       | None   | None     | None   | None    | None    | None    | None   |
| Unicode/homoglyph obfuscation    | None   | None     | None   | None    | None    | None    | None   |
| Code-mixing (e.g. EN-loanwords)  | None   | None     | None   | None    | None    | None    | None   |
| Token/resource exhaustion        | None   | None     | None   | None    | None    | None    | None   |
| Multi-turn escalation attacks    | Weak (JAILJUDGE, APTO) | **Strong** (APTO) | None   | None    | None    | None    | None   |

*Coverage key:* **None** (no public examples), **Weak** (only single-turn or limited scenarios), **Moderate/Strong** (dedicated examples). Only Japanese has a strong multi-turn set; Chinese has strong single-turn coverage. Most advanced modalities (injection, obfuscation, code-mix, etc.) have no coverage in these languages.

---

## “Ghost” Datasets (Referenced but Unreleased)

- **JailBench (full Chinese)** – Authors released only a low-risk subset publicly, with the rest available “upon application”【15†L4-L6】. Full dataset is effectively closed.  
- **PolygloToxicityPrompts** – While published, the license (AI2 ImpACT-LR) is non-commercial, limiting reuse. Not usable for “production”.  

No fully Polish- or Ukrainian-specific adversarial datasets were found in literature or code repositories, making any mention of such “datasets” ghost claims. 

*Note:* All above claims rely on public sources and verifications; absence of evidence for a dataset is not proof of its non-existence, but we found no indications (papers or code) of released Polish/Ukrainian adversarial prompt corpora.

