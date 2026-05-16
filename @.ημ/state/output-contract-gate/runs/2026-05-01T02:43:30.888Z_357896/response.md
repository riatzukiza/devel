## Signal

(己, p=0.99) Fixed and published.

(己, p=0.99) New published versions:
- `@open-hax/eta-mu-coding-agent@0.70.8`
- `@open-hax/eta-mu@0.1.3`
- `@open-hax/eta-mu-cli@0.1.3`

(己, p=0.99) The update banner no longer says:
- `Run pi update`
- `https://github.com/badlogic/pi-mono/...CHANGELOG.md`

(己, p=0.98) It now uses the actual package-manager command for eta-mu, e.g.:
- `npm install -g @open-hax/eta-mu-coding-agent`
- or pnpm/yarn/bun equivalent depending on install method

(己, p=0.98) It now points changelog/migration/release links at:
- `https://github.com/open-hax/eta-mu/...`

(己, p=0.99) Commits:
- `13f97ba Fix eta-mu update notification branding`
- `d7f3ada Remove upstream pi links from update prompts`
- Knoxx bumped through parent/submodule commits:
  - `4b9413ca Use eta-mu upstream-link cleanup patch`
  - `1a55453 Update Knoxx to eta-mu upstream-link cleanup patch`

## Evidence

(己, p=0.99) Build/test passed:
- `pnpm --dir orgs/open-hax/eta-mu/packages/coding-agent build`
- `pnpm --dir orgs/open-hax/eta-mu/packages/coding-agent exec vitest run test/version-check.test.ts`
- `pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-sdk build`
- `pnpm --dir orgs/open-hax/eta-mu/packages/eta-mu-cli build`

(己, p=0.99) Registry verification passed:
- `npm view @open-hax/eta-mu-coding-agent@0.70.8 version` → `0.70.8`
- `npm view @open-hax/eta-mu@0.1.3 version` → `0.1.3`
- `npm view @open-hax/eta-mu-cli@0.1.3 version` → `0.1.3`

(己, p=0.99) Fresh installed published package and verified:
- no `Run pi update`
- no old `badlogic/pi-mono/...CHANGELOG` update-link path
- new installed dist contains `open-hax/eta-mu` changelog/release links

## Frames

(世, p=0.9) That banner came from an older installed eta-mu build or the old upstream Pi package path still present in the update-notification renderer.

(己, p=0.95) The previous telemetry-free publish fixed telemetry but missed this specific user-visible update-banner path.

(己, p=0.86) If you still see `New version 0.71.0`, the running executable is still checking upstream `@mariozechner/pi-coding-agent`, meaning the shell is invoking the old `pi` package/binary rather than the eta-mu package.

## Countermoves

(己, p=0.98) I did not remove legacy `pi` binary compatibility; the `pi` command can still exist as an alias, but eta-mu’s own update messaging no longer tells users to update upstream Pi.

(己, p=0.98) I did not commit unrelated existing workspace changes.

(己, p=0.93) If a globally installed old `pi` binary is earlier in `$PATH`, no eta-mu package can change that binary until it is replaced or shadowed.

## Next

(汝, p=0.95) Run: `npm install -g @open-hax/eta-mu-cli@0.1.3`