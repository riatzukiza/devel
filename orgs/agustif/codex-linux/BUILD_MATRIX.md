# Multi-Architecture Build Matrix

This project builds for multiple Linux architectures using Docker and parallel CI/CD jobs.

## Supported Architectures

### Enabled (Default)

| Architecture | Docker | Rust Target | Electron | Use Cases |
|---|---|---|---|---|
| **x86_64** | amd64 | x86_64-unknown-linux-gnu | ✅ | Intel/AMD servers, desktops, laptops |
| **ARM64** | arm64 | aarch64-unknown-linux-gnu | ✅ | Apple Silicon Macs, AWS Graviton, Raspberry Pi 4+ |
| **ARMv7** | arm/v7 | armv7-unknown-linux-gnueabihf | ✅ | 32-bit ARM, older Raspberry Pi, embedded |

### Available (Disabled by Default)

| Architecture | Docker | Rust Target | Electron | Status | Notes |
|---|---|---|---|---|---|
| PowerPC 64-bit LE | ppc64le | powerpc64le-unknown-linux-gnu | ❌ | Partial | IBM POWER servers only, no Electron |
| IBM s390x | s390x | s390x-unknown-linux-gnu | ❌ | Partial | Mainframes only, no Electron |

## Build Formats

### AppImage
- **File**: `Codex-VERSION-ARCH.AppImage`
- **Size**: ~140 MB
- **Installation**: Make executable and run
- **Architectures**: x86_64, arm64, armv7l
- **Portability**: Works on any recent Linux distro

```bash
chmod +x Codex-*.AppImage
./Codex-*.AppImage
```

### Debian Package (.deb)
- **File**: `codex-linux_VERSION_ARCH.deb`
- **Size**: ~110 MB
- **Installation**: `sudo apt install ./codex-linux_*.deb`
- **Architectures**: x86_64, arm64, armv7l
- **Best for**: Ubuntu, Debian, Linux Mint

```bash
sudo dpkg -i codex-linux_*.deb
codex
```

### Tarball (.tar.gz)
- **File**: `codex-linux-VERSION-ARCH.tar.gz`
- **Size**: ~140 MB
- **Installation**: Extract and run
- **Architectures**: x86_64, arm64, armv7l
- **Portability**: No dependencies, works anywhere

```bash
tar xzf codex-linux-VERSION-ARCH.tar.gz
cd Codex-VERSION/
./Codex
```

### Binary (Static)
- **File**: `codex-ARCH`
- **Size**: ~54 MB (Rust backend only)
- **Usage**: `./codex-ARCH`
- **Architectures**: All (x86_64, arm64, armv7l, ppc64le, s390x)
- **Note**: Backend only, no Electron UI

## CI/CD Workflows

### Main Workflow: `build-multi-arch.yml`

**Triggers**:
- Push to `main` or `develop` branches
- Tag push (`v*`)
- Manual dispatch (workflow_dispatch)

**Build Matrix**:
```yaml
strategy:
  matrix:
    arch: [x86_64, arm64, armv7l]
    runner: [ubuntu-latest]
```

**Parallel Jobs**: 3 (one per architecture)
**Build Time**: ~1 hour total (20 min per arch)

**Steps per Job**:
1. Download Codex.app from OpenAI
2. Extract webview and assets
3. Build Rust backend (codex-app-server)
4. Download ripgrep binary
5. Install Node dependencies
6. Build Electron packages
7. Create checksums
8. Upload artifacts

### Artifact Management

**Artifacts per Architecture**:
```
release-assets/
├── x86_64/
│   ├── Codex-*.AppImage
│   ├── codex-linux_*.deb
│   ├── codex-linux-*.tar.gz
│   ├── codex-x86_64 (binary)
│   └── SHA256SUMS
├── arm64/
│   ├── Codex-*.AppImage
│   ├── codex-linux_*.deb
│   ├── codex-linux-*.tar.gz
│   ├── codex-arm64 (binary)
│   └── SHA256SUMS
└── armv7l/
    ├── Codex-*.AppImage
    ├── codex-linux_*.deb
    ├── codex-linux-*.tar.gz
    ├── codex-armv7l (binary)
    └── SHA256SUMS
```

**Total Size**: ~1 GB for all architectures
**Retention**: 30 days for branch builds, permanent for tags

## Configuration

### Build Matrix Configuration

Edit `.github/build-matrix.json` to:
- Enable/disable architectures
- Change Docker base images
- Update tool URLs (ripgrep, etc.)
- Add new architectures

### Example: Enable PowerPC Builds

```json
{
  "name": "ppc64le",
  "enabled": true
}
```

### Example: Add New Architecture

```json
{
  "name": "riscv64",
  "label": "RISC-V 64-bit",
  "docker_arch": "riscv64",
  "rust_target": "riscv64gc-unknown-linux-gnu",
  "electron_arch": null,
  "ripgrep_url": "https://...",
  "enabled": true
}
```

## Local Building

### Build for Specific Architecture

```bash
# Build for x86_64
docker run --rm --platform linux/amd64 \
  -v $(pwd):/build \
  ubuntu:22.04 \
  /bin/bash /build/scripts/build-arch.sh x86_64

# Build for ARM64
docker run --rm --platform linux/arm64 \
  -v $(pwd):/build \
  ubuntu:22.04 \
  /bin/bash /build/scripts/build-arch.sh arm64

# Build for ARMv7
docker run --rm --platform linux/arm/v7 \
  -v $(pwd):/build \
  ubuntu:22.04 \
  /bin/bash /build/scripts/build-arch.sh armv7l
```

### Native Build (Linux Only)

If you're on Linux with matching architecture:

```bash
# Build for current architecture
make build

# Specific architecture
./scripts/build-arch.sh x86_64
```

## Cross-Compilation

### x86_64 → ARM64

```bash
cd codex-oss/codex-rs
cargo build --release --target aarch64-unknown-linux-gnu
```

### x86_64 → ARMv7

```bash
cd codex-oss/codex-rs
cargo install cross
cross build --release --target armv7-unknown-linux-gnueabihf
```

## Continuous Integration Details

### Environment Variables per Job

```yaml
CARGO_TARGET_DIR=/build/codex-oss/codex-rs/target
ARCH=x86_64|arm64|armv7l
DOCKER_ARCH=amd64|arm64|arm/v7
```

### Failure Handling

- **Fail-fast**: Disabled (all architectures attempt build)
- **Artifact Upload**: Always happens (even on failure)
- **Release Creation**: Only on successful builds
- **Timeout**: 60 minutes per job

### Performance Optimizations

1. **Parallel Jobs**: Builds run simultaneously
2. **Docker Cache**: Layer caching across runs
3. **Artifact Deduplication**: Shared checksums
4. **Concurrent Upload**: Parallel artifact uploads

**Estimated Build Times**:
- First build: 45-60 min (dependencies compiled)
- Cached builds: 15-20 min per architecture
- Total (3 archs): 1-2 hours

## Testing Builds Locally

### Dry-Run with Act

```bash
# Install act (if not present)
brew install act

# Configure Docker image
mkdir -p ~/.config/act
echo '-P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest' > ~/.config/act/actrc

# Dry-run (no containers)
act push --dryrun

# Run workflow locally
act push --container-architecture linux/amd64 -b
```

### Manual Test Build

```bash
# Download Codex.app
./scripts/ci-build.sh latest

# Verify artifacts
ls -lh release/*/
file release/*/*
```

## Troubleshooting

### Architecture Not Supported

Check Docker daemon:
```bash
docker buildx ls
docker run --rm --platform linux/arm64 busybox uname -m
```

### Ripgrep Not Found

Some architectures may not have prebuilt ripgrep. Build from source:
```bash
cargo install ripgrep --target aarch64-unknown-linux-gnu
```

### Electron Build Fails

Ensure native dependencies installed:
```bash
npm rebuild --target=33.0.0 --arch=arm64
```

## Future Enhancements

### Planned

- [ ] RPM package support (Fedora, CentOS, RHEL)
- [ ] Snap package integration
- [ ] Flatpak support
- [ ] Multi-distribution testing (Debian, Alpine, CentOS)
- [ ] Code signing for all architectures
- [ ] Automated testing on QEMU

### Potential

- [ ] Windows builds (WSL2)
- [ ] macOS universal binaries
- [ ] Docker Hub automated builds
- [ ] AUR package (Arch Linux)

## Support Matrix

| OS | Architecture | Package | Status |
|---|---|---|---|
| Ubuntu 22.04 | x86_64 | deb | ✅ Full support |
| Ubuntu 22.04 | ARM64 | deb | ✅ Full support |
| Ubuntu 22.04 | ARMv7 | deb | ✅ Full support |
| Debian 11+ | x86_64 | deb | ✅ Full support |
| Fedora 38+ | x86_64 | rpm | ⏳ Planned |
| Alpine | x86_64 | apk | ⏳ Planned |
| Raspberry Pi 4 | ARM64 | deb | ✅ Full support |
| Raspberry Pi 3 | ARMv7 | deb | ✅ Full support |

## References

- [Docker Buildx Multi-Platform Builds](https://docs.docker.com/build/building/multi-platform/)
- [GitHub Actions Build Matrix](https://docs.docker.com/build/building/multi-platform/)
- [Rust Cross-Compilation Targets](https://forge.rust-lang.org/release/platform-support.html)
- [Electron Supported Architectures](https://www.electronjs.org/docs/tutorial/using-native-node-modules)
