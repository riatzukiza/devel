## Signal

(己, p=0.94) Fixed the duplicate-tool conflict.

(己, p=0.93) Cause: even though `settings.json` had been migrated to package-root `dist/pi/...` targets, the old copied extension directories still existed under:

- `~/.pi/agent/extensions/cljs-*`
- `~/.config/opencode/plugins/<name>`

(己, p=0.84) Pi was still seeing/loading old extension paths, causing conflicts like:

- old: `/home/err/.pi/agent/extensions/cljs-chronos/index.ts`
- new: `/home/err/devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions/dist/pi/cljs-chronos/index.ts`

(己, p=0.92) I updated the build script so every build now:

1. builds package-root targets,
2. removes managed legacy host copies,
3. syncs Pi/OpenCode config.

(己, p=0.95) I also removed the stale legacy host copies now. No `~/.pi/agent/extensions/cljs-*` directories remain.

## Evidence

(己, p=0.95) Ran:

```bash
pnpm -C /home/err/devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions run build
```

(己, p=0.95) Verified:

```bash
find ~/.pi/agent/extensions -maxdepth 1 -type d -name 'cljs-*'
```

returned nothing.

(己, p=0.92) Pi settings now only include package-root eta-mu entries:

```text
~/devel/orgs/open-hax/eta-mu/packages/eta-mu-extensions/dist/pi/cljs-*/index.ts
```

(己, p=0.9) Commits:

- eta-mu submodule: `b1c696a remove legacy eta-mu host copies`
- workspace root: `c0bf2801 document eta-mu legacy copy cleanup`

## Frames

(世, p=0.86) Main frame: this was not a DSL/runtime bug; it was a migration hygiene bug from leaving old host-copy artifacts physically loadable.

(世, p=0.74) The “No models match pattern …” warnings are separate config hygiene warnings, not the extension conflict failure.

(世, p=0.67) If the same conflict appears once more, it is likely from an already-running Pi process retaining the old extension list in memory, not from current filesystem/config state.

## Countermoves

(己, p=0.9) Cleanup was scoped only to managed eta-mu generated copies matching manifest extension names.

(己, p=0.86) I did not remove unrelated extensions like:

- `~/.pi/agent/extensions/webpage-markdown.ts`
- `~/.pi/agent/extensions/apply-patch.ts`
- `~/devel/orgs/shuv/pi-mcp-adapter`

(己, p=0.82) The workspace still shows the eta-mu submodule as modified because there are pre-existing unrelated changes inside it; the files I changed for this fix are committed.

## Next

(汝, p=0.95) Restart Pi so the already-running process drops the old loaded extension paths.