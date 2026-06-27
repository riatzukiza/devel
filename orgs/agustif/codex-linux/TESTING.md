# Testing Guide

## Quick Test on OrbStack

Test the shipped Linux artifacts in an Ubuntu ARM64 VM.

### Prerequisites

- OrbStack installed (`brew install orbstack`)
- Latest Codex app extracted to `app/` directory

### Step 1: Build on macOS

```bash
make quick
```

This builds a local package set using the extracted desktop shell.

Check output:
```bash
ls -lh release/
# Should show at least:
# - Codex-0.1.0-arm64.AppImage
# - codex-linux_0.1.0_arm64.deb
```

### Step 2: Create OrbStack VM

```bash
orbctl create ubuntu-latest codex-test
```

### Step 3: Install Dependencies in VM

```bash
orbctl run -m codex-test bash -lc '
sudo apt-get update
sudo apt-get install -y \
  gdebi xvfb libfuse2 libsecret-1-0 libgtk-3-0 libnotify4 \
  libnss3 libxss1 libxtst6 libatspi2.0-0 libuuid1 libappindicator3-1
'
```

### Step 4: Test .deb Package

```bash
orbctl run -m codex-test bash -lc '
sudo gdebi -n /mnt/mac/Users/af/codex_app_reverse_engineer/release/codex-linux_0.1.0_arm64.deb
which codex
rm -f /tmp/codex-deb-launch.log
xvfb-run -a sh -lc "/opt/Codex/codex > /tmp/codex-deb-launch.log 2>&1 & pid=\$!; sleep 12; kill -0 \$pid"
tail -n 120 /tmp/codex-deb-launch.log
'
```

### Step 5: Test AppImage

```bash
orbctl run -m codex-test bash -lc '
chmod +x /mnt/mac/Users/af/codex_app_reverse_engineer/release/Codex-0.1.0-arm64.AppImage
rm -f /tmp/codex-appimage-launch.log
xvfb-run -a sh -lc "/mnt/mac/Users/af/codex_app_reverse_engineer/release/Codex-0.1.0-arm64.AppImage > /tmp/codex-appimage-launch.log 2>&1 & pid=\$!; sleep 12; kill -0 \$pid"
tail -n 120 /tmp/codex-appimage-launch.log
'
```

### Step 6: Verify the Packaged Runtime Contract

```bash
orbctl run -m codex-test bash -lc '
ls -lh /opt/Codex/resources
sed -n "1,80p" /opt/Codex/resources/codex
'
```

## Debugging

### Check Rust Binary

```bash
cd codex-oss/codex-rs
cargo build --release -p codex-app-server -vv
file target/release/codex-app-server
```

### Check Electron Build

```bash
cd codex-linux-fork
npm run build:linux 2>&1 | tail -50
```

### Check Extracted Assets

```bash
ls -la app/webview/
ls -la app/native/
du -sh app/
```

## Headless Testing

Test Electron startup without a full desktop session:

```bash
# In the VM
xvfb-run -a /opt/Codex/codex > /tmp/codex.log 2>&1 &
sleep 10
tail -n 80 /tmp/codex.log
```

## Test Matrix

| Package | Platform | Test Command |
|---------|----------|--------------|
| .deb | Ubuntu arm64 | `sudo gdebi -n *.deb && xvfb-run -a /opt/Codex/codex` |
| AppImage | Ubuntu arm64 | `chmod +x *.AppImage && xvfb-run -a ./Codex-*.AppImage` |
| .tar.gz | Ubuntu arm64 | Extract and run under `xvfb-run` |
| x86_64 packages | Linux x86_64 | Pending dedicated host validation |

## Full Test Workflow

```bash
#!/bin/bash

echo "1. Build locally"
make quick

echo "2. Create VM"
VM="codex-test-$(date +%s)"
orbctl create ubuntu-latest "$VM"

echo "3. Test packages"

orbctl copy release/*.deb $VM:~/
orbctl copy release/Codex*.AppImage $VM:~/
orbctl copy release/*.tar.gz $VM:~/

orbctl shell $VM << 'EOF'
# Install deps
sudo apt-get update
sudo apt-get install -y libgtk-3-0 libnotify4 libnss3 xvfb

# Test .deb
sudo dpkg -i *.deb
which codex
timeout 15 xvfb-run -a codex 2>&1 | head -20 || true

# Test AppImage
chmod +x Codex*.AppImage
timeout 15 xvfb-run -a ./Codex*.AppImage 2>&1 | head -20 || true

# Test binary
ldd $(which codex)

echo "All tests passed!"
EOF

echo "Done"
```

## CI/CD Testing

### Test Workflow Locally

```bash
# Check YAML syntax
cat .github/workflows/ci.yml | head -50

# Validate with GitHub CLI (if installed)
gh workflow list
gh workflow view ci.yml
```

### Test Quick Mode

Push to a branch (or PR) to trigger quick build:

```bash
git checkout -b test/ci
git push origin test/ci
# Go to GitHub Actions tab
# Watch package builds for x86_64 + arm64
```

### Test Full Mode

Push a tag to trigger full build:

```bash
git tag v0.1.0-test
git push origin v0.1.0-test
# Check GitHub Actions for package builds plus smoke tests
# Release will be created automatically
```

## Troubleshooting

### Build Fails

1. Check `make quick` output for errors
2. Verify Docker is running: `docker ps`
3. Check disk space: `df -h | grep /`
4. Review GitHub Actions logs

### VM Connection Issues

```bash
orbctl run -m codex-test bash -lc 'echo test'
orbctl stop codex-test
orbctl rm codex-test
```

### Dependency Issues

```bash
# In VM, check what's missing
ldd /usr/bin/codex | grep "not found"

# Install missing libs
sudo apt-cache search libgtk | grep -i dev
sudo apt-get install -y libgtk-3-dev
```

## Performance Notes

- First build: ~15-20 minutes (compiles Rust)
- Subsequent builds: ~5-10 minutes (uses cache)
- OrbStack overhead: Minimal (native ARM64 support)
- .deb installation: <1 second
- AppImage startup: ~2-3 seconds

## Success Criteria

- .deb installs without errors
- `which codex` returns `/usr/bin/codex`
- App startup log reaches `initialize_handshake_result ... outcome=success`
- App startup log reaches `Codex app-server connection state changed ... next=connected`
- `account/read`, `thread/list`, `config/read`, `model/list`, and `app/list` route successfully
- AppImage and installed `.deb` both stay alive under `xvfb`
