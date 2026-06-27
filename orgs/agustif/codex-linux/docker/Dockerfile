# Build environment for Codex Linux Fork
# Based on Ubuntu 22.04 for maximum compatibility
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install build dependencies
RUN arch="$(dpkg --print-architecture)" \
    && if [ "$arch" = "arm64" ]; then \
        printf '%s\n' \
          'deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports jammy main restricted universe multiverse' \
          'deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports jammy-updates main restricted universe multiverse' \
          'deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports jammy-backports main restricted universe multiverse' \
          'deb [arch=arm64] http://ports.ubuntu.com/ubuntu-ports jammy-security main restricted universe multiverse' \
          'deb [arch=i386] http://archive.ubuntu.com/ubuntu jammy main restricted universe multiverse' \
          'deb [arch=i386] http://archive.ubuntu.com/ubuntu jammy-updates main restricted universe multiverse' \
          'deb [arch=i386] http://archive.ubuntu.com/ubuntu jammy-backports main restricted universe multiverse' \
          'deb [arch=i386] http://security.ubuntu.com/ubuntu jammy-security main restricted universe multiverse' \
          > /etc/apt/sources.list; \
    fi \
    && dpkg --add-architecture i386 \
    && apt-get update && apt-get install -y \
    # Build essentials
    build-essential \
    curl \
    wget \
    git \
    pkg-config \
    libssl-dev \
    libcap-dev \
    # Node.js dependencies
    ca-certificates \
    # Electron builder dependencies
    libsecret-1-dev \
    libgtk-3-0 \
    libnotify4 \
    libnss3 \
    libxss1 \
    libxtst6 \
    xdg-utils \
    libatspi2.0-0 \
    libuuid1 \
    libappindicator3-1 \
    libasound2 \
    xvfb \
    # For AppImage
    libfuse2 \
    file \
    # electron-builder bundles a 32-bit fpm helper for deb packaging
    libc6:i386 \
    libstdc++6:i386 \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Set up working directory
WORKDIR /build

# Copy project files
COPY app/ /build/app/
COPY codex-oss/ /build/codex-oss/
COPY codex-linux-fork/ /build/codex-linux-fork/
COPY scripts/ /build/scripts/

# Build script
COPY docker/build.sh /build/build.sh
RUN chmod +x /build/build.sh

# Output directory
VOLUME /output

CMD ["/build/build.sh"]
