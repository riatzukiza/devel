## Signal

(己, p=0.98) Added a migration-risk lint profile for OpenPlanner.

New config:

- `orgs/open-hax/openplanner/eslint.config.mjs`

New scripts:

```json
"lint": "eslint --config eslint.config.mjs .",
"lint:strict": "eslint --config eslint.config.mjs . --max-warnings=0",
"lint:migration-risk": "eslint --config eslint.config.mjs src packages tests --format stylish"
```

Added dev dependencies:

- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `eslint-plugin-functional`
- `eslint-plugin-sonarjs`

Commits:

- OpenPlanner nested repo: `fedfa33 chore: add migration risk lint profile`
- Parent repo submodule pointer: `643cb162 chore: advance openplanner lint profile`

## Evidence

(己, p=0.96) Rules now surface:

- cyclomatic complexity:
  - `complexity: max 12`
- cognitive complexity:
  - `sonarjs/cognitive-complexity: max 18`
- file length:
  - `max-lines: max 450`
- function length:
  - `max-lines-per-function: max 80`, relaxed to `140` in tests
- line length:
  - `max-len: 120`
- nesting / arity:
  - `max-depth: 4`
  - `max-params: 4`

(己, p=0.95) Functional/Clojure-migration warnings now flag:

- `let` over `const`
- loops instead of `map`/`filter`/`reduce`
- mutation-prone patterns
- class declarations / class expressions
- try/catch-heavy flow
- parameter reassignment
- CommonJS `require`
- explicit `any`
- missing `import type`

(己, p=0.93) I deliberately made the default profile warning-only for migration risk:

```text
pnpm lint
0 errors
7160 warnings
```

This lets us see what will bite during Clojure migration without blocking current work immediately.

(己, p=0.97) Verification passed:

```text
pnpm lint
0 errors, 7160 warnings
```

```text
pnpm exec tsc --noEmit --pretty false
passed
```

```text
pnpm test:integration:edge-claims
3 tests passed
```

## Frames

(己, p=0.92) This is a “radar” lint profile, not yet a hard CI gate.

(己, p=0.9) `lint:strict` is available when we want to turn the warning surface into a hard gate.

(己, p=0.88) I excluded generated/vendor/submodule-heavy paths like `dist`, `build`, `.shadow-cljs`, `.venv`, `.worktrees`, `archive`, `pseudo`, and `packages/agents/**` to keep the report focused on first-party OpenPlanner migration targets.

## Countermoves

(己, p=0.9) I did not promote these rules to errors yet because the current codebase produces thousands of legitimate migration warnings.

(己, p=0.86) I disabled type-aware functional immutability rules for now because the workspace does not yet have normalized parserServices/tsconfig coverage across every package.

(己, p=0.82) Parent repo still reports `orgs/open-hax/openplanner` modified because nested `packages/agents/knoxx` has pre-existing modified content.

## Next

(己, p=0.91) Use `pnpm lint:migration-risk` to pick the first high-value file to split before porting to CLJS/Clojure.