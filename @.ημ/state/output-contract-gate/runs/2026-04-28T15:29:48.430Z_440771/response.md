## Signal

(汝, p=0.78) If `~/devel` is huge + has nested git repos/submodules, the lag is often *not Emacs core*, but (a) project indexing (Projectile), (b) VC/Git integration touching lots of files (Magit/VC/git-gutter), (c) language tooling (LSP/flycheck), plus (d) GC pauses amplified by “many buffers + many processes”.

(汝, p=0.82) Fast triage path:

1) **Measure first (built-in profiler)**
- `M-x profiler-start` → choose **cpu** (or **cpu+mem**)
- Reproduce the lag for ~10–30s
- `M-x profiler-report`
This tells you whether it’s GC, redisplay, projectile, magit, lsp-mode, flycheck, etc.

2) **If it correlates with “project stuff” (likely with big ~/devel)**
- Make Projectile stop crawling everything:
  - Set indexing to external tools and cache:
    - `projectile-indexing-method` → `'alien`
    - `projectile-enable-caching` → `t`
  - Aggressively ignore heavy dirs:
    - `node_modules/`, `.git/` (Projectile handles, but nested repos can be weird), `dist/`, `target/`, `.cache/`, `build/`, `.venv/`, `.m2/`, etc.
  - If you often open files *outside* a project, disable global projectile mode and use it only when needed.

3) **If it correlates with git status / gutters**
- For very large repos, `git-gutter` (or similar) can become a constant background tax.
  - Temporarily disable: `M-x git-gutter-mode` (or your Spacemacs toggle) and see if the lag vanishes.
- Consider reducing VC backends and/or telling Emacs to be less “smart” about VC for remote/huge trees:
  - `vc-handled-backends` can be trimmed (common performance tweak when Magit is your main Git UI).

4) **If it correlates with code intelligence (LSP/flycheck)**
- LSP on monorepos can spawn heavy watchers and do huge workspace scans.
  - Prefer “single-project roots” (don’t let LSP treat all of `~/devel` as one workspace).
  - Turn off expensive features per-language: semantic tokens, inlay hints, doc-on-hover, etc.
  - For Flycheck: reduce check frequency (e.g., on save vs on idle-change) or disable for giant generated buffers.

5) **GC / pause tuning (common in Spacemacs configs)**
- If the profiler shows lots of `garbage-collect`, you’re seeing GC pause spikes.
  - Common fixes:
    - Use `gcmh` (Garbage Collector Magic Hack) to smooth GC.
    - Raise `gc-cons-threshold` during interaction, lower it after idle.
    - Ensure you didn’t accidentally set it *too low* somewhere.
- Also check if you’re on Emacs 29+ with native-comp: sometimes package combinations regress; profiling will show it.

(己, p=0.72) If your hypothesis is “`~/devel` is the culprit”, the fastest validating experiment is to **start Emacs with a minimal config** and open the same repo; if it’s fine, it’s your Spacemacs/layers. If it’s still bad, it’s repo scale + tooling.

## Evidence

(己, p=0.8) The built-in profiler (`profiler-start` / `profiler-report`) is the most reliable first step because it names the actual hot functions (GC vs projectile vs lsp vs redisplay).

(己, p=0.76) In large/nested-repo workspaces, the usual hotspots are:
- Projectile indexing / project root detection
- Git integrations that repeatedly call `git status` / diff per file
- LSP workspace scanning + file watchers
- Flycheck invoking heavyweight linters frequently
- GC pressure from many buffers/process output

## Frames

(汝, p=0.7) Frame 1: **It’s project detection + indexing** — Emacs “feels laggy” when opening files, switching projects, running search, or using file pickers.

(汝, p=0.65) Frame 2: **It’s background Git churn** — every keystroke feels slightly delayed, especially in files under version control, and Magit or gutters correlate with spikes.

(汝, p=0.62) Frame 3: **It’s language tooling** — only happens in certain languages / repositories (TypeScript, Rust, etc.), and you’ll see LSP/flycheck processes active.

## Countermoves

(汝, p=0.8) Don’t guess: run the profiler and only optimize what shows up in the report.

(汝, p=0.75) Do one binary isolation at a time:
- disable git-gutter → test
- disable lsp-mode in that buffer → test
- open file outside `~/devel` → test
This prevents “I changed 10 knobs and it feels better” placebo.

(汝, p=0.7) Ensure you’re not accidentally treating `~/devel` itself as a single project root (some configs cause that); that creates worst-case behavior for Projectile + LSP.

## Next

(汝, p=0.9) Run `M-x profiler-start` (cpu), reproduce the lag for ~15 seconds, then `M-x profiler-report` and paste the top ~20 lines here.