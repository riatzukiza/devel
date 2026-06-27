# CI/CD Architecture

## Overview

This project implements a unified, efficient CI/CD pipeline that consolidates building across multiple architectures and distributions into a single workflow.

The pipeline follows a "zero vendor" approach where Codex.app is downloaded from official OpenAI sources at build time, ensuring the repository contains only source code and build scripts.

## Workflow Architecture

```
GitHub Actions (ci.yml)
  |
  +-- detect job
  |   +-- Determine repo version (from git tag or commit)
  |   +-- Detect Codex.app version (from GitHub API or input)
  |   +-- Generate build matrix (quick or full)
  |
  +-- build job (matrix)
  |   +-- Checkout repository and codex-oss
  |   +-- Download Codex.app DMG from OpenAI
  |   +-- Extract webview and assets
  |   +-- Docker build for target architecture/distro
  |   +-- Build Rust backend (codex-app-server)
  |   +-- Build packages (.deb, .rpm, AppImage, .tar.gz)
  |   +-- Create SHA256 checksums
  |   +-- Upload artifacts
  |
  +-- release job (on tag)
  |   +-- Download all build artifacts
  |   +-- Organize by distribution and architecture
  |   +-- Create comprehensive manifest
  |   +-- Create GitHub Release with downloads
  |   +-- Publish release artifacts (90 day retention)
  |
  +-- summary job
      +-- Print build summary to step summary
```

## Build Modes

### Quick Mode

**Triggers**: Pull requests, manual dispatch with `build_mode=quick`

**Matrix**: 2 architectures × 1 distribution
- x86_64 on Ubuntu 22.04
- arm64 on Ubuntu 22.04

**Duration**: ~15-20 minutes

**Purpose**: Fast feedback for PRs and development

### Full Mode

**Triggers**: Tag push (v*), manual dispatch with `build_mode=full`

**Matrix**: 3 architectures × 4 distributions
- x86_64, arm64, armv7
- Ubuntu 22.04, Debian 11, Fedora 38, Alpine latest

**Duration**: ~60-90 minutes (depending on cache state)

**Purpose**: Complete release with all packages and architectures

## Workflow File

**Location**: `.github/workflows/ci.yml`

**Key Components**:

1. **detect job**: Version detection and matrix generation
2. **build job**: Multi-platform Docker builds
3. **release job**: Artifact organization and GitHub Release creation
4. **summary job**: Workflow summary and reporting

## Building Locally

### Quick Build

```bash
make quick
```

Runs `./scripts/ci-build.sh latest` which:
1. Downloads latest Codex.app
2. Extracts webview and assets
3. Builds for x86_64 and arm64 on Ubuntu
4. Places artifacts in `./release/`

### Full Build

```bash
make full
```

Triggers GitHub Actions workflow with `build_mode=full`.

Alternatively, use the CLI:
```bash
gh workflow run ci.yml --ref main -f build_mode=full
```

### Manual CI Build

```bash
./scripts/ci-build.sh [VERSION]
```

Where VERSION is a Codex.app version or "latest".

## Codex.app Download Strategy

The workflow attempts to download Codex.app from official sources in order:

1. `https://persistent.oaistatic.com/codex-app-prod/Codex.dmg` (Official)
2. `https://storage.googleapis.com/codex-releases/Codex.dmg` (Fallback)

**Note**: Codex.app is proprietary and requires signing into ChatGPT at runtime. The DMG download provides the pre-compiled binary and webview assets extracted at build time.

If all sources fail, the workflow will use any cached/existing `app/` directory in the repository.

## Repository Structure

```
codex_app_reverse_engineer/
├── .github/
│   └── workflows/
│       └── ci.yml                      # Unified CI/CD pipeline
├── scripts/
│   ├── ci-build.sh                     # CI orchestration script
│   └── build-distro-matrix.json        # Build configuration
├── docker/
│   ├── Dockerfile                      # Docker build environment
│   ├── docker-compose.yml              # Container orchestration
│   └── build.sh                        # Build script (Docker)
├── codex-oss/                          # Open-source backend (git repo)
│   └── codex-rs/
│       └── codex-app-server/           # Rust binary source
├── codex-linux-fork/                   # Electron wrapper
│   ├── package.json                    # Node dependencies
│   ├── main.js                         # Electron main process
│   ├── bin/                            # Compiled binaries
│   ├── resources/                      # Icons, ripgrep
│   └── webview/                        # Extracted UI assets
├── app/                                # (Generated) Extracted Codex.app
├── release/                            # (Generated) Build artifacts
├── Makefile                            # Build targets
├── README.md                           # User documentation
├── CI_CD.md                            # This file
├── BUILD_MATRIX.md                     # Architecture/distro details
├── DISTRO_SUPPORT.md                   # Per-distro installation
└── LEGAL.md                            # Legal disclaimer
```

## What's NOT in the Repository

- Codex.app binary (downloaded at build time)
- Extracted webview assets (generated at build)
- Build artifacts (Linux packages)
- node_modules, target/, dist/ directories
- .DS_Store, temporary files

This keeps the repository at ~50MB instead of 0.5GB+.

## Environment Variables

For local builds, the following variables can be configured:

```bash
# Codex.app version (default: auto-detect latest)
export CODEX_VERSION="0.1.2"

# Override download URL (for internal/cached builds)
export CODEX_DMG_URL="https://internal.example.com/Codex.dmg"

# Docker build flags
export DOCKER_BUILDKIT=1

# Cargo cache location
export CARGO_TARGET_DIR="/build/target-cache"
```

## Performance Optimization

### Build Time Reduction

1. **Cargo caching**: Reuses compiled dependencies across builds
2. **Docker layer caching**: Reuses base image layers
3. **Parallel jobs**: Builds multiple architectures concurrently
4. **Minimal dependencies**: Only production dependencies in final packages

### Disk Space

Typical requirements:
- Repository clone: ~200MB
- Docker build: ~20GB per architecture
- Build artifacts: ~400MB (all packages)

**Minimum**: 50GB free space recommended

## Security Considerations

### No Proprietary Code in Repository

- Codex.app is downloaded from official OpenAI sources only
- No redistribution of proprietary components
- Build scripts and infrastructure are open source (MIT)

### Artifact Verification

All released artifacts include SHA256 checksums. Verify before use:

```bash
sha256sum -c SHA256SUMS
```

### Dependency Management

- Codex backend: Pulled fresh from github.com/openai/codex on each build
- Node modules: Installed from npm registry with package-lock.json
- Build environment: Fresh Docker images on each build

## Troubleshooting

### Workflow Failures

1. **Codex.app download fails**
   - Check internet connectivity
   - Verify OpenAI's release servers are accessible
   - Try manual download and `make build`

2. **Docker build fails**
   - Verify Docker daemon is running
   - Check disk space (50GB minimum)
   - Review Docker build logs in GitHub Actions

3. **Artifact upload fails**
   - Check GitHub Actions permissions
   - Verify artifact retention settings
   - Ensure release has write permissions

### Performance Issues

1. **Build takes too long**
   - First build is slower (compiles Rust)
   - Subsequent builds use cache
   - Check Docker resource limits

2. **Out of disk space**
   - Run `make clean` to remove build artifacts
   - Run `make prune` to clean Docker
   - Increase available disk space

## Version Management

### Repository Version

Determined from:
1. Git tag if pushed (v0.1.0)
2. `git describe --tags` fallback
3. Default "0.1.0-dev" if no tags

### Codex Version

Determined from:
1. GitHub workflow input (manual dispatch)
2. Auto-detect latest from github.com/openai/codex
3. Environment variable CODEX_VERSION

### Release Metadata

Each release includes:
- Version numbers
- Build date (UTC)
- Build matrix details
- Architecture and distribution info
- SHA256 checksums

## CI/CD Best Practices

### 1. Semantic Versioning

Tag releases semantically:
```bash
git tag -a v0.1.0 -m "Release v0.1.0 - Linux fork"
git push origin v0.1.0
```

### 2. Pre-release Testing

Test on PRs before releasing:
```bash
# PR triggers quick build automatically
# Verify artifacts in GitHub Actions
```

### 3. Monitoring

Check workflow status:
```bash
gh workflow list
gh run list --workflow ci.yml
```

View detailed logs:
```bash
gh run view <RUN_ID> --log
```

### 4. Release Notes

Generated automatically from:
- Git tags and commit messages
- Build metadata
- Artifact checksums

## Customization

### Custom Codex.app Source

For private/internal Codex builds, modify `.github/workflows/ci.yml`:

```yaml
- name: Download Codex.app
  run: |
    curl -H "Authorization: Bearer ${{ secrets.CODEX_DOWNLOAD_TOKEN }}" \
      -o Codex.dmg \
      https://private.example.com/codex/latest.dmg
```

### Additional Distributions

To add a new distribution, modify the matrix in `ci.yml`:

```yaml
{"arch": "x86_64", "docker_arch": "amd64", "distro": "ubuntu-24.04", "base": "ubuntu:24.04"}
```

### Docker Registry Publishing

To publish Docker images after build, add step in `release` job:

```yaml
- name: Build and push Docker images
  run: |
    docker build -t ${{ secrets.DOCKER_REGISTRY }}/codex:$VERSION .
    docker push ${{ secrets.DOCKER_REGISTRY }}/codex:$VERSION
```

## Maintenance

### Regular Tasks

- Monitor GitHub Actions for build failures
- Update Codex backend version when new releases available
- Review and update dependencies quarterly
- Test on new Linux distributions annually

### Archive Policy

- Release artifacts: 90 days retention
- PR artifacts: 30 days retention
- Automatic cleanup via GitHub Actions

## Related Documentation

- [README.md](README.md) - Project overview and quick start
- [BUILD_MATRIX.md](BUILD_MATRIX.md) - Architecture and distribution details
- [DISTRO_SUPPORT.md](DISTRO_SUPPORT.md) - Per-distribution installation guides
- [LEGAL.md](LEGAL.md) - Legal disclaimer and licensing
