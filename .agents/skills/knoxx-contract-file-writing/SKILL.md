---
name: knoxx-contract-file-writing
description: Write Knoxx contract EDN with the normal read, edit, and write file tools; keep files in contracts/ and validate ids, paths, and EDN shape.
license: GPL-3.0-or-later
compatibility: opencode
metadata:
  audience: agents
  workflow: knoxx-contract-file-writing
  version: 2
---

# Skill: Knoxx Contract File Writing

## Goal
Write Knoxx contracts as ordinary files in the repo.

## Use This Skill When
- The user asks you to create or modify a Knoxx contract.
- You have normal file tools available.
- The contract belongs under `contracts/`.

## Tool Rule
Use regular file tools only:

- `read` existing examples before changing anything.
- `edit` existing contract files for small changes.
- `write` new contract files or full replacements.

Validate with `bb` or `clojure`.

## Steps
1. Read a nearby example in the same contract class.
2. Read schema/loader code only if the shape or path is unclear.
3. Edit or write the EDN file in `contracts/<class>/`.
4. Check the record id matches the file/class convention.
5. Do not write secrets into contracts.
6. Validate with `bb` or `clojure` and report the result.

## Validation
At minimum, parse changed EDN with Babashka or Clojure:

```bash
bb -e '(require '\''[clojure.edn :as edn]) (doseq [f *command-line-args*] (edn/read-string (slurp f)) (println "ok" f))' contracts/agents/example.edn
```

Use a project Clojure/Babashka schema validation task when available.

## Output
- Changed contract path(s).
- Short summary of id/class/tool assumptions.
- `bb`/`clojure` validation result or known gap.
