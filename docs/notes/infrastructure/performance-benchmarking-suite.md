# Perf & Pools Agile Board

## Legend

* **Status**: `TODO | IN-PROGRESS | REVIEW | DONE`
* **Blocked by**: upstream task IDs
* **Blocks**: downstream task IDs
* Use tags like `#perf #node #solid #benchmarks` as you like.

---

## T-01 – Establish perf workflow & docs

**Status:** TODO
**Blocked by:** –
**Blocks:** T-02, T-03, T-04, T-05, T-08

**Description**
Document the standard workflow for performance work (define scenario → benchmark → profile → fix → regression guard) and where perf artifacts live (`perf/`, CI jobs, docs).

**Requirements**

* [ ] Short “perf workflow” section in `perf/README.md`.
* [ ] List of canonical tools: tinybench, autocannon, Clinic.js, 0x, DevTools, heapdump/memwatch, etc. ([GitHub][1])
* [ ] Conventions for running perf locally (env vars, Node flags).
* [ ] Note which tasks will be guarded in CI (even if CI wiring comes later).

**Definition of Done**

* [ ] `perf/README.md` exists and describes:

  * [ ] Tools and when to use them.
  * [ ] High-level workflow.
  * [ ] Link out to suite-specific docs (micro/macro/memory/pools/regression).
* [ ] Team (you + future agents) can follow this doc without extra explanation.

**Related**

* Node.js perf monitoring & metrics best practices. ([Middleware][2])
* Clinic.js overview. ([DEV Community][3])

---

## T-02 – Scaffold `perf/` directory layout

**Status:** TODO
**Blocked by:** T-01
**Blocks:** T-03, T-04, T-05, T-07, T-08, T-09

**Description**
Create the `perf/` folder structure and placeholder files for micro, macro, memory, pools, regression, and tools.

**Requirements**

* [ ] Create directory tree:

  ```text
  perf/
    README.md
    micro/
    macro/
    memory/
    pools/
    regression/
    tools/
      autocannon/
      clinic/
  ```

* [ ] Add minimal stub files:

  * [ ] Example `*.bench.ts` and `*.spec.ts` placeholders.
  * [ ] Empty `baselines.json`.
  * [ ] Empty scenario configs for autocannon, and empty clinic shell scripts.

**Definition of Done**

* [ ] Tree matches the spec above.
* [ ] `pnpm lint` / TypeScript compiler are happy with placeholder files.
* [ ] `perf/README.md` references this structure.

**Related**

* Node benchmarking layout examples (Fastify’s perf docs use autocannon + scripts). ([Fastify][4])

---

## T-03 – Microbenchmark harness (`perf/micro`)

**Status:** TODO
**Blocked by:** T-02
**Blocks:** T-07, T-08, T-10

**Description**
Implement a microbenchmark harness using tinybench (or mitata) and define example benches for core hot paths (string ops, routing, pooling).

**Requirements**

* [ ] Add tinybench (or chosen lib) as dev dependency. ([GitHub][1])
* [ ] Create a small `perf/micro/harness.ts` to:

  * [ ] Run a list of `Bench` instances.
  * [ ] Print console tables with `ops/s`, margin of error, samples.
  * [ ] Emit JSON results for regression (`perf/regression/*.json`).
* [ ] Implement at least:

  * [ ] `stringOps.bench.ts`.
  * [ ] `routing.bench.ts`.
  * [ ] `poolAcquire.bench.ts` (once generic Pool exists, can stub now).
* [ ] Add `pnpm perf:micro` script.

**Definition of Done**

* [ ] `pnpm perf:micro` runs successfully and prints usable numbers.
* [ ] JSON output schema is stable (name, opsPerSec, rme, samples).
* [ ] Benchmarks log Node version and NODE_ENV.

**Related**

* Tinybench docs & usage. ([GitHub][1])
* General Node benchmarking guides. ([DEV Community][5])

---

## T-04 – Macro/load benchmark harness (`perf/macro`)

**Status:** TODO
**Blocked by:** T-02, T-01
**Blocks:** T-05, T-08, T-09, T-10

**Description**
Set up autocannon-based load tests for key HTTP endpoints / worker flows and emit machine-readable metrics.

**Requirements**

* [ ] Install autocannon as dev dependency or global for scripts. ([npm][6])
* [ ] Define scenario JSONs in `perf/tools/autocannon/` (e.g. `login.json`, `batch.json`).
* [ ] Implement `perf/macro/http-login.bench.ts` that:

  * [ ] Ensures service is running (or documents how to pre-start).
  * [ ] Runs autocannon with config and captures:

    * [ ] p50, p95, p99 latency.
    * [ ] RPS / throughput.
    * [ ] Error rate.
  * [ ] Writes JSON result to `perf/regression/macro-http-login.json`.
* [ ] Add `pnpm perf:macro:http-login` script (and similar for other flows).

**Definition of Done**

* [ ] Running `pnpm perf:macro:*` produces a JSON file with metrics (latencies, throughput, errors).
* [ ] p95/p99 thresholds for each scenario are documented in `perf/README.md`.
* [ ] Autocannon configs are easy to tweak (duration, concurrency).

**Related**

* Autocannon basics and examples. ([npm][6])

---

## T-05 – Memory & leak test harness (`perf/memory`)

**Status:** TODO
**Blocked by:** T-02, T-01
**Blocks:** T-06, T-10, T-11, T-12

**Description**
Create a memory/leak testing harness that runs workloads, samples heap usage, and flags suspicious growth.

**Requirements**

* [ ] Add helpers in `perf/memory/harness.ts` to:

  * [ ] Run a workload function N iterations or for a duration.
  * [ ] Sample `process.memoryUsage().heapUsed` periodically.
  * [ ] Optionally trigger `global.gc()` when `--expose-gc` is enabled.
* [ ] Implement first spec:

  * [ ] `login-leak.spec.ts` (or equivalent realistic scenario).
* [ ] Define leak heuristic:

  * [ ] Ignore first X% samples as warmup.
  * [ ] Assert growth ratio after warmup < threshold (e.g. 20%).
* [ ] Optional:

  * [ ] On test failure, take heap snapshot via `heapdump` for manual analysis. ([DEV Community][3])

**Definition of Done**

* [ ] `pnpm perf:memory` runs at least one scenario and passes on a healthy build.
* [ ] When artificially introducing a leak, harness fails the test and records location of snapshot (if configured).

**Related**

* Node memory leak debugging with heap snapshots. ([DEV Community][3])

---

## T-06 – Implement generic Node TS Pool with stats

**Status:** TODO
**Blocked by:** T-05 (so you know what you’re fixing), T-03
**Blocks:** T-07, T-10

**Description**
Implement a reusable, type-safe `Pool<T>` with stats and bounded size, to back high-churn Node paths.

**Requirements**

* [ ] Implement `Pool<T>` in a shared Node TS module with:

  * [ ] `acquire`, `release`.
  * [ ] `size`, `maxSize`.
  * [ ] `stats` (created, acquired, released, dropped, inUseHighWaterMark).
* [ ] Provide configuration:

  * [ ] Factory function for new T.
  * [ ] Reset function to clear references without heavy allocation.
  * [ ] Cap (`maxSize`) with dropping behaviour for excess releases.
* [ ] Add dev-mode guard for double-release (assert or log).

**Definition of Done**

* [ ] Pool is generic and reusable across services.
* [ ] Unit tests cover:

  * [ ] Unique acquire-until-release.
  * [ ] Reset semantics.
  * [ ] Max-size enforcement.
  * [ ] Basic metrics increments.
* [ ] Docs/changelog describe when to use pools (profiling-driven only).

**Related**

* General Node perf + GC best practices (when pooling is useful vs GC). ([AppSignal Blog][7])

---

## T-07 – Pool correctness & stress tests (`perf/pools`)

**Status:** TODO
**Blocked by:** T-06, T-02, T-03
**Blocks:** T-10

**Description**
Add focused tests to ensure the generic Pool behaves correctly and actually improves perf in hot paths.

**Requirements**

* [ ] `pool-correctness.spec.ts`:

  * [ ] Distinct objects when acquired without release.
  * [ ] Reacquired object is the same instance and fully reset.
  * [ ] `size` never exceeds `maxSize`.
  * [ ] Optional: double-release detection in dev.
* [ ] `pool-stress.bench.ts`:

  * [ ] Compare `no-pool` vs `with-pool` for a representative hot path.
  * [ ] Emit metrics (operations per second; optional allocation counts via profiler).
* [ ] Ensure these feed into regression JSON outputs.

**Definition of Done**

* [ ] `pnpm perf:pools` passes and generates benchmark numbers.
* [ ] Bench shows pooling is at least comparable to no-pool on CPU and not worse on memory for target scenario—or you document why not and narrow scope.

**Related**

* General “tiny benchmark” patterns for sanity checks. ([GitHub][8])

---

## T-08 – Regression harness & CI wiring (`perf/regression`)

**Status:** TODO
**Blocked by:** T-03, T-04, T-05, T-07
**Blocks:** T-10, T-11, T-12

**Description**
Implement a central regression checker that consumes JSON outputs from micro/macro/memory/pools and fails CI on large regressions.

**Requirements**

* [ ] Define `PerfResult` JSON schema:

  * [ ] `suite`, `name`, `metrics: Record<string, number>`.
* [ ] Implement `perf/regression/check-regressions.ts` to:

  * [ ] Load `baselines.json` and current results.
  * [ ] Compare metrics using configurable `maxRegressionRatio`/`maxGrowthRatio`.
  * [ ] Print diffs and exit 1 if outside bounds.
* [ ] Add:

  * [ ] `pnpm perf:check` script.
  * [ ] Optional `--update-baseline` flag for manual baseline refresh.
* [ ] Add CI job that:

  * [ ] Runs a reduced perf suite (micro + a couple of macro & memory tests).
  * [ ] Runs `pnpm perf:check`.

**Definition of Done**

* [ ] Breaking a perf threshold locally causes `pnpm perf:check` to fail.
* [ ] CI has a job (skippable if too heavy) that enforces at least a subset of baselines.

**Related**

* Autocannon & perf CI usage in real projects. ([Fastify][4])

---

## T-09 – Profiler wrappers (`perf/tools`)

**Status:** TODO
**Blocked by:** T-04, T-02, T-01
**Blocks:** T-10

**Description**
Create one-command wrappers for running Clinic.js (or 0x) against your macro scenarios to capture flamegraphs and async timelines.

**Requirements**

* [ ] `perf/tools/clinic/run-flame-login.sh`:

  * [ ] Starts server if needed (or assumes running).
  * [ ] Runs `clinic flame -- node server.js` + autocannon login scenario.
  * [ ] Writes HTML report to `perf/clinic-reports/flame-login-<timestamp>.html`.
* [ ] `run-doctor-login.sh` and (optionally) `run-bubbleprof-login.sh` with similar naming.
* [ ] Docs in `perf/README.md`:

  * [ ] “To investigate CPU hotspot in login, run X and open Y”.
* [ ] Consider 0x integration as a lightweight alternative. ([DEV Community][3])

**Definition of Done**

* [ ] A new dev can generate a flamegraph for a known scenario with a single command and know where the HTML appears.
* [ ] Scripts are executable and documented.

**Related**

* Clinic.js usage & visualization docs. ([Clinic.js][9])

---

## T-10 – Apply pools to one real Node hot path

**Status:** TODO
**Blocked by:** T-05, T-06, T-07, T-08, T-09, T-03, T-04
**Blocks:** – (can be extended later)

**Description**
Take one real-world high-churn Node path (e.g. message router, login handler) and apply the generic Pool to its key objects, verifying improvement with your perf toolchain.

**Requirements**

* [ ] Use macro + memory harness to pick a real hotspot.
* [ ] Define a “pool spec” for object type:

  * [ ] Lifecycle (acquire → init → use → release).
  * [ ] Owning scope.
  * [ ] Initial `maxSize`.
* [ ] Replace direct allocations in that path with pool usage (or `withPooled` helper).
* [ ] Update perf tests:

  * [ ] Micro: measure pool vs no-pool path.
  * [ ] Macro: compare p95/p99 before vs after.
  * [ ] Memory: check heap growth and GC time are stable or improved.

**Definition of Done**

* [ ] Code uses pools in exactly one carefully chosen path.
* [ ] Perf deltas are recorded (even if modest).
* [ ] No new leaks detected in memory harness; tests pass.
* [ ] Notes added to `perf/README.md` describing the change and when to copy the pattern.

**Related**

* Real-world Node perf tuning stories for inspiration. ([AppSignal Blog][7])

---

## T-11 – Solid view model pool primitives

**Status:** TODO
**Blocked by:** T-06, T-05, T-08
**Blocks:** T-12

**Description**
Implement Solid-side pooling primitives: `ViewModelPool` and `useViewModelPoolForList`, focusing on view models/props, not DOM.

**Requirements**

* [ ] Define Solid-aware `ViewModelPool<VM>` built on generic `Pool<VM>` (no DOM refs inside VMs).
* [ ] Implement `useViewModelPoolForList` hook:

  * [ ] Accepts `rawList` accessor and config (`pool`, `keyOf`, `initVM`, `destroyVM?`).
  * [ ] Reconciles list by key; acquires/releases VMs appropriately.
  * [ ] Uses `onCleanup` to release all VMs when parent unmounts.
* [ ] Add example:

  * [ ] High-churn list (e.g. log or chat) rendered via `<For each={vms()}>`.
* [ ] Document constraints:

  * [ ] No DOM in VMs.
  * [ ] Signals inside VMs must be cleaned up in `destroyVM`.

**Definition of Done**

* [ ] Example Solid component compiles and renders with pooled VMs.
* [ ] VMs are not leaked across mounts/unmounts in basic manual tests.
* [ ] Docs in a short `perf/solid-pools.md` explaining when to use this.

**Related**

* Solid docs on list rendering `<For>` / `<Index>`. ([Solid Docs][10])

---

## T-12 – Solid churn + memory regression tests

**Status:** TODO
**Blocked by:** T-11, T-05, T-08
**Blocks:** –

**Description**
Add automated churn tests for pooled Solid lists/toasts, comparing memory and GC behaviour with and without pooling.

**Requirements**

* [ ] Choose runner (Playwright, Vitest+jsdom, or a small browser harness).
* [ ] Implement test that:

  * [ ] Mounts a Solid component using `useViewModelPoolForList`.
  * [ ] Adds/removes items in a loop (e.g. thousands of iterations).
  * [ ] Samples `performance.memory.usedJSHeapSize` (real browser) or captures heap snapshots via DevTools tooling.
* [ ] Compare:

  * [ ] Plain list vs pooled VM list.
  * [ ] Check memory usage plateaus or grows slowly for pooled version.
* [ ] Integrate summary metrics into `perf/regression` (even if only locally at first).

**Definition of Done**

* [ ] Repeated mount/unmount scenarios don’t show obvious leaks in pooled version.
* [ ] Regression script can detect if pooled implementation regresses vs baseline.
* [ ] Docs updated to reflect measured trade-offs of pooling in Solid.

**Related**

* Solid perf discussions & view model patterns. ([DEV Community][11])

---

If you want, I can next turn each of these into separate `docs/agile/tasks/*.md` files with your usual frontmatter + tags, wired to your existing Kanban columns.

[1]: https://github.com/tinylibs/tinybench?utm_source=chatgpt.com "tinylibs/tinybench: 🔎 A simple, tiny and lightweight ..."
[2]: https://middleware.io/blog/nodejs-performance-monitoring/?utm_source=chatgpt.com "Node.js Performance Monitoring: A Complete Guide"
[3]: https://dev.to/imsushant12/profiling-and-benchmarking-nodejs-applications-2h2o?utm_source=chatgpt.com "Profiling and Benchmarking Node.js Applications"
[4]: https://fastify.io/docs/v5.2.x/Guides/Benchmarking/?utm_source=chatgpt.com "Benchmarking"
[5]: https://dev.to/wallacefreitas/benchmarking-tests-in-nodejs-api-a-comprehensive-guide-5d8j?utm_source=chatgpt.com "Benchmarking Tests in Node.js API: A Comprehensive Guide"
[6]: https://www.npmjs.com/package/autocannon?utm_source=chatgpt.com "autocannon"
[7]: https://blog.appsignal.com/2025/06/04/performance-and-stress-testing-in-nodejs.html?utm_source=chatgpt.com "Performance and Stress Testing in Node.js - AppSignal Blog"
[8]: https://github.com/EmbarkStudios/tiny-bench?utm_source=chatgpt.com "EmbarkStudios/tiny-bench: A tiny benchmarking library"
[9]: https://clinicjs.org/?utm_source=chatgpt.com "Clinic.js - An Open Source Node.js performance profiling suite ..."
[10]: https://docs.solidjs.com/concepts/control-flow/list-rendering?utm_source=chatgpt.com "List rendering"
[11]: https://dev.to/ryansolid/thinking-granular-how-is-solidjs-so-performant-4g37?utm_source=chatgpt.com "Thinking Granular: How is SolidJS so Performant?"
