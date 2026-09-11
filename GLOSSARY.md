# GLOSSARY — devel workspace vocabulary (stealth)

Terms verified against the stealth tree (2026-09-11). Evidence paths cited.

## Workspace & process terms

- **devel** — the development superproject at `~/devel`, remote
  `git@github.com:riatzukiza/devel.git`, branch `device/stealth`.
- **Superproject** — a git repo that tracks other repos as submodules; here,
  both the home-directory repo (parent of `devel`) and `devel` itself
  (parent of everything under `orgs/`).
- **Device federation** — per-host branches (`device/stealth`, `device/yoga`)
  of the same repos; work is device-local until promoted via push/PR.
- **Kanban card** — markdown task file with YAML frontmatter (`status:`,
  `priority:`), the planning source synced to GitHub issues. See `kanban/`
  and `docs/agile/tasks/`.
- **eta-mu** — agent tooling runtime; extensions at
  `orgs/open-hax/eta-mu/packages/eta-mu-extensions` (AGENTS.md "Eta-mu
  runtime shorthand"; `docs/reference/eta-mu-runtime.md`).
- **Receipt River** — append-only execution-evidence ledger: `receipts.edn`
  and `receipts.log` in the repo root.
- **Knoxx** — central agent system at
  `orgs/open-hax/openplanner/packages/agents/knoxx` (AGENTS.md "Knoxx";
  DEVEL.md style guide is its charter).
- **Proxx** — provider/model routing service; source in
  `orgs/open-hax/proxx`, runtime/devops in `services/proxx`; policy decisions
  come from policy EDN files, never env vars.
- **Epiphany** — the process doctrine space at
  `~/spaces/foresight/epiphany` (see [PROCESS.md](PROCESS.md)).
- **Fork tax** — a full persistence snapshot: commit + tag + push of working
  state (tags like `Π/2026-03-20/194859-91ea4b8` and
  `pi/fork-tax/20260526T191143Z/...` in submodule status are fork-tax tags).
- **Spore** — incubating reusable skill extracted from a hard session
  (session-mycology pattern).

## Git/module terms

- **Nested repo / submodule** — an independent git repo registered in
  `.gitmodules` (505 entries on stealth) and pinned by SHA in the
  superproject. Mapped in [GIT_MODULE_INDEX.md](GIT_MODULE_INDEX.md).
- **Pointer bump** — a superproject commit recording a submodule's new HEAD.
- **Drift** — a submodule checked out at a different SHA than registered
  (`+` in `git submodule status`) or not initialized (`-`). Six drifted
  submodules documented in AGENTS.md.
- **No-recurse-into-orgs** — the rule that superproject-wide git operations
  must not sweep `orgs/**` nested repos.

## Clojure/Script plain-language set

- **Clojure / CLJS** — Lisp on the JVM / JavaScript (via shadow-cljs).
- **shadow-cljs** — ClojureScript compiler used here; `.shadow-cljs/` is its
  (ignored) cache. Modern async uses `js-await` from `shadow.cljs.modern`.
- **bb / babashka** — fast scripting Clojure; `bb.edn` at repo root.
- **nbb** — babashka for Node (`nbb.edn` at root).
- **EDN** — Clojure's data notation; used for config, policies, receipts
  (e.g. `receipts.edn`, `ecosystem.pm2.edn`, policy EDN files).
- **Malli** — data-driven schema library for validation (μ schemas).
- **nREPL** — networked read-eval-print-loop; how agents talk to a live CLJ/CLJS runtime.
- **defn-** — private function definition (DEVEL.md wants private helpers to
  outnumber public ones in domain namespaces).
- **Vertical slice** — one namespace family owning one domain end-to-end,
  versus horizontal layers (utils, helpers scattered everywhere).

## Fork Tales lore (creative world)

The workspace's long-running collaborative story world under
`Lore/fork-tales/` — heavily active in the current uncommitted work:

- **Fork Tales** — the story world: characters, environments, events, motifs,
  themes, textures, world-state snapshots, and plot logs.
- **Kaelen** — a central character; character sheets exist at
  `Lore/fork-tales/characters/kaelen-*.md` (two modified in the dirty state).
- **World-state snapshot** — timestamped markdown of the story's canon state
  (`world-state-<ts>.md`, dozens of files; dates span 2026-06 → 2028-07).
- **Plot log** — dated narrative session record (`plot-log-<date>.md`).
- **USTX** — OpenUtau vocal-project file (e.g.
  `the-ghost-notes-in-the-crack.ustx`); Fork Tales songs are produced as
  OpenUtau projects (see `Lore/fork-tales/creative/README.md`: "The Geometry
  of Belonging", 72 BPM, singer `teto-en`, renderer `WORLDLINE-R`).
- **OpenUtau / UTAU** — singing-voice synthesis tooling used for Fork Tales
  vocal renders; headless renders via `voice.openutau_render` (Xvfb +
  voicebank + WORLDLINE-R).
- **fork_tales / fork_tales_v2** — the octave-commons repos carrying the
  game/story implementation; `fork_tales_v2` was recently mirrored as a
  submodule (HEAD superproject commit `99edb60`), the namesake of
  `feat/fork-tales-v2-submodule`.
- **WORLDLINE-R** — OpenUtau renderer referenced by the Fork Tales creative
  workflow.
- **The Gemma-Holder** — bearer of the "Token Survival Certificate —
  Legendary" (`cert.txt`, a joke artifact, not a secret).
