# Code Quality Checks

OpenPlanner uses automated checks to keep the monorepo maintainable as packages move between TypeScript, ClojureScript, Clojure, and supporting JavaScript tooling.

## Code duplication scanning

Duplication scanning is provided by [`jscpd`](https://github.com/kucherenko/jscpd) and configured in the repository root at `.jscpd.json`.

### Commands

```bash
# Generate a non-gating duplication report for local triage
pnpm duplication:scan

# Run the CI-suitable duplication gate
pnpm duplication:check
```

`duplication:scan` writes console, HTML, and JSON reports under `reports/jscpd/`. The report directory is ignored because it is a regenerable artifact.

`duplication:check` uses the same configuration with a stricter threshold and is intended for CI or pre-merge checks. The current gate fails only if total duplicated lines exceed `5%`.

The GitHub Actions workflow at `.github/workflows/code-quality.yml` runs `pnpm duplication:check` on pull requests and pushes to `main`/`master`.

### Scope

The scan covers source-like code paths:

- `src`
- `packages`
- `tests`
- `scripts`
- `config`

The configured formats focus on executable code:

- JavaScript
- TypeScript
- JSX/TSX
- Clojure/ClojureScript/EDN-style files recognized by `jscpd` as Clojure

Markdown and JSON are intentionally excluded from the default duplication gate because specs, generated metadata, and copied documentation templates create high noise and hide actionable code duplication.

### Ignored paths

The scanner ignores dependency, build, generated, and local-runtime artifacts, including:

- `node_modules/`
- `.venv/`
- `dist/`, `dist-dev/`, `build/`, `target/`, `.target/`
- `.worktrees/`
- `.eta-mu/`, `.ημ/`
- `.shadow-cljs/`, `.clj-kondo/`, `.cpcache/`, `.lsp/`, `.vite/`
- generated public CLJS/renderer output
- lockfiles, sourcemaps, TypeScript build info, minified files, generated declarations

When adding new generated directories, update `.jscpd.json` before relying on duplication results.

### Reading results

Start with the HTML report:

```bash
pnpm duplication:scan
xdg-open reports/jscpd/html/index.html
```

Treat duplicates as triage signals rather than automatic refactor mandates. Good first candidates are:

1. repeated route handlers or request validation blocks,
2. repeated frontend layout/control components,
3. repeated test setup that can become shared fixtures,
4. duplicated package-local utility scripts that should move into a shared package.

Avoid extracting duplication when it would obscure domain language, make tests harder to read, or couple packages that should remain independently evolvable.
