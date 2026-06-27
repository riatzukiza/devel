#!/bin/bash
# Build script run inside Docker container
set -euo pipefail

echo "=========================================="
echo "  Codex Linux Fork - Docker Build"
echo "=========================================="

cd /build
mkdir -p codex-linux-fork/bin codex-linux-fork/resources release

# Step 1: Build Rust backend binary
echo ""
echo "[1/6] Building Rust backend binary (codex-app-server)..."
cd codex-oss/codex-rs
cargo build --release -p codex-app-server -vv
cd -
cp codex-oss/codex-rs/target/release/codex-app-server codex-linux-fork/bin/codex-app-server
bash /build/scripts/write-linux-codex-launcher.sh /build/codex-linux-fork/bin/codex codex-app-server
chmod +x codex-linux-fork/bin/codex
echo "✓ Rust binary built: $(du -h codex-linux-fork/bin/codex | cut -f1)"

# Step 2: Stage the extracted desktop shell
echo ""
echo "[2/6] Staging extracted desktop shell..."
bash /build/scripts/prepare-linux-fork.sh

# Step 3: Download ripgrep
echo ""
echo "[3/6] Downloading ripgrep..."
bash /build/scripts/install-linux-rg.sh /build/codex-linux-fork/resources
echo "✓ ripgrep downloaded"

# Step 4: Install Node dependencies
echo ""
echo "[4/6] Installing Node dependencies..."
cd codex-linux-fork
npm install
echo "✓ Dependencies installed"

# Step 5: Rebuild native modules
echo ""
echo "[5/6] Rebuilding native modules..."
npm run rebuild

# Step 6: Build packages
echo ""
echo "[6/6] Building packages..."
npm run build:linux

# Copy outputs
echo ""
echo "Copying outputs to /build/release..."
find dist -maxdepth 1 -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.tar.gz" \) -exec cp {} /build/release/ \;

if ! find /build/release -maxdepth 1 -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.tar.gz" \) | grep -q .; then
    echo "ERROR: no dist artifacts found"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="
echo ""
echo "Outputs:"
ls -lh /build/release
