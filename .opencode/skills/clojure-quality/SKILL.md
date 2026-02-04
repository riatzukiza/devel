---
name: clojure-quality
description: "Auto-fix Clojure delimiters and validate syntax with OpenCode tools."
---

# Skill: Clojure Code Quality and Structural Editing

## Goal
Automatically fix malformed Clojure expressions, balance delimiters, and validate syntax using local OpenCode tools.

## Use This Skill When
- Clojure/ClojureScript files report unmatched delimiters or EOF errors.
- You need a safe pre-flight check before running Shadow-CLJS builds.
- You want to normalize delimiter structure after refactors.

## Do Not Use This Skill When
- The task is unrelated to Clojure or ClojureScript.
- The error is a runtime logic error (use the app-specific debugging flow).

## Tools
- `fix_clojure_delimiters` (Parinfer indent/paren or cljstyle mode)
- `validate_clojure_syntax` (clj-kondo lint)

## Workflow
1. Run `fix_clojure_delimiters` with `parinfer-indent`.
2. Run `validate_clojure_syntax`.
3. If validation fails, retry `fix_clojure_delimiters` with `parinfer-paren`.
4. If validation still fails, switch to `clojure-syntax-rescue` for manual analysis.

## Output
- Balanced delimiters in the target file.
- clj-kondo lint passes for the file.

## Strong Hints
- **Constraint**: Only run `cljstyle` if the CLI is installed and available in PATH.
- **Tip**: Start with Parinfer indent mode; only use paren mode when indent mode fails.
