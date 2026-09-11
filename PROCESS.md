# PROCESS — how work flows in devel

A short, epiphany-modeled charter for the workspace.

## The model

Work in `devel` follows an **epiphany → task → evidence** loop:

1. **Epiphany** — an insight, request, or problem appears. It is captured as a
   **kanban card** in `docs/agile/tasks/` (YAML frontmatter: `uuid`, `status`,
   `priority`, `labels`). The board is the single canonical queue.
2. **Task** — work is pulled from the board. Large work is split into
   phase-task cards (see the *Nested Submodule Package Phase 1–4* series).
   Execution happens **inside the relevant org repo** (`orgs/<org>/<repo>`), not
   at the root — orgs are independent repositories with their own branch law.
3. **Evidence** — as work proceeds, `docs/notes/` accumulates timestamped
   chronological notes (`YYYY.MM.DD.*.md`) recording decisions, sessions, and
   findings. Notes are evidence, not instructions.
4. **Record** — completed work is recorded: card status advances, receipts
   (`receipts.edn` / `receipts.log`) capture execution state, and submodule
   pointers at the root are bumped when org repos advance.

## Invariants

- **Kanban cards are the board.** Work is requested and tracked there; do not
  coordinate work purely in chat.
- **Notes are chronological evidence.** Append timestamps; do not rewrite history.
- **Orgs are independent.** Root ops never recurse into `orgs/**` dirt; each repo
  owns its own branches, PRs, and licenses.
- **Statuses.** Cards observed: mostly `"incoming"` (new/untriaged), with some
  `todo` and `completed`.

## Related

The epiphany process model this charter is modeled on:
[`../spaces/foresight/epiphany/PROCESS.md`](../../spaces/foresight/epiphany/PROCESS.md)
(resolves to `/home/err/spaces/foresight/epiphany/PROCESS.md` — verified).
