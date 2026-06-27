#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

if [ -f "$PWD/package.json" ] && [ -d "$PWD/resources" ]; then
    FORK_DIR="$PWD"
else
    FORK_DIR="$REPO_ROOT/codex-linux-fork"
fi

PACKAGE_JSON="$FORK_DIR/package.json"
if [ ! -f "$PACKAGE_JSON" ]; then
    echo "ERROR: missing package.json at $PACKAGE_JSON"
    exit 1
fi

ARCH="${TARGET_ARCH:-$(dpkg --print-architecture)}"
DIST_DIR="$FORK_DIR/dist"
BUILD_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/codex-deb.XXXXXX")"
PACKAGE_ROOT="$BUILD_ROOT/root"
trap 'rm -rf "$BUILD_ROOT"' EXIT

electron_arch="$ARCH"
case "$ARCH" in
    amd64)
        electron_arch="x64"
        ;;
esac

find_unpacked_dir() {
    local candidate
    for candidate in \
        "$DIST_DIR/linux-$ARCH-unpacked" \
        "$DIST_DIR/linux-$electron_arch-unpacked" \
        "$DIST_DIR/linux-unpacked"
    do
        if [ -d "$candidate" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done
    return 1
}

PACKAGE_NAME="$(node -p 'const pkg=require(process.argv[1]); pkg.name' "$PACKAGE_JSON")"
PRODUCT_NAME="$(node -p 'const pkg=require(process.argv[1]); pkg.productName' "$PACKAGE_JSON")"
VERSION="$(node -p 'const pkg=require(process.argv[1]); pkg.version' "$PACKAGE_JSON")"
HOMEPAGE="$(node -p 'const pkg=require(process.argv[1]); pkg.homepage' "$PACKAGE_JSON")"
MAINTAINER="$(node -p 'const pkg=require(process.argv[1]); pkg.build.linux.maintainer || pkg.author' "$PACKAGE_JSON")"
VENDOR="$(node -p 'const pkg=require(process.argv[1]); pkg.build.linux.vendor' "$PACKAGE_JSON")"
SYNOPSIS="$(node -p 'const pkg=require(process.argv[1]); pkg.build.linux.synopsis' "$PACKAGE_JSON")"
DESCRIPTION="$(node -p 'const pkg=require(process.argv[1]); pkg.build.linux.description || pkg.description' "$PACKAGE_JSON")"
DEPENDS="$(node -p 'const pkg=require(process.argv[1]); (pkg.build.deb.depends || []).join(", ")' "$PACKAGE_JSON")"

if ! UNPACKED_DIR="$(find_unpacked_dir)"; then
    echo "Unpacked Electron app missing for Debian packaging"
    echo "Generating unpacked output with electron-builder..."
    (
        cd "$FORK_DIR"
        npx electron-builder --linux dir
    )
    if ! UNPACKED_DIR="$(find_unpacked_dir)"; then
        echo "ERROR: electron-builder did not produce an unpacked Linux app"
        exit 1
    fi
fi

mkdir -p "$DIST_DIR"
rm -rf "$PACKAGE_ROOT"
mkdir -p \
    "$PACKAGE_ROOT/DEBIAN" \
    "$PACKAGE_ROOT/opt/$PRODUCT_NAME" \
    "$PACKAGE_ROOT/usr/share/applications"

cp -R "$UNPACKED_DIR"/. "$PACKAGE_ROOT/opt/$PRODUCT_NAME/"

ICON_SET_DIR="$DIST_DIR/.icon-set"
if [ -d "$ICON_SET_DIR" ]; then
    for size in 16 32 48 64 128; do
        icon_file="$ICON_SET_DIR/icon_${size}x${size}.png"
        if [ -f "$icon_file" ]; then
            install_dir="$PACKAGE_ROOT/usr/share/icons/hicolor/${size}x${size}/apps"
            mkdir -p "$install_dir"
            cp "$icon_file" "$install_dir/codex.png"
        fi
    done
fi

if [ -f "$FORK_DIR/resources/icons/icon.png" ]; then
    install_dir="$PACKAGE_ROOT/usr/share/icons/hicolor/256x256/apps"
    mkdir -p "$install_dir"
    cp "$FORK_DIR/resources/icons/icon.png" "$install_dir/codex.png"
fi

cat > "$PACKAGE_ROOT/usr/share/applications/codex.desktop" <<EOF
[Desktop Entry]
Name=$PRODUCT_NAME
Exec=/opt/$PRODUCT_NAME/codex %U
Terminal=false
Type=Application
Icon=codex
StartupWMClass=$PRODUCT_NAME
Comment=$DESCRIPTION
Categories=Development;
EOF

installed_size="$(du -sk "$PACKAGE_ROOT" | cut -f1)"

cat > "$PACKAGE_ROOT/DEBIAN/control" <<EOF
Package: $PACKAGE_NAME
Version: $VERSION
Section: devel
Priority: optional
Architecture: $ARCH
Maintainer: $MAINTAINER
Homepage: $HOMEPAGE
Installed-Size: $installed_size
Depends: $DEPENDS
Description: $SYNOPSIS
 $DESCRIPTION
EOF

cat > "$PACKAGE_ROOT/DEBIAN/postinst" <<EOF
#!/bin/bash
set -e

if type update-alternatives >/dev/null 2>&1; then
    if [ -L '/usr/bin/codex' ] && [ -e '/usr/bin/codex' ] && [ "\$(readlink '/usr/bin/codex')" != '/etc/alternatives/codex' ]; then
        rm -f '/usr/bin/codex'
    fi
    update-alternatives --install '/usr/bin/codex' 'codex' '/opt/$PRODUCT_NAME/codex' 100 || ln -sf '/opt/$PRODUCT_NAME/codex' '/usr/bin/codex'
else
    ln -sf '/opt/$PRODUCT_NAME/codex' '/usr/bin/codex'
fi

chmod 4755 '/opt/$PRODUCT_NAME/chrome-sandbox' || true

if hash update-mime-database 2>/dev/null; then
    update-mime-database /usr/share/mime || true
fi

if hash update-desktop-database 2>/dev/null; then
    update-desktop-database /usr/share/applications || true
fi
EOF

cat > "$PACKAGE_ROOT/DEBIAN/postrm" <<EOF
#!/bin/bash
set -e

if type update-alternatives >/dev/null 2>&1; then
    update-alternatives --remove 'codex' '/opt/$PRODUCT_NAME/codex' || true
else
    rm -f '/usr/bin/codex'
fi
EOF

chmod 0755 "$PACKAGE_ROOT/DEBIAN/postinst" "$PACKAGE_ROOT/DEBIAN/postrm"

OUTPUT_FILE="$DIST_DIR/${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"
LOCAL_OUTPUT="$BUILD_ROOT/${PACKAGE_NAME}_${VERSION}_${ARCH}.deb"
rm -f "$OUTPUT_FILE" "$LOCAL_OUTPUT"
dpkg-deb --build --root-owner-group "$PACKAGE_ROOT" "$LOCAL_OUTPUT" >/dev/null
cp "$LOCAL_OUTPUT" "$OUTPUT_FILE"

echo "Built Debian package: $OUTPUT_FILE"
