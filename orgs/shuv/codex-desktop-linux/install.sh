#!/bin/bash
set -Eeuo pipefail

# ============================================================================
# Codex Desktop for Linux — Installer
# Converts the official macOS Codex Desktop app to run on Linux
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="${CODEX_INSTALL_DIR:-$SCRIPT_DIR/codex-app}"
ELECTRON_VERSION="40.0.0"
# Beta channel uses ZIP format; prod uses DMG
BETA_ZIP_URL="https://persistent.oaistatic.com/codex-app-beta/Codex%20(Beta)-darwin-arm64-26.311.30926.zip"
DMG_URL="https://persistent.oaistatic.com/codex-app-prod/Codex.dmg"
# Default to beta channel
APP_URL="${CODEX_APP_URL:-$BETA_ZIP_URL}"
WORK_DIR="$(mktemp -d)"
ARCH="$(uname -m)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*" >&2; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT
trap 'error "Failed at line $LINENO (exit code $?)"' ERR

# ---- Check dependencies ----
check_deps() {
    local missing=()
    for cmd in node npm npx python3 7z curl unzip; do
        command -v "$cmd" &>/dev/null || missing+=("$cmd")
    done
    if [ ${#missing[@]} -ne 0 ]; then
        error "Missing dependencies: ${missing[*]}
Install them first:
  sudo apt install nodejs npm python3 p7zip-full curl unzip build-essential  # Debian/Ubuntu
  sudo dnf install nodejs npm python3 p7zip curl unzip && sudo dnf groupinstall 'Development Tools'  # Fedora
  sudo pacman -S nodejs npm python p7zip curl unzip base-devel  # Arch"
    fi

    NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d v)
    if [ "$NODE_MAJOR" -lt 20 ]; then
        error "Node.js 20+ required (found $(node -v))"
    fi

    if ! command -v make &>/dev/null || ! command -v g++ &>/dev/null; then
        error "Build tools (make, g++) required:
  sudo apt install build-essential   # Debian/Ubuntu
  sudo dnf groupinstall 'Development Tools'  # Fedora
  sudo pacman -S base-devel          # Arch"
    fi

    info "All dependencies found"
}

# ---- Download or find Codex DMG ----
get_cached_dmg_metadata() {
    local dmg_path="$1"
    if [ ! -s "$dmg_path" ]; then
        return 1
    fi

    python3 - "$dmg_path" <<'PY'
import hashlib
import pathlib
import plistlib
import shutil
import subprocess
import sys
import tempfile


def emit_error(message: str) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(1)


def md5_file(path: pathlib.Path) -> str:
    digest = hashlib.md5()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


dmg_path = pathlib.Path(sys.argv[1]).resolve()
size = dmg_path.stat().st_size
md5 = md5_file(dmg_path)
work_dir = pathlib.Path(tempfile.mkdtemp(prefix="codex-dmg-meta-"))
try:
    cmd = ["7z", "x", "-y", str(dmg_path), f"-o{work_dir}"]
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if result.returncode != 0:
        emit_error("failed to extract cached DMG metadata")

    apps = list(work_dir.glob("**/*.app"))
    if not apps:
        emit_error("cached DMG does not contain a .app bundle")

    info_plist = apps[0] / "Contents" / "Info.plist"
    if not info_plist.is_file():
        emit_error("cached DMG Info.plist not found")

    with info_plist.open("rb") as fh:
        info = plistlib.load(fh)

    print(f"size={size}")
    print(f"md5={md5}")
    print(f"bundle_version={info.get('CFBundleShortVersionString', '')}")
    print(f"bundle_build={info.get('CFBundleVersion', '')}")
finally:
    shutil.rmtree(work_dir, ignore_errors=True)
PY
}

fetch_remote_dmg_metadata() {
    local headers
    local content_length=""
    local content_md5=""
    local last_modified=""
    local etag=""

    headers=$(curl -fsSLI --connect-timeout 30 --max-time 60 "$DMG_URL" | tr -d '\r') || return 1
    content_length=$(printf '%s\n' "$headers" | awk 'tolower($1)=="content-length:" {print $2; exit}')
    content_md5=$(printf '%s\n' "$headers" | awk 'tolower($1)=="content-md5:" {print $2; exit}')
    last_modified=$(printf '%s\n' "$headers" | sed -n 's/^[Ll]ast-[Mm]odified: //p' | head -1)
    etag=$(printf '%s\n' "$headers" | sed -n 's/^[Ee][Tt]ag: //p' | head -1)

    python3 - "$content_length" "$content_md5" "$last_modified" "$etag" <<'PY'
import base64
import sys

content_length, content_md5, last_modified, etag = sys.argv[1:5]
md5_hex = base64.b64decode(content_md5).hex() if content_md5 else ""

print(f"size={content_length}")
print(f"md5={md5_hex}")
print(f"last_modified={last_modified}")
print(f"etag={etag}")
PY
}

parse_metadata_field() {
    local metadata="$1"
    local key="$2"
    printf '%s\n' "$metadata" | awk -F= -v key="$key" '$1==key { sub(/^[^=]*=/, ""); print; exit }'
}

get_dmg() {
    local dmg_dest="$SCRIPT_DIR/Codex.dmg"
    local remote_meta=""
    local remote_size=""
    local remote_md5=""
    local remote_last_modified=""
    local remote_etag=""
    local cached_meta=""
    local cached_size=""
    local cached_md5=""
    local cached_bundle_version=""
    local cached_bundle_build=""

    info "Checking Codex Desktop DMG metadata..."
    if remote_meta=$(fetch_remote_dmg_metadata); then
        remote_size=$(parse_metadata_field "$remote_meta" "size")
        remote_md5=$(parse_metadata_field "$remote_meta" "md5")
        remote_last_modified=$(parse_metadata_field "$remote_meta" "last_modified")
        remote_etag=$(parse_metadata_field "$remote_meta" "etag")
        info "Remote DMG: size=${remote_size:-unknown}, md5=${remote_md5:-unknown}, last-modified=${remote_last_modified:-unknown}, etag=${remote_etag:-unknown}"
    else
        warn "Could not fetch remote DMG metadata; falling back to cached file if available"
    fi

    if [ -s "$dmg_dest" ]; then
        info "Inspecting cached DMG: $dmg_dest"
        if cached_meta=$(get_cached_dmg_metadata "$dmg_dest"); then
            cached_size=$(parse_metadata_field "$cached_meta" "size")
            cached_md5=$(parse_metadata_field "$cached_meta" "md5")
            cached_bundle_version=$(parse_metadata_field "$cached_meta" "bundle_version")
            cached_bundle_build=$(parse_metadata_field "$cached_meta" "bundle_build")
            info "Cached DMG: size=${cached_size:-unknown}, md5=${cached_md5:-unknown}, app version=${cached_bundle_version:-unknown} (build ${cached_bundle_build:-unknown})"
            if [ -n "$remote_md5" ] && [ "$cached_md5" = "$remote_md5" ]; then
                info "Cached DMG matches remote metadata ($(du -h "$dmg_dest" | cut -f1))"
                echo "$dmg_dest"
                return
            fi
            if [ -z "$remote_md5" ]; then
                warn "Remote MD5 unavailable; reusing cached DMG without freshness validation"
                echo "$dmg_dest"
                return
            fi
            warn "Cached DMG is outdated or unverified; downloading latest copy"
        else
            warn "Could not inspect cached DMG; downloading fresh copy"
        fi
    fi

    info "Downloading latest Codex Desktop DMG..."
    info "URL: $DMG_URL"

    if ! curl -L --progress-bar --max-time 600 --connect-timeout 30 \
            -o "$dmg_dest" "$DMG_URL"; then
        rm -f "$dmg_dest"
        error "Download failed. Download manually and place as: $dmg_dest"
    fi

    if [ ! -s "$dmg_dest" ]; then
        rm -f "$dmg_dest"
        error "Download produced empty file. Download manually and place as: $dmg_dest"
    fi

    if [ -n "$remote_md5" ]; then
        local downloaded_md5
        downloaded_md5=$(python3 - "$dmg_dest" <<'PY'
import hashlib
import pathlib
import sys
print(hashlib.md5(pathlib.Path(sys.argv[1]).read_bytes()).hexdigest())
PY
)
        if [ "$downloaded_md5" != "$remote_md5" ]; then
            rm -f "$dmg_dest"
            error "Downloaded DMG failed MD5 validation (expected $remote_md5, got $downloaded_md5)"
        fi
    fi

    info "Saved: $dmg_dest ($(du -h "$dmg_dest" | cut -f1))"
    echo "$dmg_dest"
}

# ---- Extract app from DMG ----
extract_dmg() {
    local dmg_path="$1"
    info "Extracting DMG with 7z..."

    7z x -y "$dmg_path" -o"$WORK_DIR/dmg-extract" >&2 || \
        error "Failed to extract DMG"

    local app_dir
    app_dir=$(find "$WORK_DIR/dmg-extract" -maxdepth 3 -name "*.app" -type d | head -1)
    [ -n "$app_dir" ] || error "Could not find .app bundle in DMG"

    info "Found: $(basename "$app_dir")"
    echo "$app_dir"
}

# ---- Extract app from ZIP (beta channel) ----
extract_zip() {
    local zip_path="$1"
    info "Extracting ZIP..."

    unzip -q "$zip_path" -d "$WORK_DIR/zip-extract" || \
        error "Failed to extract ZIP"

    local app_dir
    app_dir=$(find "$WORK_DIR/zip-extract" -maxdepth 2 -name "*.app" -type d | head -1)
    [ -n "$app_dir" ] || error "Could not find .app bundle in ZIP"

    info "Found: $(basename "$app_dir")"
    echo "$app_dir"
}

# ---- Download beta ZIP ----
get_zip() {
    local zip_dest="$SCRIPT_DIR/Codex-Beta.zip"

    info "Downloading Codex Desktop Beta ZIP..."
    info "URL: $APP_URL"

    if ! curl -L --progress-bar --max-time 600 --connect-timeout 30 \
            -o "$zip_dest" "$APP_URL"; then
        rm -f "$zip_dest"
        error "Download failed. Download manually and place as: $zip_dest"
    fi

    if [ ! -s "$zip_dest" ]; then
        rm -f "$zip_dest"
        error "Download produced empty file. Download manually and place as: $zip_dest"
    fi

    info "Saved: $zip_dest ($(du -h "$zip_dest" | cut -f1))"
    echo "$zip_dest"
}

# ---- Extract app from archive (auto-detect format) ----
extract_app() {
    local archive_path="$1"
    
    case "$archive_path" in
        *.zip)
            extract_zip "$archive_path"
            ;;
        *.dmg)
            extract_dmg "$archive_path"
            ;;
        *.app)
            # Already an app directory
            info "Using .app bundle directly: $(basename "$archive_path")"
            echo "$archive_path"
            ;;
        *)
            # Try DMG extraction as fallback
            extract_dmg "$archive_path"
            ;;
    esac
}

# ---- Build native modules in a clean directory ----
build_native_modules() {
    local app_extracted="$1"

    # Read versions from extracted app
    local bs3_ver npty_ver
    bs3_ver=$(node -p "require('$app_extracted/node_modules/better-sqlite3/package.json').version" 2>/dev/null || echo "")
    npty_ver=$(node -p "require('$app_extracted/node_modules/node-pty/package.json').version" 2>/dev/null || echo "")

    [ -n "$bs3_ver" ] || error "Could not detect better-sqlite3 version"
    [ -n "$npty_ver" ] || error "Could not detect node-pty version"

    info "Native modules: better-sqlite3@$bs3_ver, node-pty@$npty_ver"

    # Build in a CLEAN directory (asar doesn't have full source)
    local build_dir="$WORK_DIR/native-build"
    mkdir -p "$build_dir"
    cd "$build_dir"

    echo '{"private":true}' > package.json

    info "Installing fresh sources from npm..."
    npm install "electron@$ELECTRON_VERSION" --save-dev --ignore-scripts 2>&1 >&2
    npm install "better-sqlite3@$bs3_ver" "node-pty@$npty_ver" --ignore-scripts 2>&1 >&2

    info "Compiling for Electron v$ELECTRON_VERSION (this takes ~1 min)..."
    npx --yes @electron/rebuild -v "$ELECTRON_VERSION" --force 2>&1 >&2

    info "Native modules built successfully"

    # Copy compiled modules back into extracted app
    rm -rf "$app_extracted/node_modules/better-sqlite3"
    rm -rf "$app_extracted/node_modules/node-pty"
    cp -r "$build_dir/node_modules/better-sqlite3" "$app_extracted/node_modules/"
    cp -r "$build_dir/node_modules/node-pty" "$app_extracted/node_modules/"
}

# ---- Patch zoom shortcuts for Linux keyboard layouts ----
patch_zoom_shortcuts() {
    local extracted_root="$1"
    local main_bundle
    main_bundle=$(find "$extracted_root/.vite/build" -maxdepth 1 -type f -name "main-*.js" | head -1)

    if [ -z "${main_bundle:-}" ] || [ ! -f "$main_bundle" ]; then
        warn "Could not locate main bundle for zoom shortcut patch"
        return
    fi

    if python3 - "$main_bundle" <<'PY'
from pathlib import Path
import re
import sys

p = Path(sys.argv[1])
s = p.read_text(errors='ignore')

# Try multiple anchor patterns for different app versions
# Beta (26.311.x): this.installWebContentsDiagnostics(S),this.registerWindow(S,l,h,o);
# Prod (26.309.x): this.installWebContentsDiagnostics(v),this.registerWindow(v,c,p);
anchor_patterns = [
    r'this\.installWebContentsDiagnostics\((\w)\),this\.registerWindow\(\1,(\w),(\w),(\w)\);',
    r'this\.installWebContentsDiagnostics\((\w)\),this\.registerWindow\(\1,(\w),(\w)\);',
]

anchor_match = None
for pattern in anchor_patterns:
    m = re.search(pattern, s)
    if m:
        anchor_match = m
        break

if not anchor_match:
    raise SystemExit('zoom shortcut patch anchor not found')

# Use the matched variable names
v = anchor_match.group(1)
anchor = anchor_match.group(0)

inject = (
    f'{v}.webContents.on("before-input-event",(C,L)=>{{const j=process.platform==="darwin"?L.meta:L.control;if(!j||L.alt)return;'
    f'const N=(L.key??"").toLowerCase(),H=(L.code??"").toLowerCase(),O=()=>{{try{{return {v}.webContents.getZoomLevel()}}catch{{return 0}}}},M=Q=>{{try{{{v}.webContents.setZoomLevel(Q)}}catch{{}}}};'
    'if(N==="+"||N==="="||N==="add"||H==="numpadadd"){C.preventDefault(),M(O()+1);return}'
    'if(N==="-"||N==="_"||N==="subtract"||H==="numpadsubtract"){C.preventDefault(),M(O()-1);return}'
    '(N==="0"||H==="digit0"||H==="numpad0")&&(C.preventDefault(),M(0))}),'
)

if inject in s:
    print('zoom shortcut patch already applied')
    raise SystemExit(0)

s = s.replace(anchor, inject + anchor, 1)
p.write_text(s)
print('zoom shortcut patch applied')
PY
    then
        info "Zoom shortcut patch applied"
    else
        warn "Zoom shortcut patch could not be applied (continuing)"
    fi
}

# ---- Patch Open In targets for Linux ----
patch_open_in_targets_linux() {
    local extracted_root="$1"
    local main_bundle
    main_bundle=$(find "$extracted_root/.vite/build" -maxdepth 1 -type f -name "main-*.js" | head -1)

    if [ -z "${main_bundle:-}" ] || [ ! -f "$main_bundle" ]; then
        warn "Could not locate main bundle for Open In patch"
        return
    fi

    if python3 - "$main_bundle" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
s = p.read_text(errors='ignore')

# Beta app (26.311+) already has Linux platform support built-in
# Check for the platform definition pattern: linux:s?Ci(
if 'linux:s?Ci(' in s or 'linux:n?Ci(' in s or ',linux:' in s:
    print('open-in linux support already built-in')
    raise SystemExit(0)

# For older versions, apply the patch
start = s.find('let mh=null;const kue=Wp.map')
if start == -1:
    raise SystemExit('open-in patch start anchor not found (may not be needed for this version)')
end = s.find('function Rr(', start)
if end == -1:
    raise SystemExit('open-in patch end anchor not found')

if 'const WpLinux=[' in s[start:end + 4000]:
    print('open-in linux patch already applied')
    raise SystemExit(0)

new_block = '''let mh=null;const WpLinux=[{id:"vscode",label:"VS Code",icon:"apps/vscode.png",detect:()=>Hp("code"),args:(t,e)=>qa(t,e)},{id:"vscodeInsiders",label:"VS Code Insiders",icon:"apps/vscode-insiders.png",detect:()=>Hp("code-insiders"),args:(t,e)=>qa(t,e)},{id:"cursor",label:"Cursor",icon:"apps/cursor.png",detect:()=>Hp("cursor"),args:(t,e)=>qa(t,e)},{id:"windsurf",label:"Windsurf",icon:"apps/windsurf.png",detect:()=>Hp("windsurf"),args:(t,e)=>qa(t,e)},{id:"zed",label:"Zed",icon:"apps/zed.png",detect:()=>Hp("zed"),args:(t,e)=>O_(t,e)},{id:"fileManager",label:"File Manager",icon:"apps/finder.png",detect:()=>Hp("xdg-open"),args:t=>[$u(t)]}];function WOL(){return gr?Wp:process.platform==="linux"?WpLinux:[]}const kue=WOL().map(({id:t,label:e,icon:n})=>({id:t,label:e,icon:n}));async function LO(){const t=WOL();if(t.length===0)return[];if(mh)return mh;const e=[];for(const n of t)try{n.detect()&&e.push(n.id)}catch(r){kr().error("Failed to detect open target",{safe:{},sensitive:{id:n.id,error:r}})}return mh=e,e}function eb(t){const e=t.get(Ne.OPEN_IN_TARGET_PREFERENCES)??{},n=UO(e.global)??void 0,r=Object.fromEntries(Object.entries(e.perPath??{}).flatMap(([i,s])=>{const o=UO(s);return o?[[i,o]]:[]}));return{global:n,perPath:Object.keys(r).length>0?r:void 0}}function UO(t){const e=WOL();return t==="finder"?"fileManager":typeof t!="string"?null:e.some(n=>n.id===t)?t:null}function FO(t,e,n){const r=eb(t),i=(e&&r.perPath?.[e])??r.global??null;return i&&n.has(i)?i:n.values().next().value??null}function Pue(t,e){const n=eb(t);return!!((e&&n.perPath?.[e])??n.global??null)}function $O(t,e,n){const r=eb(t);r.global=n,e&&(r.perPath=r.perPath??{},r.perPath[e]=n),t.set(Ne.OPEN_IN_TARGET_PREFERENCES,r)}async function Mue(t,e,n){const r=WOL().find(a=>a.id===t);if(!r)throw new Error(`Unknown open target "${t}"`);const i=r.detect();if(!i)throw new Error(`Open target "${t}" is not available`);if(gr){if(!(xue(t)&&await Nue(t,e))){if(t==="xcode"){await Tue(e,n);return}if(t==="zed"){await Uue(i,e,n);return}await Rr(i,r.args(e,n),{env:r.env?.()})}return}if(process.platform==="linux"){await Rr(i,r.args(e,n),{env:r.env?.()});return}throw new Error("Opening external editors is only supported on macOS and Linux")}'''

s = s[:start] + new_block + s[end:]
p.write_text(s)
print('open-in linux patch applied')
PY
    then
        info "Open In Linux patch applied"
    else
        warn "Open In Linux patch could not be applied (continuing)"
    fi
}

# ---- Patch local websocket app-server transport to avoid forced SOCKS proxy ----
patch_local_websocket_app_server() {
    local extracted_root="$1"
    local main_bundle
    main_bundle=$(find "$extracted_root/.vite/build" -maxdepth 1 -type f -name "main-*.js" | head -1)

    if [ -z "${main_bundle:-}" ] || [ ! -f "$main_bundle" ]; then
        warn "Could not locate main bundle for websocket transport patch"
        return
    fi

    if python3 - "$main_bundle" <<'PY'
from pathlib import Path
import sys

p = Path(sys.argv[1])
s = p.read_text(errors='ignore')

helper = 'function __codexDesktopWsTransportOptions('
if helper in s:
    print('websocket transport patch already applied')
    raise SystemExit(0)

old = 'async connect(){const e=await Fv(this.options.hostConfig),t=new a.WebSocket(this.options.websocketUrl,{headers:e,agent:new a.distExports.SocksProxyAgent("socks5h://127.0.0.1:1080"),perMessageDeflate:!1});return new Yu(t)}}function Cv(r){'
new = 'async connect(){const e=await Fv(this.options.hostConfig),t=new a.WebSocket(this.options.websocketUrl,{headers:e,...__codexDesktopWsTransportOptions(this.options.websocketUrl),perMessageDeflate:!1});return new Yu(t)}}function __codexDesktopWsTransportOptions(r){const e=process.env.CODEX_APP_SERVER_WS_SOCKS_PROXY,t=e===void 0?"socks5h://127.0.0.1:1080":e;if(!t)return{};try{const e=new URL(r),i=(e.hostname??"").toLowerCase(),n=i==="0.0.0.0"||i==="localhost"||i==="127.0.0.1"||i==="::1"||i.startsWith("10.")||i.startsWith("192.168.")||/^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(i);return n?{}:{agent:new a.distExports.SocksProxyAgent(t)}}catch{return{agent:new a.distExports.SocksProxyAgent(t)}}}function Cv(r){'

if old not in s:
    raise SystemExit('websocket transport patch anchor not found')

s = s.replace(old, new, 1)
p.write_text(s)
print('websocket transport patch applied')
PY
    then
        info "Websocket transport patch applied"
    else
        warn "Websocket transport patch could not be applied (continuing)"
    fi
}

# ---- Extract and patch app.asar ----
patch_asar() {
    local app_dir="$1"
    local resources_dir="$app_dir/Contents/Resources"

    [ -f "$resources_dir/app.asar" ] || error "app.asar not found in $resources_dir"

    info "Extracting app.asar..."
    cd "$WORK_DIR"
    npx --yes asar extract "$resources_dir/app.asar" app-extracted

    # Copy unpacked native modules if they exist
    if [ -d "$resources_dir/app.asar.unpacked" ]; then
        cp -r "$resources_dir/app.asar.unpacked/"* app-extracted/ 2>/dev/null || true
    fi

    # Remove macOS-only modules
    rm -rf "$WORK_DIR/app-extracted/node_modules/sparkle-darwin" 2>/dev/null || true
    find "$WORK_DIR/app-extracted" -name "sparkle.node" -delete 2>/dev/null || true

    # Fix zoom shortcuts (Ctrl +/-/0) across Linux keyboard layouts.
    patch_zoom_shortcuts "$WORK_DIR/app-extracted"

    # Enable Open In targets on Linux (VS Code, Cursor, Windsurf, etc.).
    patch_open_in_targets_linux "$WORK_DIR/app-extracted"

    # Allow local/private websocket app-server listeners without forced SOCKS proxy.
    patch_local_websocket_app_server "$WORK_DIR/app-extracted"

    # Build native modules in clean environment and copy back
    build_native_modules "$WORK_DIR/app-extracted"

    # Repack
    info "Repacking app.asar..."
    cd "$WORK_DIR"
    npx asar pack app-extracted app.asar --unpack "{*.node,*.so,*.dylib}" 2>/dev/null

    info "app.asar patched"
}

# ---- Download Linux Electron ----
download_electron() {
    info "Downloading Electron v${ELECTRON_VERSION} for Linux..."

    local electron_arch
    case "$ARCH" in
        x86_64)  electron_arch="x64" ;;
        aarch64) electron_arch="arm64" ;;
        armv7l)  electron_arch="armv7l" ;;
        *)       error "Unsupported architecture: $ARCH" ;;
    esac

    local url="https://github.com/electron/electron/releases/download/v${ELECTRON_VERSION}/electron-v${ELECTRON_VERSION}-linux-${electron_arch}.zip"

    curl -L --progress-bar -o "$WORK_DIR/electron.zip" "$url"
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    unzip -qo "$WORK_DIR/electron.zip"

    info "Electron ready"
}

# ---- Extract webview files ----
extract_webview() {
    local app_dir="$1"
    mkdir -p "$INSTALL_DIR/content/webview"

    # Webview files are inside the extracted asar at webview/
    local asar_extracted="$WORK_DIR/app-extracted"
    if [ -d "$asar_extracted/webview" ]; then
        cp -r "$asar_extracted/webview/"* "$INSTALL_DIR/content/webview/"
        info "Webview files copied"
    else
        warn "Webview directory not found in asar — app may not work"
    fi
}

# ---- Install app.asar ----
install_app() {
    cp "$WORK_DIR/app.asar" "$INSTALL_DIR/resources/"
    if [ -d "$WORK_DIR/app.asar.unpacked" ]; then
        cp -r "$WORK_DIR/app.asar.unpacked" "$INSTALL_DIR/resources/"
    fi
    info "app.asar installed"
}

# ---- Create start script ----
create_start_script() {
    cat > "$INSTALL_DIR/start.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEBVIEW_DIR="$SCRIPT_DIR/content/webview"
PORT=5175
CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/codex-desktop-linux"
MODE_FILE="${CODEX_MODE_FILE:-$CONFIG_DIR/login-mode}"
PROFILE_ROOT="${CODEX_PROFILE_ROOT:-$CONFIG_DIR/profiles}"
DEFAULT_AUTH_MODE="${CODEX_DEFAULT_AUTH_MODE:-api}"
APP_SERVER_STATE_DIR="${CODEX_APP_SERVER_STATE_DIR:-$CONFIG_DIR/app-server}"

mkdir -p "$CONFIG_DIR" "$PROFILE_ROOT" "$APP_SERVER_STATE_DIR"

print_usage() {
    cat <<'EOF'
Usage:
  ./start.sh [oauth|api] [electron args...]
  ./start.sh --auth-mode oauth|api [electron args...]
  ./start.sh use oauth|api
  ./start.sh toggle
  ./start.sh status

Examples:
  ./start.sh oauth
  ./start.sh api
  ./start.sh use oauth
  ./start.sh --auth-mode api --disable-gpu

Environment overrides:
  CODEX_AUTH_MODE=oauth|api
  CODEX_PROXY_BASE_URL=http://127.0.0.1:8789/v1
  CODEX_PROXY_TOKEN=...
  CODEX_PROXY_ENV_FILE=/path/to/proxy.env
  CODEX_USER_DATA_DIR=/custom/profile/path
  CODEX_APP_SERVER_FORCE_CLI=1
  CODEX_APP_SERVER_LISTEN_URL=ws://0.0.0.0:9234
  CODEX_APP_SERVER_WS_URL=ws://0.0.0.0:9234
  CODEX_APP_SERVER_WS_SOCKS_PROXY=
EOF
}

normalize_auth_mode() {
    case "$1" in
        oauth|openai|official)
            printf 'oauth\n'
            ;;
        api|proxy|custom)
            printf 'api\n'
            ;;
        *)
            return 1
            ;;
    esac
}

read_saved_mode() {
    if [ -f "$MODE_FILE" ]; then
        tr -d '[:space:]' < "$MODE_FILE"
    fi
}

save_mode() {
    mkdir -p "$(dirname "$MODE_FILE")"
    printf '%s\n' "$1" > "$MODE_FILE"
}

detect_mode_from_launcher_name() {
    case "$(basename "$0")" in
        *oauth*)
            printf 'oauth\n'
            ;;
        *api*|*proxy*)
            printf 'api\n'
            ;;
        *)
            return 1
            ;;
    esac
}

load_proxy_token_from_env_file() {
    local env_file="$1"
    [ -f "$env_file" ] || return 1

    python3 - "$env_file" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
for raw_line in path.read_text(errors='ignore').splitlines():
    line = raw_line.strip()
    if not line or line.startswith('#'):
        continue
    if line.startswith('export '):
        line = line[len('export '):].strip()
    if not line.startswith('PROXY_AUTH_TOKEN='):
        continue
    value = line.split('=', 1)[1].strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
        value = value[1:-1]
    print(value)
    break
PY
}

resolve_proxy_env_file() {
    local generic_env="${CODEX_PROXY_ENV_FILE:-}"
    local legacy_env="${PROXX_ENV_FILE:-}"
    local default_env="$CONFIG_DIR/proxy.env"

    if [ -n "$generic_env" ]; then
        printf '%s\n' "$generic_env"
        return 0
    fi

    if [ -n "$legacy_env" ]; then
        printf '%s\n' "$legacy_env"
        return 0
    fi

    printf '%s\n' "$default_env"
}

resolve_codex_cli() {
    local candidates=()
    local candidate

    if [ -n "${CODEX_CLI_PATH:-}" ]; then
        candidates+=("$CODEX_CLI_PATH")
    fi
    if [ -n "${CUSTOM_CLI_PATH:-}" ]; then
        candidates+=("$CUSTOM_CLI_PATH")
    fi

    # Prefer native codex binary when the shell command is a JS wrapper.
    if command -v codex >/dev/null 2>&1; then
        local codex_cmd real_cmd openai_dir native
        codex_cmd="$(command -v codex)"
        real_cmd="$(readlink -f "$codex_cmd" 2>/dev/null || true)"
        [ -n "$real_cmd" ] || real_cmd="$codex_cmd"

        # Typical layout: .../@openai/codex/bin/codex.js
        openai_dir="$(dirname "$(dirname "$real_cmd")")"
        openai_dir="$(dirname "$openai_dir")"
        if [ -d "$openai_dir" ]; then
            while IFS= read -r native; do
                [ -n "$native" ] && candidates+=("$native")
            done < <(find "$openai_dir" -maxdepth 6 -type f -path "*/codex-linux-*/vendor/*/codex/codex" 2>/dev/null | sort)
        fi

        candidates+=("$codex_cmd")
    fi

    # Common Bun global install fallback.
    local arch pkg triple
    case "$(uname -m)" in
        x86_64)
            pkg="codex-linux-x64"
            triple="x86_64-unknown-linux-musl"
            ;;
        aarch64|arm64)
            pkg="codex-linux-arm64"
            triple="aarch64-unknown-linux-musl"
            ;;
        *)
            pkg=""
            triple=""
            ;;
    esac
    if [ -n "$pkg" ]; then
        candidates+=("$HOME/.bun/install/global/node_modules/@openai/$pkg/vendor/$triple/codex/codex")
    fi

    for candidate in "${candidates[@]}"; do
        [ -n "$candidate" ] || continue
        if [ -d "$candidate" ] && [ -f "$candidate/codex" ]; then
            candidate="$candidate/codex"
        fi
        if [ -f "$candidate" ] && [ -x "$candidate" ]; then
            printf '%s\n' "$candidate"
            return 0
        fi
    done

    return 1
}

is_webview_ready() {
    python3 - "$PORT" <<'PY' >/dev/null 2>&1
import socket
import sys

port = int(sys.argv[1])
for host in ("127.0.0.1", "localhost"):
    try:
        with socket.create_connection((host, port), timeout=0.25):
            sys.exit(0)
    except OSError:
        pass

sys.exit(1)
PY
}

start_webview_server() {
    python3 - "$WEBVIEW_DIR" "$PORT" >"$SCRIPT_DIR/http-server.log" 2>&1 <<'PY' &
import http.server
import os
import socketserver
import sys

webview_dir = sys.argv[1]
port = int(sys.argv[2])
os.chdir(webview_dir)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        return

class ReuseTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

with ReuseTCPServer(("127.0.0.1", port), Handler) as server:
    server.serve_forever()
PY
    HTTP_PID=$!
}

resolve_auth_mode() {
    local candidate=""

    if [ -n "${CODEX_AUTH_MODE:-}" ]; then
        if candidate="$(normalize_auth_mode "$CODEX_AUTH_MODE" 2>/dev/null)"; then
            printf '%s\n' "$candidate"
            return 0
        fi
        echo "Warning: invalid CODEX_AUTH_MODE=$CODEX_AUTH_MODE (expected oauth or api)" >&2
    fi

    if [ -n "${AUTH_MODE_OVERRIDE:-}" ]; then
        printf '%s\n' "$AUTH_MODE_OVERRIDE"
        return 0
    fi

    if candidate="$(detect_mode_from_launcher_name 2>/dev/null)"; then
        printf '%s\n' "$candidate"
        return 0
    fi

    candidate="$(read_saved_mode 2>/dev/null || true)"
    if [ -n "$candidate" ] && candidate="$(normalize_auth_mode "$candidate" 2>/dev/null)"; then
        printf '%s\n' "$candidate"
        return 0
    fi

    if candidate="$(normalize_auth_mode "$DEFAULT_AUTH_MODE" 2>/dev/null)"; then
        printf '%s\n' "$candidate"
        return 0
    fi

    printf 'api\n'
}

apply_auth_mode_env() {
    local mode="$1"
    local proxy_base="${CODEX_PROXY_BASE_URL:-http://127.0.0.1:8789/v1}"
    local proxy_env_file
    proxy_env_file="$(resolve_proxy_env_file)"
    local proxy_token="${CODEX_PROXY_TOKEN:-}"

    case "$mode" in
        oauth)
            unset OPENAI_BASE_URL OPENAI_API_KEY CODEX_API_BASE_URL
            export CODEX_PROXY_ENABLED=0
            echo "Auth mode: oauth (official OpenAI login)"
            ;;
        api)
            if [ -z "$proxy_token" ] && [ -f "$proxy_env_file" ]; then
                proxy_token="$(load_proxy_token_from_env_file "$proxy_env_file" || true)"
            fi

            if [ -z "$proxy_token" ]; then
                echo "Error: API mode selected, but no proxy token was found." >&2
                echo "Set CODEX_PROXY_TOKEN or add PROXY_AUTH_TOKEN to $proxy_env_file" >&2
                exit 1
            fi

            export CODEX_PROXY_ENABLED=1
            export OPENAI_BASE_URL="$proxy_base"
            export OPENAI_API_KEY="$proxy_token"
            export CODEX_API_BASE_URL="$proxy_base"

            echo "Auth mode: api (custom proxy: $proxy_base)"
            ;;
        *)
            echo "Error: unsupported auth mode: $mode" >&2
            exit 1
            ;;
    esac
}

parse_ws_host_port() {
    python3 - "$1" <<'PY'
from urllib.parse import urlparse
import sys

url = sys.argv[1]
parsed = urlparse(url)
if parsed.scheme not in {"ws", "wss"}:
    raise SystemExit(1)
host = parsed.hostname
port = parsed.port
if not host or not port:
    raise SystemExit(1)
print(host)
print(port)
PY
}

is_ws_listener_ready() {
    local ws_url="$1"
    local host port

    if ! mapfile -t _ws_parts < <(parse_ws_host_port "$ws_url" 2>/dev/null); then
        return 1
    fi
    host="${_ws_parts[0]:-}"
    port="${_ws_parts[1]:-}"
    [ -n "$host" ] && [ -n "$port" ] || return 1

    python3 - "$host" "$port" <<'PY' >/dev/null 2>&1
import socket
import sys

host = sys.argv[1]
port = int(sys.argv[2])
try:
    with socket.create_connection((host, port), timeout=0.5):
        pass
except OSError:
    raise SystemExit(1)
PY
}

start_listening_app_server() {
    local listen_url="$1"
    local connect_url="$2"
    local log_file="${CODEX_APP_SERVER_LOG_FILE:-$APP_SERVER_STATE_DIR/app-server.log}"
    local pid_file="${CODEX_APP_SERVER_PID_FILE:-$APP_SERVER_STATE_DIR/app-server.pid}"
    local pid=""

    mkdir -p "$APP_SERVER_STATE_DIR"

    if is_ws_listener_ready "$connect_url"; then
        echo "App server: reusing websocket listener at $connect_url"
        return 0
    fi

    if [ -f "$pid_file" ]; then
        pid="$(tr -d '[:space:]' < "$pid_file" 2>/dev/null || true)"
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "App server: restarting stale listener process $pid for $connect_url"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
            pid=""
        else
            rm -f "$pid_file"
            pid=""
        fi
    fi

    if [ -z "$pid" ]; then
        echo "App server: starting websocket listener at $listen_url"
        nohup "$CODEX_CLI_PATH" app-server --analytics-default-enabled --listen "$listen_url" \
            >>"$log_file" 2>&1 < /dev/null &
        pid=$!
        printf '%s\n' "$pid" > "$pid_file"
    fi

    for _ in $(seq 1 80); do
        if is_ws_listener_ready "$connect_url"; then
            echo "App server: websocket listener ready at $connect_url"
            return 0
        fi
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "Error: app-server listener exited before becoming ready. See $log_file" >&2
            return 1
        fi
        sleep 0.1
    done

    echo "Error: app-server listener did not become ready at $connect_url. See $log_file" >&2
    return 1
}

configure_app_server_transport() {
    local listen_url="${CODEX_APP_SERVER_LISTEN_URL:-ws://0.0.0.0:9234}"
    local connect_url="${CODEX_APP_SERVER_WS_URL:-$listen_url}"

    if [ "${CODEX_APP_SERVER_FORCE_CLI:-0}" = "1" ]; then
        unset CODEX_APP_SERVER_WS_URL
        echo "App server transport: stdio (CODEX_APP_SERVER_FORCE_CLI=1)"
        return 0
    fi

    export CODEX_APP_SERVER_WS_URL="$connect_url"
    start_listening_app_server "$listen_url" "$connect_url"
}

AUTH_MODE_OVERRIDE=""
ACTION="launch"
POSITIONAL_ARGS=()
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help|help)
            print_usage
            exit 0
            ;;
        status|mode)
            ACTION="status"
            shift
            ;;
        toggle)
            ACTION="toggle"
            shift
            ;;
        use)
            [ $# -ge 2 ] || {
                echo "Error: use requires oauth or api" >&2
                exit 1
            }
            if ! AUTH_MODE_OVERRIDE="$(normalize_auth_mode "$2")"; then
                echo "Error: invalid auth mode: $2" >&2
                exit 1
            fi
            ACTION="use"
            shift 2
            ;;
        --auth-mode)
            [ $# -ge 2 ] || {
                echo "Error: --auth-mode requires oauth or api" >&2
                exit 1
            }
            if ! AUTH_MODE_OVERRIDE="$(normalize_auth_mode "$2")"; then
                echo "Error: invalid auth mode: $2" >&2
                exit 1
            fi
            shift 2
            ;;
        --auth-mode=*)
            if ! AUTH_MODE_OVERRIDE="$(normalize_auth_mode "${1#*=}")"; then
                echo "Error: invalid auth mode: ${1#*=}" >&2
                exit 1
            fi
            shift
            ;;
        oauth|api)
            if [ -z "$AUTH_MODE_OVERRIDE" ] && [ "$ACTION" = "launch" ] && [ ${#POSITIONAL_ARGS[@]} -eq 0 ]; then
                AUTH_MODE_OVERRIDE="$1"
                shift
            else
                POSITIONAL_ARGS+=("$1")
                shift
            fi
            ;;
        *)
            POSITIONAL_ARGS+=("$1")
            shift
            ;;
    esac
done
set -- "${POSITIONAL_ARGS[@]}"

AUTH_MODE="$(resolve_auth_mode)"
PROFILE_DIR="${CODEX_USER_DATA_DIR:-$PROFILE_ROOT/$AUTH_MODE}"

case "$ACTION" in
    status)
        echo "Current auth mode: $AUTH_MODE"
        echo "Mode file: $MODE_FILE"
        echo "Profile dir: $PROFILE_DIR"
        if [ "${CODEX_APP_SERVER_FORCE_CLI:-0}" = "1" ]; then
            echo "App server transport: stdio"
        else
            echo "App server transport: websocket"
            echo "App server listen URL: ${CODEX_APP_SERVER_LISTEN_URL:-ws://0.0.0.0:9234}"
            echo "App server connect URL: ${CODEX_APP_SERVER_WS_URL:-${CODEX_APP_SERVER_LISTEN_URL:-ws://0.0.0.0:9234}}"
            echo "App server log: ${CODEX_APP_SERVER_LOG_FILE:-$APP_SERVER_STATE_DIR/app-server.log}"
            if [ -n "${CODEX_APP_SERVER_WS_SOCKS_PROXY:-}" ]; then
                echo "App server ws socks proxy: ${CODEX_APP_SERVER_WS_SOCKS_PROXY}"
            else
                echo "App server ws socks proxy: disabled for local/private URLs by default"
            fi
        fi
        if [ "$AUTH_MODE" = "api" ]; then
            echo "Proxy base: ${CODEX_PROXY_BASE_URL:-http://127.0.0.1:8789/v1}"
            if [ -n "${CODEX_PROXY_TOKEN:-}" ]; then
                echo "Proxy token: set via CODEX_PROXY_TOKEN"
            else
                proxy_env_file="$(resolve_proxy_env_file)"
                if [ -f "$proxy_env_file" ]; then
                    echo "Proxy token file: $proxy_env_file"
                else
                    echo "Proxy token: not configured"
                fi
            fi
        fi
        exit 0
        ;;
    use)
        save_mode "$AUTH_MODE"
        echo "Saved default auth mode: $AUTH_MODE"
        exit 0
        ;;
    toggle)
        if [ "$AUTH_MODE" = "oauth" ]; then
            AUTH_MODE="api"
        else
            AUTH_MODE="oauth"
        fi
        save_mode "$AUTH_MODE"
        echo "Saved default auth mode: $AUTH_MODE"
        exit 0
        ;;
    launch)
        ;;
    *)
        echo "Error: unsupported action: $ACTION" >&2
        exit 1
        ;;
esac

HTTP_PID=""
if [ -d "$WEBVIEW_DIR" ] && [ "$(ls -A "$WEBVIEW_DIR" 2>/dev/null)" ]; then
    cd "$WEBVIEW_DIR"

    # Reuse an already-running server if present (avoid TIME_WAIT bind failures).
    if ! is_webview_ready; then
        start_webview_server
        trap 'if [ -n "${HTTP_PID:-}" ]; then kill "$HTTP_PID" 2>/dev/null || true; fi' EXIT
    fi

    # Wait briefly for server readiness.
    for _ in $(seq 1 40); do
        if is_webview_ready; then
            break
        fi
        sleep 0.1
    done

    if ! is_webview_ready; then
        echo "Warning: webview server on localhost:$PORT did not become ready"
    fi
fi

if ! CODEX_BIN="$(resolve_codex_cli)"; then
    echo "Error: Codex CLI binary not found. Install with: npm i -g @openai/codex"
    echo "Or run with: CODEX_CLI_PATH=/absolute/path/to/codex $0"
    exit 1
fi

export CODEX_CLI_PATH="$CODEX_BIN"
apply_auth_mode_env "$AUTH_MODE"

# Help codex find sibling helper binaries (e.g. rg in ../path).
CODEX_BIN_DIR="$(dirname "$CODEX_CLI_PATH")"
if [ -d "$CODEX_BIN_DIR/../path" ]; then
    export PATH="${PATH}:$CODEX_BIN_DIR:$CODEX_BIN_DIR/../path"
else
    export PATH="${PATH}:$CODEX_BIN_DIR"
fi

configure_app_server_transport

cd "$SCRIPT_DIR"

ELECTRON_ARGS=(--no-sandbox)
HAS_OZONE_ARG=0
HAS_DISABLE_GPU_ARG=0
HAS_DISABLE_GPU_COMP_ARG=0
HAS_USER_DATA_DIR_ARG=0
for arg in "$@"; do
    if [[ "$arg" == --ozone-platform=* ]]; then
        HAS_OZONE_ARG=1
    fi
    if [[ "$arg" == "--disable-gpu" ]]; then
        HAS_DISABLE_GPU_ARG=1
    fi
    if [[ "$arg" == "--disable-gpu-compositing" ]]; then
        HAS_DISABLE_GPU_COMP_ARG=1
    fi
    if [[ "$arg" == --user-data-dir=* ]] || [[ "$arg" == "--user-data-dir" ]]; then
        HAS_USER_DATA_DIR_ARG=1
    fi
done

if [ "$HAS_USER_DATA_DIR_ARG" -eq 0 ]; then
    mkdir -p "$PROFILE_DIR"
    ELECTRON_ARGS+=("--user-data-dir=$PROFILE_DIR")
fi

echo "Profile dir: $PROFILE_DIR"

# Wayland can cause oversized/whitespace window issues in this extracted build.
# Default to X11 backend on Wayland sessions, but allow override.
if [ "$HAS_OZONE_ARG" -eq 0 ]; then
    if [ -n "${CODEX_OZONE_PLATFORM:-}" ]; then
        ELECTRON_ARGS+=("--ozone-platform=${CODEX_OZONE_PLATFORM}")
        export ELECTRON_OZONE_PLATFORM_HINT="${CODEX_OZONE_PLATFORM}"
    elif [ -n "${WAYLAND_DISPLAY:-}" ]; then
        ELECTRON_ARGS+=("--ozone-platform=x11")
        export ELECTRON_OZONE_PLATFORM_HINT="x11"
    fi
fi

# Work around X11/XWayland repaint ghosting seen during zoom changes.
# Keep GPU available (full --disable-gpu can break Codex renderer on this build).
# Opt out with: CODEX_DISABLE_GPU_COMPOSITING=0 ./start.sh
if [ "$HAS_DISABLE_GPU_COMP_ARG" -eq 0 ] && [ "${CODEX_DISABLE_GPU_COMPOSITING:-1}" != "0" ]; then
    ELECTRON_ARGS+=("--disable-gpu-compositing")
fi

# Optional hard fallback (off by default): CODEX_DISABLE_GPU=1 ./start.sh
if [ "$HAS_DISABLE_GPU_ARG" -eq 0 ] && [ "${CODEX_DISABLE_GPU:-0}" = "1" ]; then
    ELECTRON_ARGS+=("--disable-gpu")
fi

"$SCRIPT_DIR/electron" "${ELECTRON_ARGS[@]}" "$@"
SCRIPT

    chmod +x "$INSTALL_DIR/start.sh"

    cat > "$INSTALL_DIR/start-oauth.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/start.sh" oauth "$@"
SCRIPT

    cat > "$INSTALL_DIR/start-api.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/start.sh" api "$@"
SCRIPT

    cat > "$INSTALL_DIR/use-oauth.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/start.sh" use oauth
SCRIPT

    cat > "$INSTALL_DIR/use-api.sh" << 'SCRIPT'
#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
exec "$SCRIPT_DIR/start.sh" use api
SCRIPT

    chmod +x \
        "$INSTALL_DIR/start-oauth.sh" \
        "$INSTALL_DIR/start-api.sh" \
        "$INSTALL_DIR/use-oauth.sh" \
        "$INSTALL_DIR/use-api.sh"

    info "Start scripts created (start.sh, start-oauth.sh, start-api.sh, use-oauth.sh, use-api.sh)"
}

# ---- Main ----
main() {
    echo "============================================" >&2
    echo "  Codex Desktop for Linux — Installer"       >&2
    echo "  (Beta channel with remote connections)"    >&2
    echo "============================================" >&2
    echo ""                                             >&2

    check_deps

    local archive_path=""
    if [ $# -ge 1 ] && [ -e "$1" ]; then
        archive_path="$(realpath "$1")"
        if [ -d "$archive_path" ] && [[ "$archive_path" == *.app ]]; then
            info "Using provided .app bundle: $archive_path"
        else
            info "Using provided archive: $archive_path"
        fi
    else
        # Default to beta ZIP; use CODEX_APP_URL=<dmg-url> for prod channel
        if [[ "$APP_URL" == *.zip ]]; then
            archive_path=$(get_zip)
        else
            archive_path=$(get_dmg)
        fi
    fi

    local app_dir
    app_dir=$(extract_app "$archive_path")

    patch_asar "$app_dir"
    download_electron
    extract_webview "$app_dir"
    install_app
    create_start_script

    if ! command -v codex &>/dev/null; then
        warn "Codex CLI not found. Install it: npm i -g @openai/codex"
    fi

    echo ""                                             >&2
    echo "============================================" >&2
    info "Installation complete!"
    echo "  Launch default mode:  $INSTALL_DIR/start.sh"        >&2
    echo "  Launch OAuth mode:    $INSTALL_DIR/start-oauth.sh"  >&2
    echo "  Launch API mode:      $INSTALL_DIR/start-api.sh"    >&2
    echo "  Save OAuth default:   $INSTALL_DIR/use-oauth.sh"    >&2
    echo "  Save API default:     $INSTALL_DIR/use-api.sh"      >&2
    echo "============================================" >&2
}

main "$@"
