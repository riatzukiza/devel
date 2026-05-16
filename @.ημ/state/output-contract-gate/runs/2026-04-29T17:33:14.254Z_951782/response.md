## Signal
(己, p=0.85) You can find out *who* is starting picom by checking these in order (run in a terminal):

```sh
# 1) Is it running, and with what args?
pgrep -a picom

# 2) If it’s managed by systemd --user, this will show it
systemctl --user status picom.service
systemctl --user list-units --type=service | rg -i picom

# 3) If i3 starts it, it’ll usually be in your i3 config
rg -n "picom|compton" ~/.config/i3/config ~/.config/i3/config.d 2>/dev/null

# 4) Common X session / login autostart places
rg -n "picom|compton" ~/.xprofile ~/.profile ~/.xinitrc ~/.xsession ~/.xsessionrc 2>/dev/null

# 5) XDG autostart desktop entries
rg -n "picom|compton" ~/.config/autostart /etc/xdg/autostart 2>/dev/null
```

(己, p=0.8) Once you know the startup method, use the matching i3 keybind:

- If `systemctl --user status picom.service` shows a real service: use systemd toggling:

```i3
bindsym $mod+Shift+p exec --no-startup-id bash -lc 'systemctl --user is-active --quiet picom && systemctl --user stop picom || systemctl --user start picom'
```

- If there’s no systemd service (most common): use process toggling (works regardless of where it was launched):

```i3
bindsym $mod+Shift+p exec --no-startup-id bash -lc 'pgrep -x picom >/dev/null && pkill -x picom || (picom -b)'
```

## Evidence
(己, p=0.75) `pgrep -a` shows the running command line, which often reveals config flags and whether it’s a “daemonized” instance.  
(己, p=0.8) If picom is supervised by `systemd --user`, killing the process directly may cause it to auto-restart; `systemctl --user stop` won’t.

## Frames
(己, p=0.65) i3 config autostart: `exec --no-startup-id picom -b …` in `~/.config/i3/config` (or included files).  
(己, p=0.6) systemd user service: picom comes back after you kill it unless you stop the service.  
(己, p=0.55) XDG autostart / login scripts: started once per session via `~/.xprofile` or a `.desktop` file.

## Countermoves
(己, p=0.7) If you bind the process-toggle but picom keeps reappearing, that’s strong evidence it’s supervised (systemd or a session manager). Switch to the systemd toggle.  
(己, p=0.6) If `pgrep -a picom` shows special flags you rely on (e.g., `--config …`), copy those into the “start” side of the toggle so it restarts identically.

## Next
(汝, p=0.85) Paste the output of `pgrep -a picom` and (if non-empty) `systemctl --user status picom.service`, and I’ll tell you exactly which toggle to use and what start command to mirror.