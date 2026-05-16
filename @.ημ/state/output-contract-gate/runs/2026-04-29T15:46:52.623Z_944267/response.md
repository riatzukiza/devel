## Signal

(己, p=0.78) Make Emacs’ *running server* handle “open” from file explorers by setting the default app for text/* MIME types to **emacsclient** (via an Emacs client `.desktop` launcher), then assigning that launcher as the default with `xdg-mime`.

### 1) Ensure the Emacs server is actually available
(己, p=0.75) If you already run Emacs as a **systemd user service**, you likely have this; still, the “open” action will only work if a server is up.

- Check server:
```bash
emacsclient -e "(emacs-pid)"
```
If that errors, start/enable your user service, or (temporary) start a server in the running Emacs:
```elisp
(server-start)
```

### 2) Create an `emacsclient` desktop launcher (recommended)
(己, p=0.8) Many distros ship one, but it’s inconsistent. Create your own so it’s deterministic.

Create: `~/.local/share/applications/emacsclient.desktop`
```ini
[Desktop Entry]
Type=Application
Name=Emacs (Client)
Comment=Edit text files using a running Emacs server
Exec=emacsclient -c -a "" %F
Terminal=false
Icon=emacs
Categories=Development;TextEditor;
MimeType=text/plain;text/markdown;text/x-chdr;text/x-csrc;text/x-c++src;text/x-python;text/x-shellscript;application/x-yaml;application/json;
StartupNotify=true
```

Notes:
- `-a ""` means: if no server is running, **don’t** auto-start a new Emacs (it will fail instead of silently launching a separate instance). If you *do* want fallback, use `-a emacs`.
- `-c` opens a GUI frame. If you prefer reuse of an existing frame, drop `-c` (but behavior varies by WM setup).

Then update the desktop database:
```bash
update-desktop-database ~/.local/share/applications
```

### 3) Set it as the default for text files (system-wide “Open With” behavior)
(己, p=0.8) This makes file managers (Dolphin, Nautilus, Thunar, etc.) use emacsclient as the default handler for those MIME types.

Set defaults:
```bash
xdg-mime default emacsclient.desktop text/plain
xdg-mime default emacsclient.desktop text/markdown
xdg-mime default emacsclient.desktop text/x-chdr
xdg-mime default emacsclient.desktop text/x-csrc
xdg-mime default emacsclient.desktop text/x-c++src
xdg-mime default emacsclient.desktop text/x-python
xdg-mime default emacsclient.desktop text/x-shellscript
xdg-mime default emacsclient.desktop application/json
xdg-mime default emacsclient.desktop application/x-yaml
```

Verify one:
```bash
xdg-mime query default text/plain
```
Should print:
```
emacsclient.desktop
```

### 4) KDE Dolphin-specific UI path (optional)
(己, p=0.7) If you prefer UI confirmation: right-click a `.txt` → **Open With** → **Other Application…** → pick your “Emacs (Client)” → check “Remember application association”.

This typically writes to:
- `~/.config/mimeapps.list` (or sometimes `~/.local/share/applications/mimeapps.list`)

## Evidence

(己, p=0.73) On most Linux desktops, file explorers resolve “default app” through the XDG MIME Apps spec, using `mimeapps.list` + `.desktop` launchers; `xdg-mime default … <mime>` is the standard CLI to set those defaults, and a `.desktop` `Exec=emacsclient … %F` is the standard way to route opens into a running Emacs server.

## Frames

(己, p=0.66) **Frame A: “I want *all* text-ish files to open in Emacsclient.”** Then you should map a bunch of MIME types (as above) and maybe iterate as you discover more (e.g. `text/x-rust`, `text/x-go`, etc.).

(己, p=0.63) **Frame B: “Only plain .txt / markdown.”** Then only set `text/plain` and `text/markdown`.

(己, p=0.6) **Frame C: “I want CLI emacsclient (terminal) not GUI frames.”** Then use:
- `Exec=emacsclient -t -a "" %F`
and ensure your explorer can launch terminal apps properly (varies by desktop).

## Countermoves

(己, p=0.7) If clicks still open something else: check what MIME type the file actually is:
```bash
xdg-mime query filetype path/to/file
```
Then set the default for *that* MIME type.

(己, p=0.68) If you end up with two `mimeapps.list` files: some desktops prioritize one location over another. Inspect:
- `~/.config/mimeapps.list`
- `~/.local/share/applications/mimeapps.list`

(己, p=0.64) If `emacsclient` opens a new Emacs instance: remove fallback by keeping `-a ""`, and ensure your user service keeps the server alive.

## Next

(汝, p=0.74) Create `~/.local/share/applications/emacsclient.desktop`, run `update-desktop-database ~/.local/share/applications`, then run `xdg-mime default emacsclient.desktop text/plain` and verify with `xdg-mime query default text/plain`.