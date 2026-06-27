# CI/CD Implementation Notes

## Architecture

The unified CI workflow (`.github/workflows/ci.yml`) implements a **zero-vendor approach** where:

1. **prepare job**: Downloads Codex.app DMG from official source, extracts resources once
2. **build job**: Matrix of distro/arch combinations, each runs in isolated Docker container
3. **release job**: Collects all artifacts, generates checksums, creates GitHub release

## Key Architectural Decisions

### Zero-Vendor Approach
- DMG downloaded at CI runtime from `https://persistent.oaistatic.com/codex-app-prod/Codex.dmg`
- Extracted once in "prepare" job, cached as GitHub artifact for 1 day
- Build jobs download cache and sync extracted files to `codex-linux-fork/webview/`
- Fallback: Use local webview if cache unavailable
- **Why**: Avoids committing 36MB+ binary to git, ensures fresh downloads

### Containerized Multi-Architecture Builds
- Each distro/arch combo runs in isolated container (`docker run`)
- Host provides mounted workspace, build output collected post-build
- Cross-arch support via QEMU: arm64/armv7l on x86_64 runner via emulation
- **Why**: Ensures reproducible builds, no host-level dependencies leak

### Artifact Strategy
- Prepare job uploads `app/` directory contents (DMG extracted resources)
- Build jobs download, sync webview, then execute in container
- Post-build, `artifacts-${DISTRO}-${ARCH}/` collected and re-uploaded
- Final release job aggregates all and creates GitHub release
- **Why**: Supports parallel builds (9 matrix entries), reduces redundant work

## Build Flow

```
┌─────────────────────────────────────────────────────────┐
│ detect: Versions, matrix generation                     │
└────────┬────────────────────────────────────────────────┘
         │
         ├─→ ┌──────────────────────────────────────────┐
         │   │ prepare: Download & extract Codex.app    │
         │   │ (1 job, ~3-5 min)                       │
         │   └────────┬─────────────────────────────────┘
         │            │
         └─→ ┌────────▼──────────────────────────────────────┐
             │ build: Matrix x9 jobs (parallel)              │
             │ - Ubuntu x86_64 (~20 min)                     │
             │ - Ubuntu arm64 QEMU (~40 min)                 │
             │ - Ubuntu armv7l QEMU (~45 min)                │
             │ - Debian x86_64 (~20 min)                     │
             │ - Debian arm64 (~40 min)                      │
             │ - Fedora x86_64 (~25 min)                     │
             │ - Fedora arm64 (~45 min)                      │
             │ - Alpine x86_64 (~15 min)                     │
             │ - Alpine arm64 (~35 min)                      │
             └────────┬──────────────────────────────────────┘
                      │
                      └─→ ┌──────────────────────────────────────┐
                          │ release: Package & create release    │
                          │ (1 job, ~2 min)                     │
                          └──────────────────────────────────────┘
```

## Timing Estimates

| Mode | Jobs | Est. Time | Notes |
|------|------|-----------|-------|
| quick (PR) | 1 prepare + 2 build + 1 summary | ~45-55 min | x86_64 native + arm64 emulated |
| full (release) | 1 prepare + 9 build + 1 release | ~45-50 min | All arch/distro, parallel |

QEMU adds ~2x build time for emulated architectures (arm64, armv7l).

## Docker Run Configuration

Each build job executes:
```bash
docker run --rm \
  --platform "linux/$DOCKER_ARCH" \        # arch specification
  --volume "$(pwd):/build:rw" \             # workspace mount
  --volume "/tmp/build.sh:/build.sh:ro" \   # build script (read-only)
  -e "CARGO_TARGET_DIR=/build/target-cache" \ # shared cargo cache
  -e "CARGO_TERM_COLOR=always" \            # colored output
  --workdir /build \                        # entry directory
  "$BASE_IMAGE" \                           # ubuntu:22.04 / debian:11 / etc
  bash /build.sh "$ARCH" "$DISTRO"          # execute build
```

### Mount Strategy
- **Read-write**: Workspace at `/build` (source + output)
- **Read-only**: Build script (immutable during execution)
- **Shared**: `target-cache/` directory for incremental cargo builds
- **Rationale**: Minimize container image size, allow output collection

## Package Manager Handling

| Distro | Package Manager | Key Packages |
|--------|-----------------|--------------|
| Ubuntu 22.04 | apt-get | p7zip-full, build-essential, python3 |
| Debian 11 | apt-get | (same as Ubuntu) |
| Fedora 38 | dnf | p7zip, gcc, g++, python3 |
| Alpine latest | apk | build-base, musl-dev, python3 |

Note: `xar` removed (not needed, `p7zip` extracts HFS), `7zip-full` corrected to `p7zip-full`.

## Cargo Build Caching

- `CARGO_TARGET_DIR=/build/target-cache` mounts at `/build/target-cache`
- Each distro/arch gets isolated cache (no cross-contamination)
- Incremental builds: subsequent builds reuse compiled deps
- First build: ~5-10 min (codex-rs compiles from source)

## Error Handling

1. **Pre-build validation**: Check directories exist
2. **Build-time validation**: Verify binary exists after cargo
3. **Post-build collection**: Copy artifacts with `if [ -d ... ]` guards
4. **Non-fatal fallbacks**: ripgrep download fails → log warning, continue

## Logging Strategy

Each build.sh section outputs:
```
===== [1/5] BUILD RUST BACKEND =====
[INSTALL] Dependencies for ubuntu-22.04...
[INSTALL] Node.js...
[INSTALL] Rust...
```

Followed by piped output (last 10 lines) to keep logs concise.

## Next Improvements

1. **Cargo cache persistence across runs**: Use actions/cache@v3 for faster builds
2. **Binary caching**: Pre-build ripgrep, distribute in artifact
3. **Conditional builds**: Skip unsupported distro/arch combos (e.g., Alpine ARM with musl issues)
4. **Notification**: Slack/Discord alerts on build status
5. **Automated releases**: Auto-tag+release on passing builds
6. **Release notes generation**: Automated changelog from commits

## Troubleshooting

### "exec format error"
- Missing QEMU setup for cross-arch
- Solution: Ensure `docker/setup-qemu-action@v3` present

### "Unable to locate package X"
- Wrong package name for distro
- Solution: Check distro's pkg mgr (apt/dnf/apk) has the package

### "cargo: command not found"
- Rust not installed in container
- Solution: Verify rustup installation and PATH setup

### Build times > 60 min
- QEMU emulation is slow
- Solution: Consider native ARM runners or GitHub's arm64 runners (if available)

### Missing artifacts
- Build succeeded but output not collected
- Solution: Verify electron-builder output path matches `Collect artifacts` step
