#!/bin/bash
# CI-specific build script that downloads Codex.app and builds Linux release
# Usage: ./scripts/ci-build.sh [VERSION]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION="${1:-latest}"
PREPARE_SCRIPT="$REPO_ROOT/scripts/prepare-linux-fork.sh"

echo "=========================================="
echo "  Codex Linux CI Build"
echo "=========================================="
echo "Version: $VERSION"
echo "Repo: $REPO_ROOT"

# Step 1: Download Codex.app
echo ""
echo "[1/3] Downloading Codex.app from official sources..."

CODEX_DMG="$REPO_ROOT/Codex.dmg"
CODEX_EXTRACT="$REPO_ROOT/extracted"
CODEX_APP_DIR="$REPO_ROOT/app"

if [ "$VERSION" = "latest" ]; then
  echo "Fetching latest version..."
  RELEASE_JSON=$(curl -s https://api.github.com/repos/openai/codex/releases/latest)
  VERSION=$(echo "$RELEASE_JSON" | grep -o '"tag_name": "[^"]*' | head -1 | cut -d'"' -f4 | sed 's/v//' || echo "0.1.0")
fi

echo "Target version: $VERSION"

# Try multiple sources for Codex.app DMG
# Official source: https://persistent.oaistatic.com/codex-app-prod/Codex.dmg
SOURCES=(
  "https://persistent.oaistatic.com/codex-app-prod/Codex.dmg"
  "https://storage.googleapis.com/codex-releases/Codex-${VERSION}.dmg"
  "https://codex-releases.s3.amazonaws.com/Codex-${VERSION}.dmg"
)

DOWNLOADED=0
for URL in "${SOURCES[@]}"; do
  echo "Trying: $URL"
  if curl -L -f --progress-bar "$URL" -o "$CODEX_DMG" 2>/dev/null; then
    echo "✓ Downloaded: $(du -h "$CODEX_DMG" | cut -f1)"
    DOWNLOADED=1
    break
  fi
done

if [ $DOWNLOADED -ne 1 ]; then
  echo "⨯ Failed to download Codex.app from any source"
  echo ""
  echo "Manual fallback: Download Codex-${VERSION}.dmg from:"
  echo "  https://codex.openai.com/releases"
  echo ""
  echo "Then run: make build"
  exit 1
fi

# Step 2: Extract Codex.app
echo ""
echo "[2/3] Extracting Codex.app..."

mkdir -p "$CODEX_EXTRACT" "$CODEX_APP_DIR"

# Try extraction with available tools
if command -v 7z &> /dev/null; then
  echo "Using 7zip for extraction..."
  7z x "$CODEX_DMG" -o"$CODEX_EXTRACT/" > /dev/null || true
elif command -v xar &> /dev/null; then
  echo "Using xar for extraction..."
  xar -x -f "$CODEX_DMG" -C "$CODEX_EXTRACT/"
else
  echo "⚠ No extraction tool found (install 7zip or xar)"
  echo "Skipping extraction - using existing app/ directory if available"
fi

# Extract webview and assets from app.asar if possible
if [ -f "$CODEX_EXTRACT/app.asar" ] || find "$CODEX_EXTRACT" -name "app.asar" 2>/dev/null | grep -q .; then
  echo "Found app.asar, attempting to extract webview..."
  
  # Use npx asar to extract if available
  if command -v npx &> /dev/null; then
    ASAR_FILE=$(find "$CODEX_EXTRACT" -name "app.asar" -print -quit)
    if [ -n "$ASAR_FILE" ]; then
      echo "Extracting: $ASAR_FILE"
      npx asar extract "$ASAR_FILE" "$CODEX_APP_DIR/" 2>/dev/null || true
    fi
  fi
fi

# Copy any found assets
echo "Copying webview and assets..."
find "$CODEX_EXTRACT" -type f \( -name "*.png" -o -name "*.svg" -o -name "*.ico" \) \
  2>/dev/null | while read -r FILE; do
    DIR=$(dirname "$FILE" | sed "s|$CODEX_EXTRACT|$CODEX_APP_DIR|")
    mkdir -p "$DIR"
    cp "$FILE" "$DIR/" 2>/dev/null || true
  done

echo "✓ Extraction complete"
ls -lh "$CODEX_APP_DIR/" 2>/dev/null | head -20 || echo "(minimal extraction)"

# Step 3: Build Linux release
echo ""
echo "[3/3] Building Linux release..."
cd "$REPO_ROOT"

bash "$PREPARE_SCRIPT"

# Clean previous builds
make clean

# Run full build
make build

# Step 4: Verify artifacts
echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="

RELEASE_DIR="$REPO_ROOT/release"
if find "$RELEASE_DIR" -maxdepth 1 -type f \( -name "*.deb" -o -name "*.AppImage" -o -name "*.tar.gz" \) | grep -q .; then
  echo ""
  echo "Artifacts:"
  for f in "$RELEASE_DIR"/*; do
    if [ -f "$f" ]; then
      case "$(basename "$f")" in
        *AppImage*|*.deb|*.tar.gz)
          ls -lh "$f"
          ;;
      esac
    fi
  done
  
  # Cleanup DMG
  rm -f "$CODEX_DMG"
  
  echo ""
  echo "✓ Build successful!"
  echo ""
  echo "Next steps:"
  echo "  - Test with: ./release/Codex-*.AppImage"
  echo "  - Or install: sudo dpkg -i ./release/*.deb"
  echo "  - Or extract: tar xzf ./release/*.tar.gz"
else
  echo "⨯ No artifacts found in $RELEASE_DIR"
  exit 1
fi
