# Codex Linux Fork

**UNOFFICIAL - NOT AFFILIATED WITH OpenAI**

This is a community-maintained Linux build of the Codex.app backend and UI. This project is NOT endorsed, maintained, or supported by OpenAI. Use at your own risk.

See [LEGAL.md](LEGAL.md) for complete disclaimer and licensing information.

---

## Overview

This project packages the real extracted Codex desktop shell for Linux and pairs it with the open-source `codex-app-server`.

It consists of:

1. **Codex Backend (Rust)**
   - Open-source: [github.com/openai/codex](https://github.com/openai/codex)
   - Compiled from source for Linux as `codex-app-server`
   - Invoked through the launcher contract expected by the extracted shell

2. **Codex UI (Electron)**
   - Extracted from Codex.app macOS binary
   - Repackaged as a native Linux Electron application
   - Communicates with the backend over the app-server stdio transport

3. **Build Infrastructure**
   - Docker-based reproducible builds
   - GitHub Actions packaging pipeline for x86_64 and ARM64
   - Native ARM64 Debian packaging with `dpkg-deb`
   - Real-VM validation on Ubuntu ARM64 via OrbStack

## Features

- **Real extracted shell**: packages the actual `.vite/build` and `webview` assets from Codex.app
- **OSS backend contract match**: stages `resources/codex`, `resources/codex-app-server`, and `resources/rg`
- **Linux package formats**: `.deb`, `AppImage`, and `.tar.gz`
- **Automated CI/CD**: GitHub Actions builds x86_64 and ARM64 package sets and can smoke-test the unpacked app
- **Zero Vendor Approach**: Codex.app downloaded at build time, only source code in repository
- **Open Source**: Build scripts and infrastructure under MIT license
- **Reproducible Builds**: Docker-based for consistency across platforms

## Quick Start

### Build Locally

```bash
git clone https://github.com/openai/codex-linux
cd codex-linux
make quick
ls -lh release/
```

## Architecture

```
Codex.app (macOS binary, extracted at build time)
  |
  +-- Webview UI (React/Vite)
  +-- Assets & resources
  |
  v
Build System (This Repository)
  |
  +-- Docker container environment
  +-- Electron builder
  +-- Multi-architecture compilation
  |
  v
Codex-rs (OSS Backend)
  |
  +-- Rust binary compilation (codex-app-server)
  +-- API server (JSON-RPC over WebSocket/stdio)
  |
  v
Linux Packages
  |
  +-- .deb (native dpkg-deb path)
  +-- AppImage
  +-- .tar.gz
  +-- Architectures: x86_64, arm64
```

## Supported Platforms

| Target | Artifacts | Validation status |
|--------|-----------|-------------------|
| Ubuntu ARM64 VM | `.deb`, `AppImage` | Verified launch and app-server handshake |
| Ubuntu ARM64 VM | `.tar.gz` | Built, not runtime-validated in this pass |
| Linux x86_64 | packages | Built in CI, needs dedicated runtime validation |

## Build System

### Local Builds

```bash
# Quick build
make quick

# Build-specific formats (requires app/ directory)
make deb
make appimage
make tarball
```

### CI/CD Pipeline

Triggered automatically on:
- **Pull requests**: quick package builds for x86_64 and ARM64
- **Pushes to main/develop**: quick package builds for x86_64 and ARM64
- **Tag push** (`v*`): full package builds, smoke tests, and GitHub release publishing

See [CI_CD.md](CI_CD.md) and [TESTING.md](TESTING.md) for the current CI and runtime validation flow.

## Build Artifacts

| Component | Size |
|-----------|------|
| Rust binary (codex-app-server) | ~54 MB |
| .deb package | ~108 MB |
| AppImage | ~142 MB |
| .tar.gz tarball | ~139 MB |

All packages include SHA256 checksums. Verify with:
```bash
sha256sum -c SHA256SUMS
```

## Getting Started

### For Users

1. Download a pre-built package from [Releases](https://github.com/openai/codex-linux/releases)
2. Install for your distribution (see [DISTRO_SUPPORT.md](DISTRO_SUPPORT.md))
3. Run `codex` to start

### For Developers

1. Clone the repository:
   ```bash
   git clone --recursive https://github.com/openai/codex-linux
   cd codex-linux
   ```

2. Install dependencies:
   - Docker and Docker Compose
   - Git with large file support (for Codex.app extraction)
   - 50GB free disk space (for Docker build)

3. Build:
   ```bash
   make quick        # Quick local build
   make ci-build     # Full build with Codex.app download
   ```

4. Find artifacts in `./release/`

### For Continuous Integration

1. Fork the repository
2. Push a semantic version tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. GitHub Actions automatically builds and creates a release

## Documentation

| Document | Purpose |
|----------|---------|
| [CI_CD.md](CI_CD.md) | CI/CD architecture, workflows, local testing |
| [BUILD_MATRIX.md](BUILD_MATRIX.md) | Multi-architecture support, platforms, troubleshooting |
| [DISTRO_SUPPORT.md](DISTRO_SUPPORT.md) | Per-distribution installation, compatibility, performance |
| [CODEX_REVERSE_ENGINEERING.md](CODEX_REVERSE_ENGINEERING.md) | Technical deep-dive, binary analysis, architecture |
| [LEGAL.md](LEGAL.md) | Legal disclaimer, licensing, intellectual property |
| [AGENTS.md](AGENTS.md) | Build commands, project structure, development guide |

## Legal & Licensing

### This Repository

```
Copyright (c) 2024 Community Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

**License**: MIT ([LICENSE](LICENSE))

### Component Licenses

| Component | License | Source | Status |
|-----------|---------|--------|--------|
| Build scripts & infrastructure | MIT | This repository | Open Source |
| codex-rs backend | Apache-2.0 | [github.com/openai/codex](https://github.com/openai/codex) | Open Source |
| Codex.app UI | Proprietary | Downloaded at build time | Proprietary |

### Important Notes

1. **Codex.app is NOT included in this repository**
   - Downloaded from OpenAI at build time
   - You accept the Codex.app EULA when building
   - See https://codex.openai.com/ for terms

2. **Not endorsed by OpenAI**
   - This is a community fork
   - No official support
   - Use entirely at your own risk

3. **Intellectual Property**
   - Codex is a trademark of OpenAI
   - This project respects OpenAI's IP rights
   - No redistribution of proprietary components

See [LEGAL.md](LEGAL.md) for full legal information.

## Troubleshooting

### Build Failures

1. Ensure Docker is running and has sufficient resources
2. Verify 50GB free disk space
3. Check network connectivity for Codex.app download
4. Review GitHub Actions logs for detailed error messages

### Runtime Issues

1. **Missing libraries**: Install via package manager
   ```bash
   # Ubuntu/Debian
   sudo apt install libgtk-3-0 libnotify4

   # Fedora
   sudo dnf install gtk3 libnotify
   ```

2. **Permission denied on AppImage**
   ```bash
   chmod +x Codex-*.AppImage
   ```

3. **Binary not found**: Add to PATH or use absolute path
   ```bash
   export PATH="/opt/codex:$PATH"
   ```

See [BUILD_MATRIX.md](BUILD_MATRIX.md#troubleshooting) for distribution-specific issues.

## Contributing

### Improving the Build System

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/improvement`
3. Make changes
4. Test locally: `make quick`
5. Push and open a pull request

### Adding Distribution Support

See [DISTRO_SUPPORT.md](DISTRO_SUPPORT.md#contributing-new-distributions)

### Reporting Issues

- **Build failures**: Include Docker version and distribution
- **Runtime issues**: Include distribution, architecture, package format
- **Feature requests**: Describe use case and requirements

## Related Projects

- **Codex (OSS)**: https://github.com/openai/codex
- **Codex.app**: https://codex.openai.com/
- **Electron**: https://www.electronjs.org/
- **Rust**: https://www.rust-lang.org/

## Support

This is a community project with no official support.

- **GitHub Issues**: Report bugs or ask questions
- **GitHub Discussions**: General help and sharing
- **Documentation**: See files listed in Documentation section
- **OpenAI**: For official Codex issues, contact https://codex.openai.com/

**Note**: OpenAI does not provide support for this project.

---

## Disclaimer

**This project is UNOFFICIAL and NOT affiliated with OpenAI.**

- No endorsement from OpenAI
- No official support
- Use at your own risk
- Respect Codex.app license and terms
- Community-maintained

By using this project, you agree to the terms in [LEGAL.md](LEGAL.md).

---

**Made by the community**

Questions or issues? See [LEGAL.md](LEGAL.md) or open an issue on GitHub.
