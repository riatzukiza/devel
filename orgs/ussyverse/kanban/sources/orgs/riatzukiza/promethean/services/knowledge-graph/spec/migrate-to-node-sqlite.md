# Migrate to built-in node:sqlite

- Goal: replace better-sqlite3 with Node’s built-in `node:sqlite` (Node 22.5+) to avoid native addon build failures and keep sync semantics.
- Code refs: src/database/database.ts:1 (better-sqlite3 import/new, pragmas), src/database/repository.ts:17 (use of db.prepare/transactions), src/cli.ts:81 (Database instantiation), package.json:28 (better-sqlite3 dependency).
- External research:
  - Node 22 `node:sqlite` API docs (Context7 /nodejs/node/v22_20_0, topic=sqlite) show `DatabaseSync` with `exec`, `prepare().run/get/all`, `aggregate`, `backup`.
  - GitHub examples via `DatabaseSync` (nodejs/node test suite) confirm synchronous patterns similar to better-sqlite3.
  - Community issues (actualbudget/actual#3946) show better-sqlite3 11.x required for Node 22; older 8.x/9.x fail with `SetAccessor` errors.
- Proposed phases:
  1) Replace dependency: remove better-sqlite3, rely on built-in `node:sqlite`; adjust package.json, imports, types.
  2) Adapt Database class: swap constructor to `new DatabaseSync(config.path)`; map pragmas via `exec`; replace transaction helper with `database.transaction(fn)` equivalent (if supported) or manual BEGIN/COMMIT; adjust return types.
  3) Adjust repository usage: `prepare/exec/run/get/all` mapping; ensure JSON serialization unaffected; verify date handling.
  4) CLI flow: ensure Database init still works; note DB path same.
  5) Testing: update tests if mocks rely on better-sqlite3; run vitest/CLI smoke.
- Definition of done:
  - No dependency on better-sqlite3 in package.json; code compiles against Node 22 `node:sqlite`.
  - Database and repository compile and tests pass (or documented if further refactors required).
  - CLI build command succeeds on Node 22 without native builds.
- Progress: swapped to `node:sqlite` (DatabaseSync), removed better-sqlite3, updated @types/node to 22.18.12; typecheck now passes; CLI build runs (with some import-path validation warnings logged) and writes `knowledge-graph.db`.
