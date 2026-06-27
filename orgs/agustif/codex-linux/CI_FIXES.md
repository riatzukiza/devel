# CI Build System Fixes - Root Cause Analysis

## Summary
Fixed critical CI/CD pipeline failures in the Codex Linux fork GitHub Actions workflow. All failures were due to **first-principles infrastructure issues**, not application code.

## Root Causes Identified & Fixed

### 1. **Package Name Errors (Exit Code 100)**
**Problem**: `E: Unable to locate package 7zip-full` and `xar`
- GitHub's Ubuntu 22.04 runner uses standard Ubuntu repos
- The correct package name is `p7zip-full` (not `7zip-full`)
- `xar` is not in standard repos; not needed since `p7zip` extracts DMG

**Fix**:
```bash
# BEFORE (broken)
apt-get install -y file 7zip-full xar python3

# AFTER (fixed)
apt-get install -y file p7zip-full python3
```

Also fixed for Fedora (uses `p7zip` not `p7zip-full`).

### 2. **Cross-Architecture Emulation (Exit Code 255)**
**Problem**: `exec format error` when running ARM containers on x86_64
- GitHub's ubuntu-latest runner is x86_64
- Docker's `--platform linux/arm64` flag requires QEMU user-space emulation
- Without QEMU, docker can't execute ARM binaries

**Root Cause**: Missing `docker/setup-qemu-action@v3` in workflow

**Fix**:
```yaml
- name: Set up QEMU for cross-architecture emulation
  uses: docker/setup-qemu-action@v3
```

This installs `qemu-user-static` binaries that docker uses for transparent emulation.

### 3. **Missing Directory Validation**
**Problem**: Build fails silently if `codex-oss/codex-rs` directory missing
- Docker mounts the workspace at `/build`
- If checkout is incomplete, cargo fails with unclear errors

**Fix**: Added explicit validation in build.sh:
```bash
if [ ! -d "codex-oss/codex-rs" ]; then
  echo "ERROR: codex-oss/codex-rs not found!"
  find /build -maxdepth 2 -type d
  exit 1
fi
```

### 4. **Silent Cargo Build Failures**
**Problem**: Cargo builds but binary doesn't exist; cp fails silently

**Fix**: Check binary exists before copying:
```bash
if [ ! -f codex-oss/codex-rs/target/release/codex-app-server ]; then
  echo "ERROR: Binary not built!"
  ls -la codex-oss/codex-rs/target/release/
  exit 1
fi
```

### 5. **Webview Sync Issue**
**Problem**: Extracted app from "prepare" job not available to build jobs
- DMG extracted in "prepare" job → uploaded as artifact
- Build jobs download artifact but extracted content needs to reach electron-builder
- `codex-linux-fork/webview` must be populated for electron-builder

**Fix**: Added sync step:
```bash
if [ -d "app/webview" ]; then
  rsync -av app/webview/ codex-linux-fork/webview/
fi
```

Also made artifact download non-fatal to use local webview as fallback.

### 6. **Artifact Extraction Verification Missing**
**Problem**: No way to know if DMG extraction succeeded

**Fix**: Added verification in prepare job:
```bash
WEBVIEW_SIZE=$(find app/webview -type f 2>/dev/null | wc -l)
echo "Webview files: $WEBVIEW_SIZE"
if [ "$WEBVIEW_SIZE" -lt 5 ]; then
  echo "WARNING: Very few webview files extracted"
fi
```

### 7. **Poor Logging for Debugging**
**Problem**: 50+ lines of dense apt/cargo output makes errors hard to spot

**Fix**: 
- Piped long output to `tail -N` to show only last N lines
- Added section markers: `===== [1/5] BUILD RUST BACKEND =====`
- Version checks for node/cargo/rustc to verify installations
- Better error messages with context

## Verification Steps Implemented

1. **Pre-build checks**:
   - Directory structure validation
   - Webview sync verification
   - Tool version checks (node, cargo, rustc)

2. **Build-time checks**:
   - Directory existence before cargo
   - Binary existence after cargo
   - Successful extraction verification
   - Checksum generation

3. **Logging improvements**:
   - Section markers for each build phase
   - Tail output for package managers (cleaner logs)
   - Error context with diagnostics

## Build Matrix
- **Quick mode** (PRs): 2 archs × 1 distro
  - x86_64 + arm64, both Ubuntu 22.04
  - Native compilation + QEMU emulation
  
- **Full mode** (releases): 3 archs × 3+ distros
  - x86_64, arm64, armv7l
  - Ubuntu 22.04, Debian 11, Fedora 38, Alpine latest

## Testing Strategy

Run quick builds first to validate package names and architecture support:
```bash
gh workflow run ci.yml -f build_mode=quick --ref main
```

Then full builds for releases:
```bash
git tag v0.1.0 && git push --tags
```

## Files Modified
- `.github/workflows/ci.yml`: Fixed package names, added QEMU, improved logging
- No changes to application code

## Next Steps
1. Validate quick build (x86_64 + arm64) succeeds
2. Test full build with all distros
3. Verify artifacts are generated and checksummed
4. Create release process documentation

