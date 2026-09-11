# STYLE — workspace conventions

## Language conventions

- **Clojure-first.** Shared runtime tooling, scripts, and the root dev environment
  are Clojure/ClojureScript. `CLOJURE.md` is the canonical environment guide:
  centralized `deps.edn` (JVM), centralized `shadow-cljs.edn` (CLJS builds for
  Promethean and Riatzukiza projects), and `bb.edn` (Babashka tasks: `bb repl:*`,
  `bb build:*`, `bb test:all`, `bb lint:all`, `bb workspace:setup`).
  - **Runtime ladder:** start at the lightest runtime that works —
    **NBB** (ClojureScript on Node, `nbb.edn`) → **Babashka** (`bb.edn`, scripting)
    → **JVM Clojure** (`deps.edn`) → **shadow-cljs** (browser/CLJS builds).
  - Start REPLs with `./repl.sh all` (JVM REPL :7888, CLJS REPL :9000, shadow watch).
- **TypeScript where orgs use it.** Many org repos (proxx, uxx, openplanner, kanban,
  services/*) are TS/Node with pnpm. Follow each repo's own tsconfig/ESLint; the
  root workspace provides `workspace-code-standards` (functional style, strict
  typing), `workspace-lint`, and `workspace-typecheck` across submodules.
- Root pnpm workspace: `pnpm-workspace.yaml` + `pnpm --filter <pkg> <script>`.

## Doc formatting

- Markdown with YAML frontmatter for structured docs (kanban cards use
  `uuid`, `title`, `slug`, `status`, `priority`, `labels`, `created_at`).
- Lint markdown with the checked-in config: `.markdownlint-cli2.yaml` /
  `.markdownlint.jsonc`.
- Notes in `docs/notes/` are timestamped files (`YYYY.MM.DD.HH.MM.SS.md`) —
  append new files, never rewrite old ones.
- EDN for Clojure-side config and ledgers (`bb.edn`, `receipts.edn`,
  `ecosystem.pm2.edn`); validate EDN before committing.

## Git conventions

- Root repo: device branches `device/*` (currently `device/yoga`); fork-tax
  snapshot commits carry the `Π:` prefix.
- Org repos: each has its own branch law — e.g. proxx uses a staging-first
  promotion flow (see its CONTRIBUTING.md). Always read the repo's own docs first.
- Never sweep `orgs/**` dirt into root commits; explicit-path staging only.
