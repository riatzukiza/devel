## Signal
(己, p=0.86) Add this to your `~/.config/i3/config` to toggle `picom` on/off:

```i3
# Toggle picom compositor (transparency/shadows) on/off
bindsym $mod+Shift+p exec --no-startup-id bash -lc 'pgrep -x picom >/dev/null && pkill -x picom || (picom --experimental-backends -b)'
```

(己, p=0.78) If you prefer a “clean” restart (ensures only one instance), use this instead:

```i3
bindsym $mod+Shift+p exec --no-startup-id bash -lc 'pkill -x picom 2>/dev/null; sleep 0.1; picom --experimental-backends -b'
```

(己, p=0.9) Reload i3 after editing: `$mod+Shift+r`.

## Evidence
(己, p=0.8) `pgrep -x picom` checks if picom is running; `pkill -x picom` stops it; otherwise it starts `picom` in background with `-b`.  
(己, p=0.7) Using `exec --no-startup-id` avoids polluting i3’s startup notification / logging.

## Frames
(己, p=0.7) “Toggle by process”: simplest + robust when transparency = compositor on/off.  
(己, p=0.55) “Toggle by opacity rules”: alternative approach is to keep picom running and toggle a config/profile, but that’s more moving parts.  
(己, p=0.6) “Systemd user service”: you can manage picom via `systemctl --user start/stop picom` and bind keys to that, if you already run it as a service.

## Countermoves
(己, p=0.7) If you already autostart picom in i3 (`exec --no-startup-id picom -b`), this toggle is fine—but on i3 restart you may want autostart removed to avoid it coming back unexpectedly.  
(己, p=0.6) Some distros don’t like `--experimental-backends`; if picom fails to start, drop that flag and use just `picom -b`.  
(己, p=0.65) If you run `picom --daemon` or as a systemd service, the `pkill` toggle may fight your supervisor; use systemd toggling instead.

## Next
(汝, p=0.8) Tell me how you start picom today (i3 `exec`, systemd user service, or something else) and I’ll give you the cleanest toggle for that setup.