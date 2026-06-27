#!/bin/bash

set -euo pipefail

DEST_DIR="${1:-}"
TARGET_ARCH="${2:-$(uname -m)}"

if [ -z "$DEST_DIR" ]; then
  echo "usage: $0 <dest-dir> [arch]" >&2
  exit 1
fi

mkdir -p "$DEST_DIR"

if [ -f "$DEST_DIR/rg" ]; then
  echo "ripgrep already present at $DEST_DIR/rg"
  exit 0
fi

case "$TARGET_ARCH" in
  x86_64|amd64)
    RG_VERSION="15.1.0"
    RG_ARCHIVE="ripgrep-${RG_VERSION}-x86_64-unknown-linux-musl"
    ;;
  aarch64|arm64)
    RG_VERSION="15.1.0"
    RG_ARCHIVE="ripgrep-${RG_VERSION}-aarch64-unknown-linux-gnu"
    ;;
  armv7l|armv7*)
    RG_VERSION="14.1.0"
    RG_ARCHIVE="ripgrep-${RG_VERSION}-armv7-unknown-linux-gnueabihf"
    ;;
  *)
    echo "ERROR: unsupported architecture for ripgrep bootstrap: $TARGET_ARCH" >&2
    exit 1
    ;;
esac

RG_URL="https://github.com/BurntSushi/ripgrep/releases/download/${RG_VERSION}/${RG_ARCHIVE}.tar.gz"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

curl -fsSL "$RG_URL" -o "$TMP_DIR/rg.tar.gz"
tar -xzf "$TMP_DIR/rg.tar.gz" -C "$TMP_DIR"

if [ ! -f "$TMP_DIR/$RG_ARCHIVE/rg" ]; then
  echo "ERROR: rg binary missing from archive $RG_URL" >&2
  exit 1
fi

cp "$TMP_DIR/$RG_ARCHIVE/rg" "$DEST_DIR/rg"
chmod +x "$DEST_DIR/rg"
echo "Installed ripgrep to $DEST_DIR/rg from $RG_URL"
