#!/bin/bash
# Build the Linux package set against the extracted desktop shell.

set -euo pipefail

FORK_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$FORK_DIR")"
PREPARE_SCRIPT="$REPO_ROOT/scripts/prepare-linux-fork.sh"
RG_INSTALL_SCRIPT="$REPO_ROOT/scripts/install-linux-rg.sh"
LAUNCHER_SCRIPT="$REPO_ROOT/scripts/write-linux-codex-launcher.sh"
RELEASE_DIR="$REPO_ROOT/release"
cd "$FORK_DIR"

echo "=== Codex Linux Fork Build Script ==="

if [ ! -f "$PREPARE_SCRIPT" ]; then
    echo "ERROR: missing prepare script at $PREPARE_SCRIPT"
    exit 1
fi

if [ ! -f "$RG_INSTALL_SCRIPT" ]; then
    echo "ERROR: missing ripgrep installer at $RG_INSTALL_SCRIPT"
    exit 1
fi

if [ ! -f "$LAUNCHER_SCRIPT" ]; then
    echo "ERROR: missing launcher writer at $LAUNCHER_SCRIPT"
    exit 1
fi

# Check if we're on Linux for native builds
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Building on Linux - native compilation"
    NATIVE_BUILD=true
else
    echo "Building on non-Linux OS - cross-compilation required"
    NATIVE_BUILD=false
fi

# Step 1: Build Rust backend from OSS
echo ""
echo "Step 1: Building Rust binary..."
OSS_PATH="../codex-oss/codex-rs"
mkdir -p "$FORK_DIR/bin" "$FORK_DIR/resources" "$RELEASE_DIR"

if [[ "$NATIVE_BUILD" == true ]]; then
    echo "  Building natively for Linux..."
    cd "$OSS_PATH"
    cargo build --release -p codex-app-server
    cp target/release/codex-app-server "$FORK_DIR/bin/codex-app-server"
else
    echo "  Cross-compilation setup required."
    echo "  Run this on a Linux machine or use cross-rs:"
    echo "    cargo install cross"
    echo "    cross build --release -p codex-app-server --target x86_64-unknown-linux-gnu"
    echo ""
    echo "  Or download pre-built binary if available."

    if [ ! -x "$FORK_DIR/bin/codex-app-server" ]; then
        echo "ERROR: missing Linux backend at $FORK_DIR/bin/codex-app-server"
        echo "Build it on Linux first or use the Docker-based build."
        exit 1
    fi
fi

bash "$LAUNCHER_SCRIPT" "$FORK_DIR/bin/codex" "codex-app-server"

cd "$FORK_DIR"

# Step 2: Stage the extracted desktop shell
echo ""
echo "Step 2: Staging extracted desktop shell..."
bash "$PREPARE_SCRIPT"

# Step 3: Download ripgrep for Linux
echo ""
echo "Step 3: Downloading ripgrep..."
bash "$RG_INSTALL_SCRIPT" "$FORK_DIR/resources"

# Step 4: Install Node dependencies
echo ""
echo "Step 4: Installing Node dependencies..."
npm install

# Step 5: Rebuild native modules for Linux
if [[ "$NATIVE_BUILD" == true ]]; then
    echo ""
    echo "Step 5: Rebuilding native modules for Linux..."
    npm run rebuild
else
    echo ""
    echo "Step 5: Native modules need to be rebuilt on Linux target."
    echo "  Run 'npm run rebuild' on the target Linux machine."
fi

# Step 6: Build the Electron app
echo ""
echo "Step 6: Building packages..."
npm run build:linux

find dist -maxdepth 1 -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.tar.gz" \) -exec cp {} "$RELEASE_DIR"/ \;

if ! find "$RELEASE_DIR" -maxdepth 1 -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.tar.gz" \) | grep -q .; then
    echo "ERROR: no release artifacts were produced"
    exit 1
fi

echo "Artifacts copied to $RELEASE_DIR"
