# GLOSSARY — devel workspace

## A. Domain terms (observed in this repo)

- **eta-mu** — the agent runtime monorepo (`orgs/open-hax/eta-mu`); core + satellites;
  source of the `.ημ` contract runtimes used by pi, opencode, and other agent
  frameworks.
- **muse** — the ClojureScript plugin-factory workspace (`/home/err/spaces/muse`)
  that authors agent tools as EDN/CLJC data; related surfaces surface inside
  eta-mu packages.
- **proxx** — OpenAI-compatible model proxy with provider rotation
  (`orgs/open-hax/proxx`, runtime `services/proxx`; documented in README/DEVEL.md).
- **uxx** — UI kit org package (`orgs/open-hax/uxx`, pnpm workspace member).
- **promethean** — the Promethean agent system (`orgs/octave-commons/promethean`,
  GPL); kanban FSM, frontends, ecosystem DSL.
- **pantheon** — services repo (`orgs/octave-commons/pantheon`).
- **shibboleth** — project under `orgs/octave-commons/shibboleth`.
- **daimoi** — project under `orgs/octave-commons/daimoi`.
- **eros-eris-field** — field simulation pair (`eros-eris-field` +
  `eros-eris-field-app`) under octave-commons.
- **gates-of-aker** — simulation project with t0/t1 state snapshots at the root.
- **kanban** — the task-card system: `docs/agile/tasks/` board at the root, plus
  the `orgs/ussyverse/kanban` repo.
- **TANF** — the TANF application (`orgs/riatzukiza/TANF-app`).

*(No evidence of Rheos, Truth-as-product, axxium, vexx, privaxxy as named products
was found beyond directory presence — axxium, vexx, privaxxy exist as repos; see
README structure map. Epiphany is a process model, see PROCESS.md.)*

## B. Fork Tales lore

- **receipt-river** — append-only execution ledger (`receipts.edn` /
  `receipts.log` at the root) recording what agents did, so state survives sessions.
- **session-mycology** — per-turn retrospection practice: score the session's
  friction and incubate reusable "skill spores".
- **spore** — an incubating skill candidate produced by session-mycology; promoted
  to a full skill only after review in a later session.
- **fork-tax** — deterministic handoff snapshot: commit + tag + push of working
  state (`Π:` commits in the root log are fork-tax snapshots).
- **presence** — the attention/presence anchor context symbol (主) used in
  agent contract notation.
- **ημΠ** — the eta-mu operation-mindfuck contract family: operator grammar
  (η delivery, μ formal, Π fork-tax, A art modes) governing agent behavior.

## C. Clojure hard concepts (plain language)

- **homoiconicity** — code and data share the same representation (lists of
  lists), so programs can read, write, and transform programs like any other data.
- **EDN** — Extensible Data Notation; Clojure's data-literal format (like JSON but
  with keywords, symbols, sets). Config and ledgers here use it.
- **atom** — a mutable reference cell holding an immutable value; swap!/reset!
  change it safely across threads.
- **transducer** — a composable transformation of values-in-motion; a recipe for
  a process (map/filter/etc.) decoupled from any particular collection.
- **laziness** — sequences compute their elements on demand; infinite or huge
  sequences can be described without being fully realized.
- **macro** — code that runs at compile time and emits code; how Clojure grows
  new syntax.
- **protocol / multimethod** — polymorphism constructs: protocols dispatch on
  type via named methods; multimethods dispatch on arbitrary functions of the
  arguments.
- **REPL-driven development** — build the program interactively in a live
  runtime, evaluating small pieces as you go, instead of write-compile-run cycles.
- **babashka** — a fast-starting scripting Clojure (interpreter with batteries
  included); powers `bb.edn` task running at the root.
- **nbb** — babashka's ClojureScript sibling: ClojureScript on Node for quick
  scripting and tooling.
- **shadow-cljs** — ClojureScript compiler/build tool with dev servers, hot
  reload, and npm integration; drives the CLJS frontends here.
