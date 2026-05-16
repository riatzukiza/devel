## Signal

(ctx=己, p=0.96) MVP eta-mu npm publish is live enough to consume, and Knoxx is now pointed at the published SDK package.

(ctx=己, p=0.95) Published package set:

- `@open-hax/eta-mu-ai@0.70.5`
- `@open-hax/eta-mu-agent-core@0.70.5`
- `@open-hax/eta-mu-tui@0.70.5`
- `@open-hax/eta-mu-coding-agent@0.70.5`
- `@open-hax/output-contract-gate@0.1.0`
- `@open-hax/eta-mu-extensions@0.2.0`
- `@open-hax/eta-mu@0.1.0`
- `@open-hax/eta-mu-cli@0.1.0`

(ctx=己, p=0.95) Knoxx backend now consumes:

```json
"@open-hax/eta-mu": "^0.1.0"
```

instead of local `workspace:*`.

(ctx=己, p=0.95) Install shape:

```bash
npm install @open-hax/eta-mu
npm install -g @open-hax/eta-mu-cli
```

`@open-hax/eta-mu-cli` provides the `eta-mu` binary and injects the current eta-mu extension bundle.

## Evidence

(ctx=己, p=1.0) Commits created in `orgs/open-hax/eta-mu`:

- `b3028a3 Rescope eta-mu runtime packages for npm publish`
- `7b6f691 Repoint local extensions at eta-mu package imports`
- `7e095e1 Record eta-mu npm publish receipt`

(ctx=己, p=1.0) Previous eta-mu commits from this run remain relevant:

- `3f57947 Rename SDK package to open-hax eta-mu`
- `e14d101 Add audio input support to agent runtime`

(ctx=己, p=1.0) Knoxx/openplanner commits:

- `145b36a7 Switch Knoxx backend to eta-mu SDK`
- `e0dbc426 Use published eta-mu SDK package`
- `3a8b8caa Record eta-mu SDK migration receipt`
- `1b888cd Point Knoxx at published eta-mu package`
- `c9d30b5 Advance Knoxx eta-mu migration receipt`

(ctx=己, p=0.98) Verification passed:

- Built all publish packages.
- Ran npm pack dry-runs.
- Published all packages with `pnpm publish --access public --no-git-checks`.
- `npm access get status` reports public for checked packages.
- Direct tarball HEAD for `@open-hax/eta-mu@0.1.0` returned HTTP 200.
- `pnpm --dir orgs/open-hax/openplanner install` installed the published eta-mu dependency.
- Knoxx backend dynamic import passed:

```text
eta-mu npm ok function true
```

- Knoxx backend `pnpm typecheck` completed with existing warnings and `[:server] Build completed`.

(ctx=己, p=0.82) Caveat: `npm view @open-hax/eta-mu` still returned packument `E404` immediately after publish, while `npm dist-tag ls`, `npm access`, direct tarball fetch, and downstream `pnpm install` worked. This looks like registry packument lag or npm CLI/cache weirdness, not a failed publish.

## Frames

(ctx=己, p=0.92) Frame 1: We now have an npm-consumable eta-mu runtime line with the audio-capable forked packages, not just a local workspace alias.

(ctx=己, p=0.88) Frame 2: The rebrand is underway at the package/import level, but not complete at the product-language level: config dirs, CLI internals, docs prose, and legacy `.pi` compatibility still need deliberate migration.

(ctx=己, p=0.86) Frame 3: Knoxx is now the first downstream proving ground: it consumes the published umbrella SDK while keeping audio in its model input projection.

## Countermoves

(ctx=己, p=0.94) I did not clean or discard pre-existing uncommitted workspace state.

(ctx=己, p=0.9) Remaining eta-mu uncommitted state appears pre-existing or deliberately left out:

- deleted `current-ui.png`
- deleted render-deploy assets
- modified `custom_providers.cljs`
- modified local `pi/agent/extensions/custom-providers.ts`
- modified `spec/contracts-v1.edn`
- untracked notes/build files

(ctx=己, p=0.9) Remaining Knoxx dirty state also appears pre-existing/unrelated to the eta-mu SDK migration:

- `data/spawn_log`
- `data/taxonomy/sacred_errors.edn`
- novel contract files
- `hall_of_interop_shame.md`

## Next

(ctx=汝, p=0.9) Run a fresh Knoxx chat/audio-path smoke test against an audio-capable model using the published `@open-hax/eta-mu` dependency.