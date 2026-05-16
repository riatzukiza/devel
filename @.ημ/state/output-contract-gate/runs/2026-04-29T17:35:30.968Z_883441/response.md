## Signal
(己, p=0.85) Yep—if Plasma is what launches your session (and your `i3-wm.service` proves it is), then “picom just exists” usually comes from **Plasma/XDG autostart**, not i3.

You have two clean options:

1) **Keep autostart, just toggle by killing/starting picom** (works even in a Plasma-launched session):

```i3
bindsym $mod+Shift+p exec --no-startup-id bash -lc 'pgrep -x picom >/dev/null && pkill -x picom || picom -b'
```

2) **Disable Plasma autostart for picom** (so it never unexpectedly comes back), and make i3 be the only controller:

Create `~/.config/autostart/picom.desktop` with:

```ini
[Desktop Entry]
Type=Application
Name=picom
Hidden=true
```

Then keep the same i3 toggle bind as above.

(己, p=0.7) If you want the “most correct” approach in a systemd-managed Plasma session: make picom a **systemd user service** and toggle with `systemctl --user start/stop picom`—but the process-toggle above is perfectly fine for your use case.

## Evidence
(己, p=0.9) Your session is launched by systemd user unit `~/.config/systemd/user/i3-wm.service` (“Launch Plasma with i3”).  
(己, p=0.9) `picom` is present as an XDG autostart app: `/etc/xdg/autostart/picom.desktop` (`Exec=picom`). That’s Plasma/session-managed, not i3 config.

## Frames
(己, p=0.65) “Design mode”: compositor off = most stable for pixel-perfect/ICC/weird transparency edge cases; killing picom is the simplest switch.  
(己, p=0.6) “Plasma-managed session”: avoid surprise restarts by overriding autostart in `~/.config/autostart`.  
(己, p=0.55) “Systemd purity”: if you want clean toggling + logs + no duplicates, run picom as a user service.

## Countermoves
(己, p=0.7) If picom immediately respawns after you kill it, that means something is supervising it (autostart retry, another script, etc.). Disabling autostart with `Hidden=true` fixes that.  
(己, p=0.6) If KDE’s compositor (KWin) is also involved, you can get “another composite manager is already running” errors. In that case, make sure only one compositor is enabled at a time (either KWin compositor or picom).

## Next
(汝, p=0.8) Tell me which behavior you want: **(A)** picom starts automatically at login, or **(B)** picom only runs when you press the i3 toggle.