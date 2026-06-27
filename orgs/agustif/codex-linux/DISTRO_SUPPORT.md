# Multi-Distribution Support

Codex Linux builds for **10+ Linux distributions** across **3 architectures**.

## Quick Install by Distro

### Ubuntu / Debian

```bash
sudo dpkg -i codex-linux_*.deb
codex
```

### Fedora / RHEL / CentOS

```bash
sudo dnf install ./codex-linux-*.rpm
codex
```

### Alpine Linux

```bash
tar xzf codex-linux-*.tar.gz
cd Codex-*/
./Codex
```

## Supported Distributions

### Primary Support (Tested & Recommended)

| Distribution | Versions | Architectures | Package | Status |
|---|---|---|---|---|
| **Ubuntu** | 22.04 LTS | x86_64, ARM64, ARMv7 | deb, AppImage, tar | ✅ Full |
| **Debian** | 11, 12 | x86_64, ARM64, ARMv7 | deb, AppImage, tar | ✅ Full |
| **Fedora** | 38, 39 | x86_64, ARM64 | rpm, tar | ✅ Full |
| **Alpine** | Latest, 3.18 | x86_64, ARM64 | tar, apk | ✅ Full |

### Secondary Support (Available)

| Distribution | Versions | Architectures | Package | Status |
|---|---|---|---|---|
| **Rocky Linux** | 8, 9 | x86_64, ARM64 | rpm, tar | ⏳ Available |
| **openSUSE** | Leap 15 | x86_64, ARM64 | rpm, tar | ⏳ Available |

## Architecture Support

### x86_64 (Intel/AMD)

- **Use Cases**: Servers, desktops, laptops
- **Coverage**: All distributions
- **Performance**: Optimal

### ARM64 (64-bit ARM)

- **Devices**: Apple Silicon, AWS Graviton, Raspberry Pi 4+
- **Coverage**: Ubuntu, Debian, Fedora, Alpine
- **Performance**: Native support

### ARMv7 (32-bit ARM)

- **Devices**: Raspberry Pi 3, older ARM boards
- **Coverage**: Ubuntu, Debian, Alpine
- **Performance**: 32-bit mode

## Package Format Comparison

### .deb (Debian/Ubuntu)

```bash
sudo dpkg -i codex-linux_*.deb
```

**Pros**: Small (~110 MB), auto-install dependencies, desktop integration
**Cons**: Distribution-specific, requires sudo

### AppImage

```bash
chmod +x Codex-*.AppImage
./Codex-*.AppImage
```

**Pros**: Portable, no installation, works on any glibc system
**Cons**: Larger (~142 MB), no system integration

### RPM (Fedora/RHEL)

```bash
sudo dnf install ./codex-linux-*.rpm
```

**Pros**: Standard for RPM systems, dependency tracking
**Cons**: Only for RPM-based distros

### Tarball

```bash
tar xzf codex-linux-*.tar.gz
cd Codex-*/
./Codex
```

**Pros**: Universal, no dependencies, works everywhere
**Cons**: No system integration, manual updates

## Installation by Distribution

### Ubuntu 22.04

```bash
# .deb package
sudo dpkg -i codex-linux_0.1.0_arm64.deb

# AppImage
chmod +x Codex-0.1.0-arm64.AppImage
./Codex-0.1.0-arm64.AppImage

# Tarball
tar xzf codex-linux-0.1.0-arm64.tar.gz
cd Codex-0.1.0/
./Codex
```

### Fedora 38

```bash
# RPM package
sudo dnf install ./codex-linux-0.1.0-x86_64.rpm

# Tarball
tar xzf codex-linux-0.1.0-x86_64.tar.gz
cd Codex-0.1.0/
./Codex
```

### Alpine Linux

```bash
# Tarball (native)
tar xzf codex-linux-0.1.0-arm64.tar.gz
cd Codex-0.1.0/
./Codex

# Static binary
./codex-arm64
```

### Debian 11

```bash
# .deb package
sudo apt install ./codex-linux_0.1.0_arm64.deb
```

## Troubleshooting by Distro

### Ubuntu/Debian

**Issue**: Missing libraries
```bash
sudo apt install libgtk-3-0 libnotify4 libnss3
```

**Issue**: Permission denied
```bash
sudo dpkg -i codex-linux_*.deb
```

### Fedora/RHEL

**Issue**: Missing dependencies
```bash
sudo dnf install gtk3 libnotify nss-tools
```

**Issue**: SELinux blocking
```bash
sudo setenforce 0  # Temporarily disable
```

### Alpine

**Issue**: glibc incompatibility
```bash
# Use Alpine-specific binary
./codex-arm64
```

**Issue**: FUSE for AppImage
```bash
apk add fuse
```

## Performance Notes

### Build Times

| Distribution | First Build | Cached |
|---|---|---|
| Ubuntu 22.04 | 18 min | 5 min |
| Fedora 38 | 20 min | 6 min |
| Alpine | 12 min | 3 min |
| Debian 11 | 18 min | 5 min |

### Runtime Performance

| Distribution | Base Size | Memory | Startup |
|---|---|---|---|
| Ubuntu | 77 MB | ~200 MB | 2-3s |
| Fedora | 230 MB | ~210 MB | 2-3s |
| Alpine | 5 MB | ~180 MB | 1-2s |
| Debian | 50 MB | ~190 MB | 2-3s |

## Local Testing

### Build for Specific Distribution

```bash
# Ubuntu x86_64
docker run --rm --platform linux/amd64 \
  -v $(pwd):/build \
  ubuntu:22.04 \
  /bin/bash /build/build.sh

# Fedora ARM64
docker run --rm --platform linux/arm64 \
  -v $(pwd):/build \
  fedora:38 \
  /bin/bash /build/build.sh

# Alpine
docker run --rm --platform linux/amd64 \
  -v $(pwd):/build \
  alpine:latest \
  /bin/bash /build/build.sh
```

## Distribution Details

### Ubuntu 22.04 LTS

- **Released**: April 2022
- **Support Until**: April 2027 (standard), April 2032 (ESM)
- **Base Size**: 77 MB
- **Package Manager**: apt/dpkg
- **Desktop**: GNOME 42

**Best For**: General-purpose servers and desktops

### Fedora 38

- **Released**: April 2023
- **Support Until**: May 2024
- **Base Size**: 230 MB
- **Package Manager**: dnf/RPM
- **Init**: systemd
- **Desktop**: GNOME 44

**Best For**: Latest packages, cutting-edge features

### Alpine Linux

- **Model**: Rolling release
- **Base Size**: 5 MB (minimal!)
- **Libc**: musl (not glibc)
- **Package Manager**: apk
- **Init**: OpenRC

**Best For**: Containers, embedded systems, minimal footprint

### Debian 11

- **Released**: August 2021
- **Support Until**: 2024-2026
- **Base Size**: 50 MB
- **Package Manager**: apt/dpkg

**Best For**: Stable, long-term support, servers

## Container Support

### Docker

```dockerfile
FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    libgtk-3-0 libnotify4 libnss3

COPY Codex-*.tar.gz /opt/
RUN cd /opt && tar xzf *.tar.gz

WORKDIR /opt/Codex-*/
ENTRYPOINT ["./Codex"]
```

### Podman

```bash
podman run --rm -it \
  -v ~/.codex:/home/user/.codex \
  localhost/codex:latest
```

## Device Support

| Device | OS | Architecture | Package |
|---|---|---|---|
| **Raspberry Pi 4+** | Ubuntu 22.04 | ARM64 | deb |
| **Raspberry Pi 3** | Raspberry Pi OS | ARMv7 | deb |
| **AWS Graviton** | Ubuntu/Fedora | ARM64 | deb/rpm |
| **Intel NUC** | Ubuntu | x86_64 | deb |
| **Apple Silicon** | Docker Desktop | ARM64 | tar |

## Contributing New Distributions

To add support for a new distribution:

1. **Update `.github/build-matrix.json`**:
   ```json
   {
     "name": "arch-linux",
     "label": "Arch Linux",
     "base_image": "archlinux:latest",
     "libc": "glibc",
     "pkg_manager": "pacman",
     "pkg_formats": ["tar"],
     "enabled": false
   }
   ```

2. **Update `.github/workflows/build-distro-matrix.yml`** with package manager commands

3. **Test locally**:
   ```bash
   docker run --rm -it archlinux:latest
   ```

4. **Open a PR** with the changes

---

**See**: [README.md](README.md) for overview, [CI_CD.md](CI_CD.md) for CI details
