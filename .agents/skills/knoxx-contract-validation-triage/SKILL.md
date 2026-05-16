---
name: knoxx-contract-validation-triage
description: Triage Knoxx contract EDN parse, id, path, schema, and projection failures using normal read, edit, and write file tools.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-contract-validation
  version: 2
---

# Skill: Knoxx Contract Validation Triage

## Goal
Find and fix the smallest contract-file problem causing Knoxx validation or runtime contract drift.

## Use This Skill When
- A Knoxx contract has EDN parse, schema, class, id, or path errors.
- Runtime behavior disagrees with contract files.
- Tool permissions, model selection, actor binding, or policy projection looks wrong.

## Tool Rule
Use the regular file tools:

- `read` the failing contract, nearby examples, and relevant schema/loader code.
- `edit` the broken existing contract.
- `write` only when creating a replacement or new contract file intentionally.

Run validation with `bb` or `clojure`.

## Check These First
1. Is the file in the right `contracts/<class>/` directory?
2. Does the record id match the filename/class convention?
3. Is the EDN syntactically valid?
4. Are strings, keywords, vectors, and sets using the expected shape?
5. Does the referenced role, capability, actor, or model exist?
6. Did runtime state cache an older actor/agent/model selection?

## Steps
1. Read the exact failing file and error.
2. Read `backend/src/cljs/knoxx/backend/contracts/validator.cljs` if the expected shape is unclear.
3. Make the smallest EDN correction with `edit`.
4. Use `write` only for intentional full-file replacement.
5. Validate with `bb` or `clojure`.
6. Report root cause and remaining risk.

## Validation
At minimum, parse the changed EDN with Babashka or Clojure:

```bash
bb -e '(require '\''[clojure.edn :as edn]) (doseq [f *command-line-args*] (edn/read-string (slurp f)) (println "ok" f))' contracts/agents/example.edn
```

If Knoxx exposes a Clojure/Babashka schema validation task, run that too.

## Output
- Root cause classification.
- Changed contract path(s).
- `bb`/`clojure` validation result or known gap.
